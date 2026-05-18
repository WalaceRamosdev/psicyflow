import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useClinicStore } from '../../src/services/clinicAPI';
import { SummaryGenerator } from '../../src/components/ai-assist/SummaryGenerator';
import { PatientRecord } from '../../src/types/clinic';

// Preset Clinical Templates
const CLINICAL_TEMPLATES = {
  tcc: `--- MODELO COGNITIVO-COMPORTAMENTAL (TCC) ---\n1. Crenças Ativadas:\n   \n2. Pensamentos Automáticos Negativos (PANs):\n   \n3. Emoções & Comportamentos:\n   \n4. Reestruturação Cognitiva Aplicada:\n   \n5. Tarefa de Casa acordada:\n   `,
  psicanalise: `--- SESSÃO DE PSICANÁLISE ---\n1. Associações Livres / Temas trazidos:\n   \n2. Resistências & Repetições:\n   \n3. Posição Subjetiva / Transferência:\n   \n4. Apontamentos do Analista:\n   `,
  anamnese: `--- ANAMNESE CLÍNICA INICIAL ---\n1. Queixa Principal & Histórico do Sintoma:\n   \n2. Histórico Familiar & Social:\n   \n3. Rotina, Sono & Alimentação:\n   \n4. Demandas Terapêuticas & Metas:\n   `
};

