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
  Switch,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClinicStore } from '../../src/services/clinicAPI';
import { themes } from '../../src/styles/theme';

export default function ProfessionalSettingsScreen() {
  const router = useRouter();

  // Zustand State hooks
  const profile = useClinicStore((state) => state.profile);
  const updateProfessionalProfile = useClinicStore((state) => state.updateProfessionalProfile);
  const updateAppointmentRules = useClinicStore((state) => state.updateAppointmentRules);
  const isSyncing = useClinicStore((state) => state.isSyncing);
  const isDarkMode = useClinicStore((state) => state.isDarkMode);
  const theme = isDarkMode ? themes.dark : themes.light;

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
  const [pixKey, setPixKey] = useState<string>(profile.pixKey || '');

  const shareLink = `http://localhost:4321/${domain || profile.id}`;

  const handleCopyLink = () => {
    Clipboard.setString(shareLink);
    Alert.alert("Link Copiado", "Seu link de agendamento foi copiado para a área de transferência!");
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Olá! Agende sua consulta de psicoterapia de forma simples e segura pelo meu portal: ${shareLink}`,
      });
    } catch (err) {
      Alert.alert("Erro", "Não foi possível compartilhar o link.");
    }
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
        cancellationPolicy: policy,
        pixKey: pixKey
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header Banner */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: isDarkMode ? '#E2E8F0' : '#475569' }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>ERP Clínico Configs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. SEÇÃO MEU SITE (Presença Digital) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>🌐 Presença Digital (Meu Site)</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.textSec }]}>Domínio Clínico Associado</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Ex: drasilva.com.br"
              placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
              value={domain}
              onChangeText={setDomain}
            />

            <View style={[styles.switchRow, { borderBottomColor: theme.divider }]}>
              <View style={styles.switchTexts}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Manter Site Ativo e Sincronizado</Text>
                <Text style={[styles.switchSub, { color: theme.textSec }]}>Qualquer alteração no app reflete no site instantaneamente</Text>
              </View>
              <Switch
                value={isLinked}
                onValueChange={setIsLinked}
                trackColor={{ false: isDarkMode ? '#1E293B' : '#E2E8F0', true: theme.primary }}
                thumbColor={isLinked ? '#FFFFFF' : (isDarkMode ? '#475569' : '#94A3B8')}
              />
            </View>

            <Text style={[styles.label, { color: theme.textSec }]}>Biografia do Perfil (Site)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              multiline={true}
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
            />

            {/* Generated Booking Link */}
            <View style={[styles.linkContainer, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.04)', borderColor: theme.border }]}>
              <Text style={[styles.linkLabel, { color: theme.primary }]}>Link de Agendamento Online:</Text>
              <Text style={[styles.linkUrl, { color: theme.text }]} numberOfLines={1}>{shareLink}</Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.copyBtn, { flex: 1, marginRight: 8, backgroundColor: theme.card, borderColor: theme.primary }]} onPress={handleCopyLink}>
                  <Text style={[styles.copyBtnText, { color: theme.primary }]}>Copiar Link 📋</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.shareBtn, { flex: 1, backgroundColor: theme.primary }]} onPress={handleShareLink}>
                  <Text style={styles.shareBtnText}>Compartilhar 🔗</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Access telemetry statistics */}
            <View style={[styles.analyticsBox, { borderTopColor: theme.divider }]}>
              <Text style={[styles.analyticsTitle, { color: theme.textSec }]}>Cliques no Botão do Consultório (Site)</Text>
              <View style={styles.analyticsRow}>
                <View style={[styles.analyticsItem, { backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.analyticsVal, { color: theme.text }]}>{profile.analytics.cliques24h}</Text>
                  <Text style={[styles.analyticsLabel, { color: theme.textSec }]}>Últimas 24 horas</Text>
                </View>
                <View style={[styles.analyticsItem, { backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.analyticsVal, { color: theme.text }]}>{profile.analytics.cliques7d}</Text>
                  <Text style={[styles.analyticsLabel, { color: theme.textSec }]}>Últimos 7 dias</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. SEÇÃO REGRAS DE NEGÓCIO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>⚙️ Regras de Negócio e Valores</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {/* Financial rules */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: theme.textSec }]}>Valor Sessão (R$)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  keyboardType="numeric"
                  value={sessionValue}
                  onChangeText={setSessionValue}
                />
              </View>

              <View style={[styles.col, { marginLeft: 12 }]}>
                <Text style={[styles.label, { color: theme.textSec }]}>1ª Consulta (R$)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  keyboardType="numeric"
                  value={firstValue}
                  onChangeText={setFirstValue}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSec }]}>Política de Cancelamento</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={policy}
              onChangeText={setPolicy}
            />

            <Text style={[styles.label, { color: theme.textSec }]}>Chave PIX (Para Recebimentos)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Ex: seu-email@gmail.com ou CPF/CNPJ"
              placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
              value={pixKey}
              onChangeText={setPixKey}
            />

            {/* Time rules */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: theme.textSec }]}>Início Expediente</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder="08:00"
                  placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                  value={startHour}
                  onChangeText={setStartHour}
                />
              </View>

              <View style={[styles.col, { marginLeft: 12 }]}>
                <Text style={[styles.label, { color: theme.textSec }]}>Fim Expediente</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder="18:00"
                  placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                  value={endHour}
                  onChangeText={setEndHour}
                />
              </View>
            </View>

            {/* Buffer between sessions */}
            <Text style={[styles.label, { color: theme.textSec }]}>Intervalo entre Sessões (Buffer min)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              keyboardType="numeric"
              value={buffer}
              onChangeText={setBuffer}
            />

            {/* Lunch breaks */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: theme.textSec }]}>Início Almoço</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder="12:00"
                  placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                  value={lunchStart}
                  onChangeText={setLunchStart}
                />
              </View>

              <View style={[styles.col, { marginLeft: 12 }]}>
                <Text style={[styles.label, { color: theme.textSec }]}>Fim Almoço</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder="13:00"
                  placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                  value={lunchEnd}
                  onChangeText={setLunchEnd}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveSettings} activeOpacity={0.8}>
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
  },
  copyBtnText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  shareBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
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
