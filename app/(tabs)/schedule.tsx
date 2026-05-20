import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClinicStore } from '../../src/services/clinicAPI';
import { Appointment, AppointmentStatus } from '../../src/types/clinic';
import { themes } from '../../src/styles/theme';

export default function ScheduleScreen() {
  const router = useRouter();

  // Zustand State hooks
  const appointments = useClinicStore((state) => state.appointments);
  const profile = useClinicStore((state) => state.profile);
  const bootStore = useClinicStore((state) => state.bootStore);
  const syncWithWebEcosystem = useClinicStore((state) => state.syncWithWebEcosystem);
  const updateAppointmentStatus = useClinicStore((state) => state.updateAppointmentStatus);
  const isOffline = useClinicStore((state) => state.isOffline);
  const isSyncing = useClinicStore((state) => state.isSyncing);
  const isDarkMode = useClinicStore((state) => state.isDarkMode);

  const theme = isDarkMode ? themes.dark : themes.light;

  // Filter and Interaction states
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedAp, setSelectedAp] = useState<Appointment | null>(null);
  const [isLongPressModalOpen, setIsLongPressModalOpen] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Initialize and pull cache on mount
  useEffect(() => {
    bootStore().then(() => {
      syncWithWebEcosystem();
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncWithWebEcosystem();
    setRefreshing(false);
  };

  // Filter list based on selected view mode
  const filteredAppointments = useMemo(() => {
    return appointments.filter((ap) => {
      if (viewMode === 'day') {
        return ap.date === todayStr;
      }
      if (viewMode === 'week') {
        // Simple mock helper: check if date is within 7 days from today
        const apTime = new Date(ap.date).getTime();
        const todayTime = new Date(todayStr).getTime();
        return apTime >= todayTime && apTime <= todayTime + (7 * 86400000);
      }
      return true; // 'month' (all records)
    }).sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time}`).getTime();
      const timeB = new Date(`${b.date}T${b.time}`).getTime();
      return timeA - timeB;
    });
  }, [appointments, viewMode, todayStr]);

  // Aggregate Estimated Billing for the selected view range
  const estimatedRevenue = useMemo(() => {
    return filteredAppointments.reduce((acc, ap) => {
      if (ap.status === 'cancelled') return acc;
      return acc + profile.sessionValue;
    }, 0);
  }, [filteredAppointments, profile.sessionValue]);

  // Handle direct long press modal status changes
  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!selectedAp) return;
    setIsLongPressModalOpen(false);

    if (status === 'cancelled') {
      Alert.prompt(
        "Motivo do Cancelamento",
        "Por favor, insira a justificativa legal para anulação do horário:",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salvar",
            onPress: async (reason) => {
              await updateAppointmentStatus(selectedAp.id, 'cancelled', reason || "Desistência");
              Alert.alert("Sucesso", "Cancelamento registrado e enviado para o ecossistema do site.");
            }
          }
        ]
      );
    } else {
      await updateAppointmentStatus(selectedAp.id, status);
      Alert.alert("Status Sincronizado", `Agendamento marcado como ${status === 'no_show' ? 'Ausência (No-Show)' : 'Confirmado'}.`);
    }
    setSelectedAp(null);
  };

  const getStatusDetails = (status: AppointmentStatus) => {
    if (!status) {
      return { label: 'Agendado', bg: isDarkMode ? '#1E293B' : '#F1F5F9', text: isDarkMode ? '#94A3B8' : '#475569' };
    }

    switch (status) {
      case 'requested':
      case 'pending' as any:
        return { label: 'Solicitado', bg: isDarkMode ? '#1E293B' : '#F1F5F9', text: isDarkMode ? '#94A3B8' : '#475569' };
      case 'confirmed_patient':
        return { label: 'Confirmado (Pac.)', bg: theme.primaryLight, text: theme.primary };
      case 'confirmed_therapist':
      case 'confirmed' as any:
        return { label: 'Confirmado (Ter.)', bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', text: isDarkMode ? '#60A5FA' : '#2563EB' };
      case 'in_progress':
        return { label: 'Em Andamento', bg: isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7', text: isDarkMode ? '#F59E0B' : '#D97706' };
      case 'completed':
        return { label: 'Concluído', bg: theme.successLight, text: theme.success };
      case 'cancelled':
        return { label: 'Cancelado', bg: theme.dangerLight, text: theme.danger };
      case 'no_show':
        return { label: 'No-Show', bg: isDarkMode ? '#1E293B' : '#F5F5F4', text: isDarkMode ? '#94A3B8' : '#57534E' };
      default:
        return { label: 'Agendado', bg: isDarkMode ? '#1E293B' : '#F1F5F9', text: isDarkMode ? '#94A3B8' : '#475569' };
    }
  };

  const handleCardPress = (item: Appointment) => {
    if (item.status === 'completed' || item.notesFinalized) {
      router.push(`/record/${item.patientId}`);
    } else {
      Alert.alert(
        item.patientName,
        `Sessão às ${item.time} (${item.type}). O que deseja fazer?`,
        [
          { text: "Editar Prontuário", onPress: () => router.push(`/record/${item.patientId}`) },
          { text: "Ver Teleconsulta", onPress: () => router.push(`/session/${item.id}`), defaultValue: 'online' },
          { text: "Voltar", style: "cancel" }
        ]
      );
    }
  };

  const handleLongPress = (item: Appointment) => {
    setSelectedAp(item);
    setIsLongPressModalOpen(true);
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const statusData = getStatusDetails(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => handleCardPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: theme.text }]}>{item.time}</Text>
            <Text style={[styles.durationText, { color: theme.textSec }]}>{item.duration} min</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusData.bg }]}>
            <Text style={[styles.statusText, { color: statusData.text }]}>
              {statusData.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View>
            <Text style={[styles.patientName, { color: theme.text }]}>{item.patientName}</Text>
            <Text style={[styles.consultType, { color: theme.textSec }]}>Modalidade: {item.type === 'online' ? '🌐 Teleconsulta' : '🏢 Presencial'}</Text>
          </View>

          {/* Financial Debts Notification Alert */}
          {item.hasFinancialAlert && (
            <View style={styles.debtAlert}>
              <Text style={styles.debtAlertText}>⚠️ Pendência Financeira</Text>
            </View>
          )}
        </View>

        {item.cancellationReason && (
          <View style={[styles.cancellationBox, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.cancellationText, { color: theme.textSec }]}>Justificativa: "{item.cancellationReason}"</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header Banner & Sincronia */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Minha Agenda</Text>
          <Text style={[styles.subtitle, { color: theme.textSec }]}>
            {isOffline ? "Modo Cache Offline Ativo" : `Faturamento Estimado no Período: R$ ${estimatedRevenue}`}
          </Text>
        </View>

        {isSyncing && (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>Sincronizando...</Text>
          </View>
        )}
      </View>

      {/* 2. Top Segmented Tabs for Dia/Semana/Mês */}
      <View style={[styles.tabsWrapper, { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
        <TouchableOpacity
          style={[styles.tabBtn, viewMode === 'day' && styles.tabBtnActive, viewMode === 'day' && { borderBottomColor: theme.primary }]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[styles.tabBtnText, { color: theme.textSec }, viewMode === 'day' && styles.tabBtnTextActive, viewMode === 'day' && { color: theme.primary }]}>Hoje</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, viewMode === 'week' && styles.tabBtnActive, viewMode === 'week' && { borderBottomColor: theme.primary }]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.tabBtnText, { color: theme.textSec }, viewMode === 'week' && styles.tabBtnTextActive, viewMode === 'week' && { color: theme.primary }]}>Semana</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, viewMode === 'month' && styles.tabBtnActive, viewMode === 'month' && { borderBottomColor: theme.primary }]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.tabBtnText, { color: theme.textSec }, viewMode === 'month' && styles.tabBtnTextActive, viewMode === 'month' && { color: theme.primary }]}>Mês</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main FlatList appointments */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Sem agendamentos no período</Text>
            <Text style={[styles.emptySub, { color: theme.textSec }]}>Aproveite para revisar as anotações pendentes ou atualizar o site.</Text>
          </View>
        }
      />

      {/* 4. Long Press Context Menu Sheet */}
      <Modal
        visible={isLongPressModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsLongPressModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsLongPressModalOpen(false)}
        >
          <View style={[styles.contextMenu, { backgroundColor: theme.card }]}>
            <Text style={[styles.contextTitle, { color: theme.text }]}>Atualização Rápida de Status</Text>
            <Text style={[styles.contextSubtitle, { color: theme.textSec }]}>{selectedAp?.patientName}</Text>

            <TouchableOpacity
              style={[styles.contextItem, { borderBottomColor: theme.divider }]}
              onPress={() => handleStatusChange('confirmed_therapist')}
            >
              <Text style={styles.contextItemTextConfirm}>✅ Confirmar Presença</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextItem, { borderBottomColor: theme.divider }]}
              onPress={() => handleStatusChange('no_show')}
            >
              <Text style={styles.contextItemTextNoShow}>⚠️ Registrar No-Show (Falta Sem Aviso)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextItem, { borderBottomColor: theme.divider }]}
              onPress={() => handleStatusChange('cancelled')}
            >
              <Text style={styles.contextItemTextCancel}>❌ Cancelar Consulta (Com Justificativa)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextClose, { backgroundColor: theme.inputBg }]}
              onPress={() => setIsLongPressModalOpen(false)}
            >
              <Text style={[styles.contextCloseText, { color: theme.textSec }]}>Voltar</Text>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  syncIndicator: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syncText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 14,
    padding: 5,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  durationText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
  },
  consultType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  debtAlert: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debtAlertText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cancellationBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  cancellationText: {
    fontSize: 11,
    color: '#DC2626',
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  /* MODAL BACKDROP AND CONTEXT MENU */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contextMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  contextSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  contextItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contextItemTextConfirm: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  contextItemTextNoShow: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  contextItemTextCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  contextClose: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contextCloseText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
