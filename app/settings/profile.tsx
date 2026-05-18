import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Clipboard,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClinicStore } from '../../src/services/clinicAPI';

export default function ProfessionalSettingsScreen() {
  const router = useRouter();

  // Zustand State hooks
  const profile = useClinicStore((state) => state.profile);
  const updateProfessionalProfile = useClinicStore((state) => state.updateProfessionalProfile);
  const updateAppointmentRules = useClinicStore((state) => state.updateAppointmentRules);
  const isSyncing = useClinicStore((state) => state.isSyncing);

  // Meu Site local states
  const [domain, setDomain] = useState<string>(profile.officeDomain || '');
  const [isLinked, setIsLinked] = useState<boolean>(profile.officeDomainLinked);
  const [bio, setBio] = useState<string>(profile.bio);

  // Regras de Negócio local states
  const [sessionValue, setSessionValue] = useState<string>(profile.sessionValue.toString());
  const [firstValue, setFirstValue] = useState<string>(profile.firstSessionValue.toString());
  const [policy, setPolicy] = useState<string>(profile.cancellationPolicy);
  const [startHour, setStartHour] = useState<string>(profile.bookingRules.startHour);
  const [endHour, setEndHour] = useState<string>(profile.bookingRules.endHour);
  const [buffer, setBuffer] = useState<string>(profile.bookingRules.bufferMinutes.toString());
  const [lunchStart, setLunchStart] = useState<string>(profile.bookingRules.lunchStart);
  const [lunchEnd, setLunchEnd] = useState<string>(profile.bookingRules.lunchEnd);

  const shareLink = `https://${domain || 'psychflow.com'}/agendar?prof=${profile.id}`;

  const handleCopyLink = () => {
    Clipboard.setString(shareLink);
    Alert.alert("Link Copiado", "Seu link único de agendamento online foi copiado para a área de transferência!");
  };

  const handleSaveSettings = async () => {
    const valSession = parseFloat(sessionValue);
    const valFirst = parseFloat(firstValue);
    const minBuffer = parseInt(buffer);

    if (isNaN(valSession) || isNaN(valFirst) || isNaN(minBuffer)) {
      Alert.alert("Erro de Validação", "Por favor, garanta que os valores financeiros e o tempo de buffer sejam numéricos.");
      return;
    }

    try {
      // 1. Update Profile meta
      await updateProfessionalProfile({
        bio,
        officeDomain: domain,
        officeDomainLinked: isLinked,
        sessionValue: valSession,
        firstSessionValue: valFirst,
        cancellationPolicy: policy
      });

      // 2. Update Scheduling Rules
      await updateAppointmentRules({
        startHour,
        endHour,
        bufferMinutes: minBuffer,
        lunchStart,
        lunchEnd,
        workDays: profile.bookingRules.workDays
      });

      Alert.alert(
        "Configurações Sincronizadas",
        "Regras de negócio e metadados de presença digital atualizados e enviados ao site novo!"
      );
      router.back();
    } catch (e) {
      Alert.alert("Erro", "Falha ao persistir configurações.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ERP Clínico Configs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. SEÇÃO MEU SITE (Presença Digital) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Presença Digital (Meu Site)</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Domínio Clínico Associado</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: drasilva.com.br"
              placeholderTextColor="#94A3B8"
              value={domain}
              onChangeText={setDomain}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchTexts}>
                <Text style={styles.switchLabel}>Manter Site Ativo e Sincronizado</Text>
                <Text style={styles.switchSub}>Qualquer alteração no app reflete no site instantaneamente</Text>
              </View>
              <Switch
                value={isLinked}
                onValueChange={setIsLinked}
                trackColor={{ false: '#E2E8F0', true: '#4F46E5' }}
                thumbColor={isLinked ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            <Text style={styles.label}>Biografia do Perfil (Site)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              multiline={true}
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
            />

            {/* Generated Booking Link */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkLabel}>Link de Agendamento Online:</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>{shareLink}</Text>
              
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
                <Text style={styles.copyBtnText}>Copiar Link de Divulgação 📋</Text>
              </TouchableOpacity>
            </View>

            {/* Access telemetry statistics */}
            <View style={styles.analyticsBox}>
              <Text style={styles.analyticsTitle}>Cliques no Botão do Consultório (Site)</Text>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsVal}>{profile.analytics.cliques24h}</Text>
                  <Text style={styles.analyticsLabel}>Últimas 24 horas</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsVal}>{profile.analytics.cliques7d}</Text>
                  <Text style={styles.analyticsLabel}>Últimos 7 dias</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. SEÇÃO REGRAS DE NEGÓCIO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Regras de Negócio e Valores</Text>
          <View style={styles.card}>
            {/* Financial rules */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Valor Sessão (R$)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={sessionValue}
                  onChangeText={setSessionValue}
                />
              </View>

              <View style={[styles.col, { marginLeft: 12 }]}>
                <Text style={styles.label}>1ª Consulta (R$)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={firstValue}
                  onChangeText={setFirstValue}
                />
              </View>
            </View>

            <Text style={styles.label}>Política de Cancelamento</Text>
            <TextInput
              style={styles.textInput}
              value={policy}
              onChangeText={setPolicy}
            />

            {/* Time rules */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Início Expediente</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="08:00"
                  value={startHour}
                  onChangeText={setStartHour}
                />
              </View>

              <View style={[styles.col, { marginLeft: 12 }]}>
                <Text style={styles.label}>Fim Expediente</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="18:00"
                  value={endHour}
                  onChangeText={setEndHour}
                />
              </View>
            </View>

            {/* Buffer between sessions */}
            <Text style={styles.label}>Intervalo entre Sessões (Buffer min)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={buffer}
              onChangeText={setBuffer}
            />

            {/* Lunch breaks */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Início Almoço</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="12:00"
                  value={lunchStart}
                  onChangeText={setLunchStart}
                />
              </View>

              <View style={[styles.col, { marginLeft: 12 }]}>
                <Text style={styles.label}>Fim Almoço</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="13:00"
                  value={lunchEnd}
                  onChangeText={setLunchEnd}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>
            {isSyncing ? "Sincronizando..." : "Salvar e Sincronizar Ecossistema 🔄"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginRight: 16,
  },
  backBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchTexts: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  linkContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.04)',
    borderColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  linkUrl: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  copyBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4F46E5',
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  copyBtnText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  analyticsBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 8,
  },
  analyticsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  analyticsVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  analyticsLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
