import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Clipboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClinicStore } from '../../src/services/clinicAPI';
import { themes } from '../../src/styles/theme';

export default function DashboardScreen() {
  const router = useRouter();

  // Zustand State hooks
  const appointments = useClinicStore((state) => state.appointments);
  const transactions = useClinicStore((state) => state.transactions);
  const profile = useClinicStore((state) => state.profile);
  const bootStore = useClinicStore((state) => state.bootStore);
  const syncWithWebEcosystem = useClinicStore((state) => state.syncWithWebEcosystem);
  const isOffline = useClinicStore((state) => state.isOffline);
  const isSyncing = useClinicStore((state) => state.isSyncing);
  const lastSyncTime = useClinicStore((state) => state.lastSyncTime);
  const isDarkMode = useClinicStore((state) => state.isDarkMode);

  const theme = isDarkMode ? themes.dark : themes.light;

  const [isFABOpen, setIsFABOpen] = useState<boolean>(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Boot clinical data on mount
  useEffect(() => {
    bootStore().then(() => {
      syncWithWebEcosystem();
    });
  }, []);

  // Filter today's list of slots
  const todayAppointments = useMemo(() => {
    return appointments.filter((ap) => ap.date === todayStr);
  }, [appointments, todayStr]);

  // --- DYNAMIC ERP STATS CALCULATIONS ---
  const stats = useMemo(() => {
    const todayCount = todayAppointments.filter(ap => ap.status !== 'cancelled').length;
    const pendingCount = appointments.filter(ap => ap.status === 'requested').length;
    
    // Monthly Cash Forecast: paid incomes + pending scheduled cash flows
    const confirmedRevenue = transactions
      .filter(tx => tx.type === 'income' && tx.status === 'paid')
      .reduce((acc, tx) => acc + tx.amount, 0);

    return {
      todayCount,
      pendingCount,
      revenue: confirmedRevenue
    };
  }, [appointments, transactions, todayAppointments]);

  const handleQuickAction = (action: string) => {
    setIsFABOpen(false);
    if (action === 'schedule') {
      router.push('/schedule');
    } else if (action === 'finance') {
      router.push('/finance');
    } else if (action === 'share') {
      const shareLink = `https://${profile.officeDomain || 'psychflow.com'}/agendar?prof=${profile.id}`;
      Clipboard.setString(shareLink);
      Alert.alert(
        "✨ Link de Divulgação",
        `Link copiado: ${shareLink}\n\nDispare este link no WhatsApp para captação automática de pacientes direto no seu site.`
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header Banner & Sincronia */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>Olá, Roberto</Text>
          <Text style={[styles.subGreeting, { color: theme.textSec }]}>
            {isSyncing ? "Sincronizando..." : lastSyncTime ? `Site conectado: ativo às ${lastSyncTime}` : "Conectado ao Ecossistema"}
          </Text>
        </View>

        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 2. Three Large Minimalist ERP KPIs */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCardLarge, { backgroundColor: theme.card }]}>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.todayCount}</Text>
            <Text style={[styles.kpiLabel, { color: theme.textSec }]}>Sessões Hoje</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCardSmall, { backgroundColor: theme.card }]}>
              <Text style={[styles.kpiValueSmall, { color: theme.text }]}>{stats.pendingCount}</Text>
              <Text style={[styles.kpiLabelSmall, { color: theme.textSec }]}>Pendentes de Aceite</Text>
            </View>

            <View style={[styles.kpiCardSmall, styles.indigoHighlight, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiValueSmall, styles.indigoValue, { color: theme.primary }]}>
                R$ {stats.revenue.toFixed(0)}
              </Text>
              <Text style={[styles.kpiLabelSmall, { color: theme.textSec }]}>Receita Realizada Mês</Text>
            </View>
          </View>
        </View>

        {/* 3. Agenda Rápida Feed */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Minhas Consultas de Hoje</Text>
        </View>

        {todayAppointments.length === 0 ? (
          <TouchableOpacity 
            style={[styles.todayFreeCard, { backgroundColor: theme.successLight, borderColor: theme.border }]}
            onPress={() => router.push('/settings/profile')}
            activeOpacity={0.9}
          >
            <Text style={[styles.todayFreeTitle, { color: theme.success }]}>🎉 Seu dia está livre!</Text>
            <Text style={[styles.todayFreeDesc, { color: theme.text }]}>
              Não há sessões agendadas para hoje. Excelente oportunidade para revisar prontuários pendentes ou configurar novas campanhas de captação no seu site integrado.
            </Text>
            <View style={[styles.todayFreeButton, { backgroundColor: theme.success }]}>
              <Text style={styles.todayFreeButtonText}>Configurar Divulgação do Site →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.todayActiveCard, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
            onPress={() => router.push('/schedule')}
            activeOpacity={0.9}
          >
            <Text style={[styles.todayActiveTitle, { color: theme.primary }]}>🎯 Dia de Alto Foco Clínico</Text>
            <Text style={[styles.todayActiveDesc, { color: theme.text }]}>
              Você possui <Text style={{ fontWeight: 'bold', color: theme.primary }}>{todayAppointments.length} sessões planejadas</Text> para hoje. Ajuste a agenda, prepare as evoluções e atenda seus pacientes.
            </Text>
            <View style={[styles.todayActiveButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.todayActiveButtonText}>🚀 Iniciar Grade e Atendimento Clínico</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 4. Domain Summary Details */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Sincronizador Web</Text>
        </View>
        
        <View style={[styles.summaryBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.domainLabel, { color: theme.text }]}>Domínio Ativo:</Text>
          <Text style={[styles.domainUrl, { color: theme.primary }]}>🌐 {profile.officeDomain || "Não configurado"}</Text>
          <Text style={[styles.domainText, { color: theme.textSec }]}>
            Seu perfil clínico de SEO, valores e agenda de buffers estão conectados com o portal web corporativo da sua clínica.
          </Text>
        </View>

      </ScrollView>

      {/* 5. Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsFABOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* FAB Quick Action Context Sheet */}
      <Modal
        visible={isFABOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsFABOpen(false)}
      >
        <TouchableOpacity 
          style={styles.fabModalBackdrop} 
          activeOpacity={1} 
          onPress={() => setIsFABOpen(false)}
        >
          <View style={[styles.fabMenu, { backgroundColor: theme.card }]}>
            <Text style={[styles.fabMenuTitle, { color: theme.text }]}>Painel de Ações Clínicas</Text>
            
            <TouchableOpacity 
              style={[styles.fabMenuItem, { borderBottomColor: theme.divider }]} 
              onPress={() => handleQuickAction('schedule')}
            >
              <Text style={styles.fabMenuEmoji}>📅</Text>
              <Text style={[styles.fabMenuLabel, { color: theme.text }]}>Visualizar Minha Agenda</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.fabMenuItem, { borderBottomColor: theme.divider }]} 
              onPress={() => handleQuickAction('finance')}
            >
              <Text style={styles.fabMenuEmoji}>💳</Text>
              <Text style={[styles.fabMenuLabel, { color: theme.text }]}>Registrar Movimentação de Caixa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.fabMenuItem, { borderBottomColor: theme.divider }]} 
              onPress={() => handleQuickAction('share')}
            >
              <Text style={styles.fabMenuEmoji}>🌐</Text>
              <Text style={[styles.fabMenuLabel, { color: theme.text }]}>Copiar Link do Meu Site</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.fabMenuItem, styles.fabMenuClose, { backgroundColor: theme.inputBg }]} 
              onPress={() => setIsFABOpen(false)}
            >
              <Text style={[styles.fabMenuLabelClose, { color: theme.textSec }]}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offlineText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  kpiContainer: {
    marginTop: 20,
  },
  kpiCardLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16,
  },
  kpiValue: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCardSmall: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginRight: 6,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  indigoHighlight: {
    marginRight: 0,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.08)',
  },
  kpiValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  indigoValue: {
    color: '#4F46E5',
  },
  kpiLabelSmall: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todayActiveCard: {
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    borderColor: 'rgba(79, 70, 229, 0.16)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    shadowColor: 'rgba(79, 70, 229, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  todayActiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  todayActiveDesc: {
    fontSize: 13,
    color: '#334155',
    marginTop: 8,
    lineHeight: 18,
  },
  todayActiveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  todayActiveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  todayFreeCard: {
    backgroundColor: 'rgba(5, 150, 105, 0.04)',
    borderColor: 'rgba(5, 150, 105, 0.15)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    shadowColor: 'rgba(5, 150, 105, 0.04)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  todayFreeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  todayFreeDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
  },
  todayFreeButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  todayFreeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  domainLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  domainUrl: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  domainText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  fabModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fabMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  fabMenuTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fabMenuEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  fabMenuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  fabMenuClose: {
    borderBottomWidth: 0,
    marginTop: 10,
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
  },
  fabMenuLabelClose: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
