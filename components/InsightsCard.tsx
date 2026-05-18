import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { generateInsights } from '../utils/insightEngine';
import { Appointment } from '../types';

interface InsightsCardProps {
  appointments: Appointment[];
}

export const InsightsCard: React.FC<InsightsCardProps> = React.memo(({ appointments }) => {
  const insights = useMemo(() => generateInsights(appointments), [appointments]);

  const handleAction = (actionType: 'stories_generator' | 'reminder_48h' | 'none') => {
    if (actionType === 'stories_generator') {
      Alert.alert(
        "✨ Arte do Instagram Gerada!",
        "Simulando integração com Canva API...\n\nCódigo de divulgação gerado:\n\n'🍃 Vaga Relâmpago de Psicoterapia! Tenho um horário disponível amanhã às 15:30. Agende diretamente pelo link na bio ou envie uma DM. Cuidar de você é o melhor investimento.'\n\n[Copiar texto de divulgação e abrir Instagram]",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Copiar e Abrir", 
            onPress: () => Alert.alert("Sucesso", "Texto copiado para a área de transferência! Direcionando para o Instagram Stories...") 
          }
        ]
      );
    } else if (actionType === 'reminder_48h') {
      Alert.alert(
        "📅 Ativar Régua de 48h",
        "Deseja configurar o disparo automático de confirmações com 48h de antecedência para todos os agendamentos de Terça-feira?",
        [
          { text: "Não, manter 24h", style: "cancel" },
          { text: "Sim, Ativar Régua 48h", onPress: () => Alert.alert("Sucesso", "Régua de 48h ativada para todas as Terças-feiras!") }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.cardTitle}>💡 Inteligência de Negócio & BI</Text>
      
      {insights.map((insight) => {
        const isWarning = insight.type === 'warning';
        const isSuccess = insight.type === 'success';
        
        return (
          <View 
            key={insight.id} 
            style={[
              styles.insightRow, 
              isWarning && styles.rowWarning,
              isSuccess && styles.rowSuccess
            ]}
          >
            <View style={styles.insightHeader}>
              <Text style={styles.indicatorIcon}>
                {isWarning ? "⚠️" : isSuccess ? "📈" : "✨"}
              </Text>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.insightTitleText,
                  isWarning && styles.textWarning,
                  isSuccess && styles.textSuccess
                ]}>
                  {insight.title}
                </Text>
                <Text style={styles.insightDescText}>{insight.description}</Text>
              </View>
            </View>

            {insight.actionType && insight.actionType !== 'none' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isWarning && styles.btnWarning,
                  isSuccess && styles.btnSuccess
                ]}
                onPress={() => handleAction(insight.actionType!)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>
                  {insight.actionType === 'stories_generator' ? "Gerar Arte de Stories 📱" : "Configurar Lembrete 🕒"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardTitle: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  insightRow: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0D9488',
  },
  rowWarning: {
    borderLeftColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  rowSuccess: {
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  insightTitleText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textWarning: {
    color: '#F59E0B',
  },
  textSuccess: {
    color: '#10B981',
  },
  insightDescText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnWarning: {
    backgroundColor: '#D97706',
  },
  btnSuccess: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
