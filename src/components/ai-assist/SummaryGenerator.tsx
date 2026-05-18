import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useClinicStore } from '../../services/clinicAPI';

interface SummaryGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
  onApplySummary: (refinedText: string) => void;
}

export function SummaryGenerator({ isVisible, onClose, onApplySummary }: SummaryGeneratorProps) {
  const [bullets, setBullets] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const summarizeNotesWithIA = useClinicStore((state) => state.summarizeNotesWithIA);

  const handleProcessIA = async () => {
    if (!bullets || bullets.trim().length < 10) {
      Alert.alert(
        "🧠 Tópicos Muito Curtos",
        "Por favor, digite ao menos 10 caracteres contendo tópicos da sessão para que a IA possa redigir uma evolução clínica coerente."
      );
      return;
    }

    setIsLoading(true);
    try {
      const parsedText = await summarizeNotesWithIA(bullets);
      setResult(parsedText);
    } catch (e) {
      Alert.alert("Erro", "Erro ao processar resumo clínico.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplySummary(result);
    setBullets('');
    setResult('');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>✨ Copiloto Clínico com IA</Text>
            <Text style={styles.subtitle}>
              Digite anotações rápidas ou tópicos e a IA estruturará uma evolução formal padronizada.
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Input Box */}
            <Text style={styles.label}>Anotações Brutas / Bullet Points</Text>
            <TextInput
              style={styles.textInput}
              multiline={true}
              numberOfLines={4}
              placeholder="Ex: Paciente com ansiedade forte, evitou andar de metrô essa semana, discuti distorção de catastrofização, acordamos tarefa de casa de enfrentamento leve."
              placeholderTextColor="#94A3B8"
              value={bullets}
              onChangeText={setBullets}
            />

            {/* CTA Trigger */}
            <TouchableOpacity
              style={[styles.generateBtn, isLoading && styles.disabledBtn]}
              onPress={handleProcessIA}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.btnText}>Redigindo evolução clínica...</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Refinar e Redigir com IA</Text>
              )}
            </TouchableOpacity>

            {/* AI Result Box */}
            {result ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Evolução Sugerida (CFP / TCC):</Text>
                <View style={styles.resultBox}>
                  <Text style={styles.resultText}>{result}</Text>
                </View>

                {/* Apply Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setResult('')}>
                    <Text style={styles.cancelText}>Refazer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                    <Text style={styles.applyText}>Aplicar no Prontuário</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Close Header */}
          {!result && !isLoading && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fechar Copiloto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  generateBtn: {
    backgroundColor: '#4F46E5', // Sole Indigo Brand Accent
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledBtn: {
    backgroundColor: '#818CF8',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  resultBox: {
    backgroundColor: 'rgba(79, 70, 229, 0.04)',
    borderColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: '#4F46E5',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
