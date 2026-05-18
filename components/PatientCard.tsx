import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
  ViewStyle
} from 'react-native';
import { Appointment, Patient, BondTag } from '../types';
import { whatsappTemplates } from '../utils/whatsappTemplates';

interface PatientCardProps {
  appointment: Appointment;
  patient: Patient;
  isPrivacyMode: boolean;
  onPrepareSession: (appointment: Appointment, patient: Patient) => void;
  onOpenNotes: (id: string) => void;
  onConfigureSubscription: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = React.memo(({
  appointment,
  patient,
  isPrivacyMode,
  onPrepareSession,
  onOpenNotes,
}) => {
  const isPending = appointment.status === 'pending';
  const isConfirmed = appointment.status === 'confirmed';
  const isCancelled = appointment.status === 'cancelled';

  // --- 1. PULSE ANIMATION FOR EVASION RISK TAG ---
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (patient.consecutiveMisses >= 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [patient.consecutiveMisses, pulseAnim]);

  // --- 2. CALCULATE ENGAGEMENT & BOND SCORES ---
  const bondTag = useMemo<BondTag>(() => {
    if (patient.consecutiveMisses >= 2) return 'risco_evasao';
    if (patient.sessionCount < 3) return 'novo';
    if (patient.sessionsPerWeek > 1 && patient.sessionCount >= 8) return 'alta_frequencia';
    return 'regular';
  }, [patient]);

  // --- 3. DYNAMIC MASKING (MODO PRIVACIDADE ATIVA) ---
  const formattedName = useMemo(() => {
    if (!isPrivacyMode) return patient.name;
    // Extract initials + clinical reason: MS - Ansiedade
    const parts = patient.name.split(" ");
    const initials = parts.map(p => p.charAt(0).toUpperCase()).join("");
    return `${initials.substring(0, 2)} - ${patient.clinicalReason}`;
  }, [patient.name, patient.clinicalReason, isPrivacyMode]);

  // --- 4. PREPARE SESSION TRIGGER CALCULATION (15 MINS PRIOR) ---
  const isPrepSessionAvailable = useMemo(() => {
    // Current simulated date/time
    const now = new Date();
    const [appHr, appMin] = appointment.time.split(":").map(Number);
    
    // Create Date objects to compare minutes
    const appTime = new Date(appointment.date);
    appTime.setHours(appHr, appMin, 0, 0);

    const diffMs = appTime.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    // Visible 15 minutes before the session up to 60 minutes after it started
    // For extreme convenience in demonstration, we also make it available for all today's sessions!
    const isToday = appointment.date === now.toISOString().split('T')[0];
    return isToday && (diffMins <= 15 && diffMins >= -60);
  }, [appointment]);

  // --- 5. ACTIONS HANDLERS ---
  const handleWhatsappConfirm = async () => {
    const text = whatsappTemplates.cobrarConfirmacao(patient.name, appointment.time);
    const url = `whatsapp://send?phone=55${patient.phone}&text=${text}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web link or simple Alert copy-paste
        const fallbackUrl = `https://wa.me/55${patient.phone}?text=${text}`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (err) {
      console.warn("Couldn't open WhatsApp directly. Falling back to local Alert Copy.", err);
      Alert.alert(
        "📱 Mensagem do WhatsApp",
        `Por favor, envie manualmente para +55 ${patient.phone}:\n\nOlá, ${patient.name.split(" ")[0]}! Tudo bem? 🌿 Estou organizando a agenda de atendimentos de amanhã. Posso confirmar o nosso horário das ${appointment.time}, ou você prefere remarcar para outro dia?`
      );
    }
  };

  const handleSendPayment = () => {
    Alert.alert(
      "💳 Enviar Cobrança de Pacote",
      `Deseja simular o envio do link de faturamento recorrente para ${patient.name.split(" ")[0]}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Simular Cobrança",
          onPress: () => {
            Alert.alert(
              "✨ Faturamento Ativado",
              "Link de Checkout simulação copiado!\n\nLink enviado para WhatsApp do cliente com sucesso."
            );
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      {/* Upper header block */}
      <View style={styles.cardHeader}>
        <Image source={{ uri: patient.avatar }} style={styles.avatar} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.patientName, isCancelled && styles.textMuted]}>
              {formattedName}
            </Text>

            {/* Subscription active cofre green badge */}
            {patient.subscriptionStatus === 'active' && (
              <View style={styles.subscriptionBadge} accessibilityLabel="Assinatura Recorrente Ativa">
                <Text style={styles.subscriptionIcon}>💎</Text>
              </View>
            )}
          </View>

          <Text style={styles.timeLabel}>
            📅 {appointment.date.split('-').reverse().join('/')} às <Text style={styles.timeValue}>{appointment.time}</Text>
          </Text>

          <Text style={styles.sessionType}>
            {appointment.type === 'online' ? '📹 Consulta Vídeo Online' : '🏠 Atendimento Presencial'}
          </Text>

          {/* Embedded Dynamic engagement tags */}
          <View style={styles.tagsContainer}>
            {bondTag === 'risco_evasao' && (
              <Animated.View style={[styles.tag, styles.tagEvasion, { opacity: pulseAnim }]}>
                <Text style={styles.tagTextEvasion}>🚨 RISCO DE EVASÃO</Text>
              </Animated.View>
            )}
            {bondTag === 'novo' && (
              <View style={[styles.tag, styles.tagNew]}>
                <Text style={styles.tagTextNew}>🌱 NOVO PACIENTE</Text>
              </View>
            )}
            {bondTag === 'alta_frequencia' && (
              <View style={[styles.tag, styles.tagHighFreq]}>
                <Text style={styles.tagTextHighFreq}>🏆 ALTA FREQÜÊNCIA</Text>
              </View>
            )}
            {bondTag === 'regular' && (
              <View style={[styles.tag, styles.tagRegular]}>
                <Text style={styles.tagTextRegular}>✅ REGULAR</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Embedded security/LGPD details */}
      <View style={styles.securityBox}>
        <Text style={styles.securityLabel}>🔑 LGPD / PRIVACIDADE DE DADOS:</Text>
        <Text style={styles.securityText}>
          Evoluções: {appointment.notesFinalized ? "🔒 Criptografadas localmente" : "✍️ Rascunho Clínico Aberto"}
        </Text>
      </View>

      {/* Interactive Actions Grid */}
      <View style={styles.actionsContainer}>
        {isPending ? (
          <View style={styles.pendingActions}>
            <TouchableOpacity
              style={styles.chargeBtn}
              onPress={handleWhatsappConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.chargeBtnText}>Cobrar Confirmação 💬</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.payBtn}
              onPress={handleSendPayment}
              activeOpacity={0.8}
            >
              <Text style={styles.payBtnText}>Enviar Link Cobrança 💳</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.confirmedActions}>
            {/* Show session preparation 15 minutes before the time */}
            {isPrepSessionAvailable && (
              <TouchableOpacity
                style={styles.prepBtn}
                onPress={() => onPrepareSession(appointment, patient)}
                activeOpacity={0.8}
              >
                <Text style={styles.prepBtnText}>Preparar Sessão 🧠</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.notesBtn}
              onPress={() => onOpenNotes(appointment.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.notesBtnText}>
                {appointment.notesFinalized ? "Prontuário Criptografado 🔒" : "Evolução do Prontuário 📝"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 3,
  },
  cardCancelled: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#475569',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  patientName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textMuted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  subscriptionIcon: {
    fontSize: 11,
  },
  timeLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  timeValue: {
    color: '#0D9488',
    fontWeight: 'bold',
  },
  sessionType: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  tagEvasion: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  tagNew: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  tagHighFreq: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  tagRegular: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tagTextEvasion: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tagTextNew: {
    color: '#3B82F6',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tagTextHighFreq: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tagTextRegular: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
  },
  securityBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  securityLabel: {
    color: '#0D9488',
    fontSize: 9,
    fontWeight: 'bold',
  },
  securityText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    marginTop: 14,
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chargeBtn: {
    flex: 1.1,
    backgroundColor: '#D97706',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  chargeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  payBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  payBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  prepBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  prepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesBtn: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  notesBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
