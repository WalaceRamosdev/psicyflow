import React, { useState, useMemo } from 'react';
import { Svg, Path, G, Text as SvgText } from 'react-native-svg';
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
  Share,
  ScrollView
} from 'react-native';
import { useClinicStore } from '../../src/services/clinicAPI';
import { FinancialTransaction } from '../../src/types/clinic';
import { themes } from '../../src/styles/theme';

// ---- Donut chart helpers (pure math, no extra library) ----
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number
): string {
  // Clamp to avoid full-circle degenerate path
  const end = Math.min(endAngle, startAngle + 359.99);
  const large = end - startAngle > 180 ? 1 : 0;
  const os = polarToCartesian(cx, cy, outerR, end);
  const oe = polarToCartesian(cx, cy, outerR, startAngle);
  const is = polarToCartesian(cx, cy, innerR, end);
  const ie = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${is.x} ${is.y}`,
    'Z',
  ].join(' ');
}

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
    let despesasMes = 0;  // Registered expenses

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (tx.status === 'paid') receitaMes += tx.amount;
        if (tx.status === 'pending') aReceber += tx.amount;
        if (tx.status === 'overdue') inadimplencia += tx.amount;
      } else if (tx.type === 'expense') {
        despesasMes += tx.amount;
      }
    });

    const saldoLiquido = receitaMes - despesasMes;

    return { receitaMes, aReceber, inadimplencia, despesasMes, saldoLiquido };
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

  const getCardStyle = (item: FinancialTransaction) => {
    const isIncome = item.type === 'income';

    // Base accent color by type
    const accentColor = isIncome ? '#10B981' : '#EF4444'; // emerald or red

    // Subtle background tint by status
    let bgTint = theme.card;
    if (isDarkMode) {
      if (item.status === 'paid')    bgTint = isIncome ? 'rgba(16, 185, 129, 0.07)' : 'rgba(239, 68, 68, 0.07)';
      if (item.status === 'pending') bgTint = 'rgba(217, 119, 6, 0.07)';
      if (item.status === 'overdue') bgTint = 'rgba(239, 68, 68, 0.10)';
    } else {
      if (item.status === 'paid')    bgTint = isIncome ? '#F0FDF4' : '#FFF5F5';
      if (item.status === 'pending') bgTint = '#FFFBEB';
      if (item.status === 'overdue') bgTint = '#FEF2F2';
    }

    return { accentColor, bgTint };
  };

  const renderTransactionItem = ({ item }: { item: FinancialTransaction }) => {
    const isIncome = item.type === 'income';
    const statusColor = getStatusColor(item.status);
    const { accentColor, bgTint } = getCardStyle(item);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: bgTint,
            borderColor: accentColor,
            borderLeftWidth: 4,
            borderLeftColor: accentColor,
          }
        ]}
        onPress={() => handleReceiptTrigger(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.cardDesc, { color: theme.text }]} numberOfLines={1}>
              {isIncome ? '📥 ' : '📤 '}{item.description}
            </Text>
            <Text style={[styles.cardSub, { color: theme.textSec }]}>
              Vencimento: {item.dueDate}{item.patientName ? ` | Paciente: ${item.patientName}` : ''}
            </Text>
          </View>

          <View style={[styles.amountBadge, { backgroundColor: isIncome ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#DCFCE7') : (isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEE2E2') }]}>
            <Text style={[styles.cardAmount, { color: isIncome ? theme.success : theme.danger }]}>
              {isIncome ? '+' : '-'} R$ {item.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {item.status === 'paid' ? 'Recebido/Pago' : item.status === 'pending' ? 'Pendente' : 'Atrasado'}
            </Text>
          </View>

          {item.status === 'paid' && isIncome && (
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

      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        {/* 2. DRE Metric KPIs Row */}
        <View style={styles.balanceBanner}>
          <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.balanceLabel, { color: theme.textSec }]}>Saldo do Consultório (Lucro Líquido)</Text>
            <Text style={[styles.balanceValue, { color: stats.saldoLiquido >= 0 ? theme.success : theme.danger }]}>
              R$ {stats.saldoLiquido.toFixed(2)}
            </Text>
            <Text style={[styles.balanceSub, { color: theme.textSec }]}>
              Diferença entre receitas e despesas quitadas
            </Text>
          </View>
        </View>

        {/* 2. Pie Chart DRE */}
        {(() => {
          const SIZE = 160;
          const CX = SIZE / 2;
          const CY = SIZE / 2;
          const OUTER_R = SIZE / 2 - 4;
          const INNER_R = SIZE / 2 - 34; // donut hole
          
          const segments = [
            { label: 'Receitas', value: stats.receitaMes, color: '#10B981', emoji: '📥' },
            { label: 'Despesas', value: stats.despesasMes, color: '#EF4444', emoji: '📤' },
            { label: 'A Receber', value: stats.aReceber, color: '#F59E0B', emoji: '⏳' },
            { label: 'Atrasos', value: stats.inadimplencia, color: '#F97316', emoji: '⚠️' },
          ].filter(s => s.value > 0);

          const total = segments.reduce((s, d) => s + d.value, 0);
          
          return (
            <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Distribuição Financeira</Text>
              <Text style={[styles.chartSub, { color: theme.textSec }]}>Visão geral de todos os lançamentos</Text>

              <View style={styles.chartRow}>
                {/* Donut chart SVG */}
                {total === 0 ? (
                  <View style={[styles.emptyChartCircle, { borderColor: theme.border }]}>
                    <Text style={{ fontSize: 28 }}>📊</Text>
                    <Text style={[{ fontSize: 10, color: theme.textSec, marginTop: 4 }]}>Sem dados</Text>
                  </View>
                ) : (() => {
                  let angle = 0;
                  return (
                    <Svg width={SIZE} height={SIZE}>
                      <G>
                        {segments.map((seg, i) => {
                          const sweep = (seg.value / total) * 360;
                          const path = arcPath(CX, CY, OUTER_R, INNER_R, angle, angle + sweep);
                          angle += sweep;
                          return <Path key={i} d={path} fill={seg.color} />;
                        })}
                        {/* Center label */}
                        <SvgText
                          x={CX} y={CY - 8}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill={isDarkMode ? '#94A3B8' : '#64748B'}
                        >
                          Total
                        </SvgText>
                        <SvgText
                          x={CX} y={CY + 10}
                          textAnchor="middle"
                          fontSize="13"
                          fontWeight="bold"
                          fill={isDarkMode ? '#E2E8F0' : '#0F172A'}
                        >
                          R$ {total.toFixed(0)}
                        </SvgText>
                      </G>
                    </Svg>
                  );
                })()}

                {/* Legend */}
                <View style={styles.legendColumn}>
                  {([
                    { label: 'Receitas', value: stats.receitaMes, color: '#10B981', emoji: '📥' },
                    { label: 'Despesas', value: stats.despesasMes, color: '#EF4444', emoji: '📤' },
                    { label: 'A Receber', value: stats.aReceber, color: '#F59E0B', emoji: '⏳' },
                    { label: 'Atrasos', value: stats.inadimplencia, color: '#F97316', emoji: '⚠️' },
                  ]).map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View>
                        <Text style={[styles.legendLabel, { color: theme.textSec }]}>{item.emoji} {item.label}</Text>
                        <Text style={[styles.legendValue, { color: item.value > 0 ? item.color : theme.textSec }]}>
                          R$ {item.value.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })()}

        {/* 3. Transaction Filters */}
        <View style={styles.filtersWrapper}>
          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'all' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'all' && { color: '#FFFFFF' }]}>📂 Tudo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'paid' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setFilter('paid')}
          >
            <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'paid' && { color: '#FFFFFF' }]}>🟢 Pagos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'pending' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'pending' && { color: '#FFFFFF' }]}>⏳ Abertos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'overdue' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setFilter('overdue')}
          >
            <Text style={[styles.filterTabText, { color: theme.textSec }, filter === 'overdue' && { color: '#FFFFFF' }]}>⚠️ Atrasados</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Optimized Transactions List (Wrapped inside a simple view with height constraints or mapped directly to avoid ScrollView conflicts) */}
        <View style={styles.listWrapper}>
          {filteredTransactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border, marginHorizontal: 24 }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum registro financeiro</Text>
              <Text style={[styles.emptySub, { color: theme.textSec }]}>Todas as sessões encerradas ou despesas inseridas manualmente aparecerão aqui.</Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => (
              <View key={tx.id} style={{ paddingHorizontal: 24 }}>
                {renderTransactionItem({ item: tx })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
            <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Tipo de Lançamento</Text>
            <View style={[styles.toggleRow, { backgroundColor: theme.inputBg }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, type === 'income' && styles.toggleBtnActiveIncome]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.toggleBtnText, { color: theme.textSec }, type === 'income' && styles.toggleBtnTextActive]}>Receita (Entrada +)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, type === 'expense' && styles.toggleBtnActiveExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.toggleBtnText, { color: theme.textSec }, type === 'expense' && styles.toggleBtnTextActive]}>Despesa (Saída -)</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Descrição da Transação</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Ex: Sessão Particular, Aluguel da Sala"
              placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Valor (R$)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Ex: 180,00"
              placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {type === 'income' && (
              <>
                <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Nome do Paciente (Opcional)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Walace Ramos"
                  placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                  value={patientName}
                  onChangeText={setPatientName}
                />
              </>
            )}

            {/* Action CTAs */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setIsModalOpen(false)}>
                <Text style={[styles.modalCancelText, { color: theme.textSec }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.primary }]} onPress={handleSaveTransaction}>
                <Text style={styles.modalSaveText}>Salvar Lançamento</Text>
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
  balanceBanner: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  balanceSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chartSub: {
    fontSize: 11,
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyChartCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendColumn: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 1,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 8,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
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
    marginTop: 20,
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
  filterTabText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  listWrapper: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDesc: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 4,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  amountBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySub: {
    fontSize: 11,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActiveIncome: {
    backgroundColor: '#0D9488',
  },
  toggleBtnActiveExpense: {
    backgroundColor: '#EF4444',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalSave: {
    flex: 2,
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