export default function PatientRecordScreen() {
  const { patientId } = useLocalSearchParams();
  const router = useRouter();

  // Zustand State hooks
  const appointments = useClinicStore((state) => state.appointments);
  const records = useClinicStore((state) => state.records);
  const saveClinicalRecord = useClinicStore((state) => state.saveClinicalRecord);
  const syncWithWebEcosystem = useClinicStore((state) => state.syncWithWebEcosystem);

  // Editor states
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'timeline'>('editor');

  // Find active patient data from appointments lists
  const patientData = useMemo(() => {
    const matchedAp = appointments.find(ap => ap.patientId === patientId);
    return {
      id: patientId as string,
      name: matchedAp?.patientName || 'Paciente Particular',
      avatar: matchedAp?.patientAvatar
    };
  }, [appointments, patientId]);

  // Find corresponding pending appointment for evolution registry
  const pendingAppointment = useMemo(() => {
    return appointments.find(ap => ap.patientId === patientId && !ap.notesFinalized);
  }, [appointments, patientId]);

  // Filter historical records for this patient
  const patientHistory = useMemo(() => {
    return records.filter(rec => rec.patientId === patientId);
  }, [records, patientId]);

  // Handle template selection insertion
  const handleApplyTemplate = (type: 'tcc' | 'psicanalise' | 'anamnese') => {
    const templateContent = CLINICAL_TEMPLATES[type];
    setSelectedTemplate(type);
    
    if (content.trim().length > 0) {
      Alert.alert(
        "Substituir Conteúdo?",
        "Deseja mesclar ou substituir o texto atual do editor pelo modelo selecionado?",
        [
          { text: "Substituir", onPress: () => setContent(templateContent) },
          { text: "Anexar no Fim", onPress: () => setContent(prev => prev + "\n\n" + templateContent) },
          { text: "Cancelar", style: "cancel" }
        ]
      );
    } else {
      setContent(templateContent);
    }
  };

  // Callback from AI Copilot summaries generator
  const handleApplyAISummary = (refinedText: string) => {
    setContent(prev => {
      const spacing = prev.trim().length > 0 ? "\n\n" : "";
      return prev + spacing + `--- EVOLUÇÃO REDIGIDA POR IA ---\n${refinedText}`;
    });
    Alert.alert("Evolução Integrada", "O parágrafo técnico gerado pela IA foi adicionado ao editor!");
  };

  // Secure Finalize / E2E Encrypt action dispatch
  const handleFinalizeRecord = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Campos Obrigatórios", "Por favor, insira o Título da sessão e o Conteúdo da evolução clínica.");
      return;
    }

    if (!pendingAppointment) {
      Alert.alert(
        "Nenhuma Consulta Pendente",
        "Você não possui consultas pendentes de evolução hoje. Deseja registrar um prontuário administrativo avulso?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Registrar Avulso", onPress: () => executeSave('avulso_id') }
        ]
      );
    } else {
      Alert.alert(
        "🔒 Assinar Prontuário Eletronicamente",
        "Conforme o Código de Ética CFP, prontuários finalizados são selados e não podem ser excluídos. Confirma o fechamento seguro?",
        [
          { text: "Voltar", style: "cancel" },
          { text: "Assinar e Salvar", onPress: () => executeSave(pendingAppointment.id) }
        ]
      );
    }
  };

  const executeSave = async (appointmentId: string) => {
    try {
      await saveClinicalRecord({
        patientId: patientData.id,
        appointmentId,
        title,
        content,
        isFinalized: true,
        templateName: selectedTemplate || 'Texto Livre',
        patientSymptomTrend: 'stable'
      });

      Alert.alert("Salvo com Sucesso", "Evolução clínica assinada, criptografada e enviada para o ecossistema!");
      router.back();
    } catch (e) {
      Alert.alert("Erro", "Falha ao gravar evolução.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        
        <View style={styles.patientBadge}>
          <Text style={styles.patientName}>{patientData.name}</Text>
          <Text style={styles.patientSub}>Prontuário Eletrônico Segregado</Text>
        </View>
      </View>

      {/* Editor/Timeline Switch Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'editor' && styles.tabActive]}
          onPress={() => setActiveTab('editor')}
        >
          <Text style={[styles.tabText, activeTab === 'editor' && styles.tabTextActive]}>Evolução Atual</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
            Linha do Tempo ({patientHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'editor' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollEditor} showsVerticalScrollIndicator={false}>
            {/* Template Buttons */}
            <View style={styles.toolbar}>
              <Text style={styles.toolbarLabel}>Templates:</Text>
              <TouchableOpacity style={styles.toolBtn} onPress={() => handleApplyTemplate('tcc')}>
                <Text style={styles.toolBtnText}>TCC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => handleApplyTemplate('psicanalise')}>
                <Text style={styles.toolBtnText}>Psicanálise</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => handleApplyTemplate('anamnese')}>
                <Text style={styles.toolBtnText}>Anamnese</Text>
              </TouchableOpacity>
            </View>

            {/* AI Generator CTA */}
            <TouchableOpacity style={styles.copilotBtn} onPress={() => setIsCopilotOpen(true)}>
              <Text style={styles.copilotBtnText}>✨ Lançar Copiloto IA (Resumir Sessão)</Text>
            </TouchableOpacity>

            {/* Editor Canvas */}
            <View style={styles.canvas}>
              <TextInput
                style={styles.titleInput}
                placeholder="Título da Sessão (Ex: Sessão 5 - Enfrentamento)"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
              
              <TextInput
                style={styles.editorInput}
                multiline={true}
                placeholder="Digite a evolução clínica ou insira um template acima..."
                placeholderTextColor="#94A3B8"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </View>

            {/* Ethics Alert */}
            <Text style={styles.ethicsText}>
              🔒 Em conformidade com a Resolução CFP 01/2018 e LGPD. Suas anotações clínicas são mantidas em ambiente cifrado localmente de ponta a ponta.
            </Text>

            {/* Save CTA */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleFinalizeRecord}>
              <Text style={styles.saveBtnText}>🔒 Assinar e Fechar Prontuário</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* Historical Timeline View */
        <ScrollView contentContainerStyle={styles.scrollTimeline} showsVerticalScrollIndicator={false}>
          {patientHistory.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyText}>Sem evoluções finalizadas</Text>
              <Text style={styles.emptySub}>Qualquer prontuário assinado aparecerá nesta linha do tempo histórica de forma auditável.</Text>
            </View>
          ) : (
            patientHistory.map((rec, index) => (
              <View key={rec.id} style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineDate}>{rec.date}</Text>
                  <View style={styles.templateBadge}>
                    <Text style={styles.templateBadgeText}>{rec.templateName || 'Prontuário'}</Text>
                  </View>
                </View>
                
                <Text style={styles.timelineTitle}>{rec.title}</Text>
                <Text style={styles.timelineContent}>{rec.content}</Text>
                
                <View style={styles.encryptionIndicator}>
                  <Text style={styles.encryptionText}>🔐 Criptografado com sucesso no ecossistema</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* AI Copilot summary modal generator */}
      <SummaryGenerator
        isVisible={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onApplySummary={handleApplyAISummary}
      />
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
  patientBadge: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  patientSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  scrollEditor: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolbarLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginRight: 8,
  },
  toolBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  toolBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 'bold',
  },
  copilotBtn: {
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    borderColor: 'rgba(79, 70, 229, 0.12)',
    borderWidth: 1,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  copilotBtnText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: 'bold',
  },
  canvas: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  titleInput: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 14,
  },
  editorInput: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    minHeight: 280,
  },
  ethicsText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 14,
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  /* TIMELINE CSS */
  scrollTimeline: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
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
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
    fontFamily: 'monospace',
  },
  templateBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  templateBadgeText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: 'bold',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 10,
  },
  timelineContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 8,
  },
  encryptionIndicator: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 14,
  },
  encryptionText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
  },
});
