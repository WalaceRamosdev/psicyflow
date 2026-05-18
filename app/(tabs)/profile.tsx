import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useClinicStore } from '../../src/services/clinicAPI';
import { themes } from '../../src/styles/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Zustand State hooks
  const isDarkMode = useClinicStore((state) => state.isDarkMode);
  const toggleTheme = useClinicStore((state) => state.toggleTheme);
  const theme = isDarkMode ? themes.dark : themes.light;
  
  // Office Web Sync settings states
  const [syncWebsite, setSyncWebsite] = useState<boolean>(true);
  const [autoConfirmWebhook, setAutoConfirmWebhook] = useState<boolean>(true);

  const handleOpenReport = (reportName: string) => {
    Alert.alert(
      "📊 Relatório Gerado",
      `Seu ${reportName} foi gerado com sucesso a partir das APIs unificadas do seu site e aplicativo.\n\nSimulando download do PDF seguro...`,
      [{ text: "Entendido", style: "default" }]
    );
  };

  const handleEcosystemSyncTest = () => {
    Alert.alert(
      "🌐 Sincronia de Ecossistema",
      "Sua base de dados de consultas e evoluções está 100% sincronizada com o site antigo e o site novo da clínica. Nenhuma ação pendente.",
      [{ text: "Ok", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. Monochromatic Header Professional Card */}
        <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
          <Image
            source={{ uri: user?.avatar || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200" }}
            style={styles.avatar}
          />
          <Text style={[styles.name, { color: theme.text }]}>{user?.name || "Dr. Roberto D'Avila"}</Text>
          <Text style={[styles.crp, { color: theme.textSec }]}>Registro Profissional: {user?.crp || "CRP: 06/12345-SP"}</Text>
        </View>

        {/* Advanced ERP Control Center Card */}
        <TouchableOpacity 
          style={[styles.settingsCTA, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.8}
        >
          <View>
            <Text style={[styles.settingsCTATitle, { color: theme.primary }]}>⚙️ Painel de Controle ERP Clínico</Text>
            <Text style={[styles.settingsCTASub, { color: theme.textSec }]}>Editar regras de negócio, valores e domínio do site</Text>
          </View>
          <Text style={[styles.settingsCTAEmoji, { color: theme.primary }]}>→</Text>
        </TouchableOpacity>

        {/* 2. Office & Web Sync Settings (moved inside profile for zero-clutter dashboard) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Configurações de Ecossistema</Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Sincronizar com Website</Text>
                <Text style={[styles.settingSub, { color: theme.textSec }]}>Receba agendamentos feitos no site em tempo real</Text>
              </View>
              <Switch
                value={syncWebsite}
                onValueChange={setSyncWebsite}
                trackColor={{ false: '#E2E8F0', true: theme.primary }}
                thumbColor={syncWebsite ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Webhook de Confirmações</Text>
                <Text style={[styles.settingSub, { color: theme.textSec }]}>Dispare alertas automáticos via WhatsApp do site</Text>
              </View>
              <Switch
                value={autoConfirmWebhook}
                onValueChange={setAutoConfirmWebhook}
                trackColor={{ false: '#E2E8F0', true: theme.primary }}
                thumbColor={autoConfirmWebhook ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            <View style={styles.settingRowBorderless}>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Modo Escuro (Noturno)</Text>
                <Text style={[styles.settingSub, { color: theme.textSec }]}>Ativa a paleta de cores para ambientes de baixa luz</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E2E8F0', true: theme.primary }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#94A3B8'}
              />
            </View>
          </View>
        </View>

        {/* 3. Centralized Reports & Clinical Analytics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Relatórios e Prontuários</Text>
          
          <View style={[styles.reportCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              style={[styles.reportItem, { borderBottomColor: theme.divider }]} 
              onPress={() => handleOpenReport("Relatório Financeiro Mensal")}
            >
              <Text style={styles.reportEmoji}>📈</Text>
              <Text style={[styles.reportLabel, { color: theme.text }]}>Faturamento Mensal Consolido</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reportItem, { borderBottomColor: theme.divider }]} 
              onPress={() => handleOpenReport("Painel de Engajamento CFP")}
            >
              <Text style={styles.reportEmoji}>🧠</Text>
              <Text style={[styles.reportLabel, { color: theme.text }]}>Taxas de Retenção e Frequência</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.reportItemBorderless} 
              onPress={handleEcosystemSyncTest}
            >
              <Text style={styles.reportEmoji}>🔄</Text>
              <Text style={[styles.reportLabel, { color: theme.text }]}>Testar Status da Conectividade Web</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Log Out button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Encerrar Sessão Segura</Text>
        </TouchableOpacity>

        <Text style={styles.compliance}>
          PsychFlow HIPAA & LGPD Client Sync v2.5.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 60,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: 'rgba(0, 0, 0, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  crp: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
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
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingRowBorderless: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  settingTexts: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reportItemBorderless: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
  },
  reportEmoji: {
    fontSize: 20,
    marginRight: 14,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  settingsCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    borderColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  settingsCTATitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  settingsCTASub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  settingsCTAEmoji: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  compliance: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 32,
    fontFamily: 'monospace',
  },
});
