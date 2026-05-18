import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Dimensions
} from 'react-native';
import { Appointment, Patient } from '../types';

interface ActionDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  appointment: Appointment;
  patient?: Patient;
  onUpdateStatus: (status: 'confirmed' | 'pending' | 'cancelled') => void;
  onToggleSubscription: () => void;
  onOpenNotes: () => void;
  onPrepareSession: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ActionDrawer: React.FC<ActionDrawerProps> = React.memo(({
  isVisible,
  onClose,
  appointment,
  patient,
  onUpdateStatus,
  onToggleSubscription,
  onOpenNotes,
  onPrepareSession,
}) => {
  const isPending = appointment.status === 'pending';
  const isConfirmed = appointment.status === 'confirmed';
  const isCancelled = appointment.status === 'cancelled';

  // Fallback patient values if not resolved
  const activePatient = useMemo<Patient>(() => {
    return patient || {
      id: appointment.patientId,
      name: appointment.patientName,
      email: 'paciente@ecosistema.com.br',
      cpf: '***.***.***-**',
      phone: '11999999999',
      avatar: appointment.patientAvatar,
      subscriptionStatus: 'inactive',
      sessionCount: 1,
      consecutiveMisses: 0,
      sessionsPerWeek: 1,
      clinicalReason: 'Diagnóstico Geral'
    };
  }, [patient, appointment]);

  const handleOpenWebsite = () => {
    const portalUrl = `https://psychflow.com/portal/patient/${activePatient.id}`;
    Alert.alert(
      "🌐 Ecossistema Web Integrado",
      `Deseja abrir o prontuário centralizado de ${activePatient.name} no Portal do Psicólogo do seu site? (Simula redirecionamento para o ecossistema)\n\nURL: ${portalUrl}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir no Navegador", onPress: () => Linking.openURL('https://google.com') }
      ]
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Clickable area outside drawer to close */}
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />

        <View style={styles.drawerContent}>
          {/* Header indicator */}
          <View style={styles.pullIndicator} />

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Header info */}
            <View style={styles.header}>
              <Text style={styles.patientName}>{activePatient.name}</Text>
              <Text style={styles.patientMeta}>
                CRP Responsável: 06/12345-SP | CPF: {activePatient.cpf}
              </Text>
            </View>

            {/* Quick Actions Grid (Minimal icons and short captions) */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionGridItem, isConfirmed && styles.actionGridItemActive]}
                onPress={() => onUpdateStatus('confirmed')}
              >
                <Text style={styles.actionEmoji}>🟢</Text>
                <Text style={styles.actionLabel}>Confirmar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionGridItem, isPending && styles.actionGridItemActive]}
                onPress={() => onUpdateStatus('pending')}
              >
                <Text style={styles.actionEmoji}>🟡</Text>
                <Text style={styles.actionLabel}>Pendente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionGridItem, isCancelled && styles.actionGridItemActive]}
                onPress={() => onUpdateStatus('cancelled')}
              >
                <Text style={styles.actionEmoji}>🔴</Text>
                <Text style={styles.actionLabel}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            {/* Clinician Workspace Prep */}
            {isConfirmed && (
              <TouchableOpacity style={styles.prepSessionBtn} onPress={onPrepareSession}>
                <Text style={styles.prepSessionText}>Preparar Consulta 🧠</Text>
              </TouchableOpacity>
            )}

            {/* Recurrence Switch */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faturamento Recorrente</Text>
              <TouchableOpacity style={styles.recurrenceBox} onPress={onToggleSubscription}>
                <View style={styles.recurrenceDetails}>
                  <Text style={styles.recurrenceIcon}>
                    {activePatient.subscriptionStatus === 'active' ? '💎' : '💳'}
                  </Text>
                  <View>
                    <Text style={styles.recurrenceText}>
                      {activePatient.subscriptionStatus === 'active' ? 'Assinatura Ativa (4 sessões/mês)' : 'Avulso (Cobrança Manual)'}
                    </Text>
                    <Text style={styles.recurrenceSub}>Clique para alternar o modelo de pagamento</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Ecossistema Web Section (Miniature Mockup) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ecossistema Integrado (Website)</Text>
              <View style={styles.mockupWebBrowser}>
                <View style={styles.mockupHeader}>
                  <View style={styles.mockupDotRed} />
                  <View style={styles.mockupDotYellow} />
                  <View style={styles.mockupDotGreen} />
                  <Text style={styles.mockupUrl}>psychflow.com/pacientes/portal</Text>
                </View>
                
                <View style={styles.mockupBody}>
                  <Text style={styles.mockupTitle}>{activePatient.name}</Text>
                  <View style={styles.mockupInfoRow}>
                    <Text style={styles.mockupInfoLabel}>Sessões Concluídas:</Text>
                    <Text style={styles.mockupInfoVal}>{activePatient.sessionCount}</Text>
                  </View>
                  <View style={styles.mockupInfoRow}>
                    <Text style={styles.mockupInfoLabel}>Vínculo/Frequência:</Text>
                    <Text style={styles.mockupInfoVal}>{activePatient.sessionsPerWeek}x p/ semana</Text>
                  </View>
                  <View style={styles.mockupInfoRow}>
                    <Text style={styles.mockupInfoLabel}>Sincronia API:</Text>
                    <Text style={[styles.mockupInfoVal, { color: '#4F46E5', fontWeight: 'bold' }]}>● Conectado Web</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.openWebBtn} onPress={handleOpenWebsite}>
                  <Text style={styles.openWebBtnText}>Visualizar no Site do Consultório 🌐</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Direct Prontuário access */}
            <TouchableOpacity style={styles.notesButton} onPress={onOpenNotes}>
              <Text style={styles.notesButtonText}>
                {appointment.notesFinalized ? "Ver Prontuário Criptografado 🔒" : "Registrar Nova Evolução Clínica 📝"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar Workspace</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Soft slate blur background
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 34,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 10,
  },
  pullIndicator: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 9999,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  patientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionGridItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  actionGridItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.03)',
  },
  actionEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  prepSessionBtn: {
    backgroundColor: '#4F46E5', // Sole Indigo CTA Brand highlight
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  prepSessionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  recurrenceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  recurrenceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recurrenceIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  recurrenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recurrenceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  /* WEB ECOSYSTEM PORTAL PREVIEW (MINI MOCKUP) */
  mockupWebBrowser: {
    backgroundColor: '#0F172A', // Dark stylish mockup for high contrast
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  mockupDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  mockupDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  mockupDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  mockupUrl: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  mockupBody: {
    padding: 16,
  },
  mockupTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mockupInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mockupInfoLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  mockupInfoVal: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
  openWebBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  openWebBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  notesButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    marginTop: 8,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
