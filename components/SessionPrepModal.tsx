import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

interface SessionPrepModalProps {
  isVisible: boolean;
  onClose: () => void;
  patientName: string;
  patientReason: string;
  sessionCount: number;
  paymentStatus: 'active' | 'inactive';
  lastEvolutions?: string[];
  onEnterRoom: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SessionPrepModal: React.FC<SessionPrepModalProps> = React.memo(({
  isVisible,
  onClose,
  patientName,
  patientReason,
  sessionCount,
  paymentStatus,
  lastEvolutions = [
    "Paciente relata ansiedade acentuada por pressão profissional. Aplicada técnica cognitiva de reenquadramento de crenças limitantes. Planejado acompanhamento continuado.",
    "Discussão sobre dinâmicas familiares e delimitação de limites emocionais saudáveis. Paciente respondeu bem, indicando melhora no diálogo interno.",
    "Primeira sessão diagnóstica. Estabelecimento de vínculo terapêutico, alinhamento de expectativas e mapeamento de dores centrais."
  ],
  onEnterRoom,
}) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.prepLabel}>🧠 MODO DE FOCO CLÍNICO</Text>
              <Text style={styles.patientNameText}>{patientName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Quick Metrics */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{sessionCount} sessões</Text>
                <Text style={styles.metricLbl}>Histórico</Text>
              </View>
              <View style={[styles.metricBox, { borderColor: paymentStatus === 'active' ? '#10B981' : '#EF4444' }]}>
                <Text style={[styles.metricVal, { color: paymentStatus === 'active' ? '#10B981' : '#EF4444' }]}>
                  {paymentStatus === 'active' ? 'Regular 💎' : 'Inativo 💳'}
                </Text>
                <Text style={styles.metricLbl}>Assinatura Recorrente</Text>
              </View>
            </View>

            {/* Diagnostic Focus */}
            <View style={styles.block}>
              <Text style={styles.blockTitle}>🎯 Foco Terapêutico Ativo</Text>
              <View style={styles.reasonCard}>
                <Text style={styles.reasonText}>{patientReason}</Text>
              </View>
            </View>

            {/* Last 3 clinical evolutions */}
            <View style={styles.block}>
              <Text style={styles.blockTitle}>📝 Histórico Recente (Últimas 3 Evoluções)</Text>
              {lastEvolutions.map((evo, idx) => (
                <View key={idx} style={styles.evolutionItem}>
                  <View style={styles.evolutionHeader}>
                    <Text style={styles.evolutionTag}>Sessão {sessionCount - idx}</Text>
                    <Text style={styles.evolutionDate}>🔒 Descriptografado localmente</Text>
                  </View>
                  <Text style={styles.evolutionText}>{evo}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => {
                onClose();
                onEnterRoom();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Iniciar Teleconsulta de Vídeo 📹</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: '#334155',
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  prepLabel: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  patientNameText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollBody: {
    padding: 24,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricVal: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  metricLbl: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  block: {
    marginBottom: 20,
  },
  blockTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reasonCard: {
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.2)',
  },
  reasonText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: 'bold',
  },
  evolutionItem: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  evolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
    marginBottom: 8,
  },
  evolutionTag: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  evolutionDate: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '500',
  },
  evolutionText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionBtn: {
    backgroundColor: '#0D9488',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
