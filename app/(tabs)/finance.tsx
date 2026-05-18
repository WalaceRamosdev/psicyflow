import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Share
} from 'react-native';
import { useClinicStore } from '../../src/services/clinicAPI';
import { FinancialTransaction } from '../../src/types/clinic';
import { themes } from '../../src/styles/theme';

export default function FinanceScreen() {
  const transactions = useClinicStore((state) => state.transactions);
  const addTransaction = useClinicStore((state) => state.addTransaction);
  const generateReceipt = useClinicStore((state) => state.generateReceipt);
  const isOffline = useClinicStore((state) => state.isOffline);
  const isDarkMode = useClinicStore((state) => state.isDarkMode);

  const theme = isDarkMode ? themes.dark : themes.light;

  // Active filters and manual transaction modal state
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // New transaction input states
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [patientName, setPatientName] = useState<string>('');

  // --- DYNAMIC KPI CALCULATIONS ---
  const stats = useMemo(() => {
    let receitaMes = 0; // Confirmed/Paid incomes
    let aReceber = 0;   // Pending incomes
    let inadimplencia = 0; // Overdue/Late incomes

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (tx.status === 'paid') receitaMes += tx.amount;
        if (tx.status === 'pending') aReceber += tx.amount;
        if (tx.status === 'overdue') inadimplencia += tx.amount;
      }
    });

    return { receitaMes, aReceber, inadimplencia };
  }, [transactions]);

  // Filter transaction list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter === 'all') return true;
      return tx.status === filter;
    });
  }, [transactions, filter]);

  // Execute manual income/expense record
  const handleSaveTransaction = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert("Campos Vazios", "Por favor, preencha a descrição e o valor.");
      return;
    }

    const value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      Alert.alert("Valor Inválido", "Por favor, insira um valor numérico válido.");
      return;
    }

    await addTransaction({
      description,
      amount: value,
      type,
      status: 'paid', // Manual entries default to resolved/paid
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      patientName: type === 'income' ? (patientName || 'Paciente Particular') : undefined
    });

    Alert.alert("Sucesso", "Transação financeira registrada no fluxo de caixa!");
    setIsModalOpen(false);
    
    // Clear form
    setDescription('');
    setAmount('');
    setPatientName('');
  };

  // Generate Receipt Action
  const handleReceiptTrigger = (tx: FinancialTransaction) => {
    if (tx.status !== 'paid') {
      Alert.alert(
        "Pendência Ativa",
        "Só é permitido gerar recibos fiscais para consultas quitadas (Pagas)."
      );
      return;
    }

    const { message, pdfBase64 } = generateReceipt(tx.id);
    Alert.alert(
      "📝 Recibo Pronto",
      `${message}\n\nDeseja compartilhar o recibo de prestação de serviço com o paciente?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Compartilhar",
          onPress: async () => {
            try {
              await Share.share({
                message: `Prezado(a) ${tx.patientName || "Paciente"},\nSeguem os dados do recibo de atendimento clínico:\n\n${atob(pdfBase64)}`
              });
            } catch (e) {
              console.warn(e);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid': return theme.success; // Green
      case 'pending': return '#D97706'; // Orange
      case 'overdue': return theme.danger; // Red
    }
  };

  const renderTransactionItem = ({ item }: { item: FinancialTransaction }) => {
    const isIncome = item.type === 'income';
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => handleReceiptTrigger(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardDesc, { color: theme.text }]}>{item.description}</Text>
            <Text style={[styles.cardSub, { color: theme.textSec }]}>
              Vencimento: {item.dueDate} {item.patientName ? `| ${item.patientName}` : ''}
            </Text>
          </View>
          
          <Text style={[styles.cardAmount, { color: isIncome ? theme.success : theme.danger }]}>
            {isIncome ? '+' : '-'} R$ {item.amount.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {item.status === 'paid' ? 'Pago' : item.status === 'pending' ? 'Pendente' : 'Atrasado'}
            </Text>
          </View>

          {item.status === 'paid' && (
            <Text style={[styles.receiptAction, { color: theme.primary }]}>Emitir Recibo 🧾</Text>
          )}

          {item.status === 'overdue' && item.paymentGatewayLink && (
            <Text style={styles.payAction}>Enviar Cobrança 💬</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header Banner */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Fluxo de Caixa</Text>
          <Text style={[styles.subtitle, { color: theme.textSec }]}>
            {isOffline ? "Anotando no cache local..." : "DRE & Previsibilidade Integrada"}
          </Text>
        </View>

        <TouchableOpacity style={[styles.quickAddBtn, { backgroundColor: theme.primary }]} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.quickAddText}>+ Registrar</Text>
        </TouchableOpacity>
      </View>

      {/* 2. DRE Metric KPIs Row */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSec }]}>Receita Bruta</Text>
          <Text style={[styles.kpiValue, { color: theme.success }]}>R$ {stats.receitaMes}</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSec }]}>A Receber</Text>
          <Text style={[styles.kpiValue, { color: '#D97706' }]}>R$ {stats.aReceber}</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card }, stats.inadimplencia > 0 && { borderColor: 'rgba(239, 68, 68, 0.25)', backgroundColor: theme.dangerLight }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSec }]}>Inadimplência</Text>
          <Text style={[styles.kpiValue, { color: theme.danger }]}>R$ {stats.inadimplencia}</Text>
        </View>
      </View>

      {/* 3. Transaction Filters */}
      <View style={styles.filtersWrapper}>
        <TouchableOpacity
          style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'all' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'all' && { color: '#FFFFFF' }]}>Tudo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'paid' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => setFilter('paid')}
        >
          <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'paid' && { color: '#FFFFFF' }]}>Pagos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'pending' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'pending' && { color: '#FFFFFF' }]}>Abertos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'overdue' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => setFilter('overdue')}
        >
          <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'overdue' && { color: '#FFFFFF' }]}>Atrasados</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Optimized Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum registro financeiro</Text>
            <Text style={[styles.emptySub, { color: theme.textSec }]}>Todas as sessões encerradas ou despesas inseridas manualmente aparecerão aqui.</Text>
          </View>
        }
      />

      {/* 5. Manual Entry Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Nova Transação Fluxo de Caixa</Text>
            
            {/* Income / Expense Toggle Switch */}
            <View style={[styles.toggleRow, { backgroundColor: theme.inputBg }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, type === 'income' && styles.toggleBtnActiveIncome]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.toggleBtnText, { color: theme.textSec }, type === 'income' && styles.toggleBtnTextActive]}>Receita (+)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, type === 'expense' && styles.toggleBtnActiveExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.toggleBtnText, { color: theme.textSec }, type === 'expense' && styles.toggleBtnTextActive]}>Despesa (-)</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Descrição (Ex: Sessão Particular, Aluguel)"
              placeholderTextColor={theme.textSec}
              value={description}
              onChangeText={setDescription}
            />

            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Valor (Ex: 180,00)"
              placeholderTextColor={theme.textSec}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {type === 'income' && (
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="Paciente (Opcional)"
                placeholderTextColor={theme.textSec}
                value={patientName}
                onChangeText={setPatientName}
              />
            )}

            {/* Action CTAs */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setIsModalOpen(false)}>
                <Text style={[styles.modalCancelText, { color: theme.textSec }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.primary }]} onPress={handleSaveTransaction}>
                <Text style={styles.modalSaveText}>Salvar Entrada</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  quickAddBtn: {
    backgroundColor: '#4F46E5', // Brand Indigo accent
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 8,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  debtHighlight: {
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
    backgroundColor: '#FEF2F2',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  filtersWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterTabText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 'bold',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDesc: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  receiptAction: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  payAction: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  /* MODAL STYLE */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActiveIncome: {
    backgroundColor: '#059669',
  },
  toggleBtnActiveExpense: {
    backgroundColor: '#DC2626',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalSave: {
    flex: 2,
    backgroundColor: '#4F46E5',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
