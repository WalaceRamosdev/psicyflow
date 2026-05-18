import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useAppointments } from '../../contexts/AppointmentContext';
import { fakeDecrypt } from '../../utils/security';
import { Appointment } from '../../types';

export default function ClinicalNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  
  const { appointments, saveNotesDraft, finalizeNotes, isLoading } = useAppointments();
  
  const [noteText, setNoteText] = useState<string>("");
  const [isFinalized, setIsFinalized] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [showEncryptedNotePreview, setShowEncryptedNotePreview] = useState<boolean>(false);

  // Find corresponding appointment
  const appointment = useMemo(() => {
    return appointments.find((ap) => ap.id === id) || null;
  }, [appointments, id]);

  // Load initial data
  useEffect(() => {
    if (appointment) {
      setNoteText(appointment.notesDraft || "");
      setIsFinalized(appointment.notesFinalized || false);
    }
  }, [appointment]);

  // Track if there are unfinalized local changes compared to the database state
  const hasUnsavedChanges = useMemo(() => {
    if (isFinalized) return false;
    return noteText.trim() !== (appointment?.notesDraft || "").trim();
  }, [noteText, appointment, isFinalized]);

  // Active Auto-Save Logic (fires every 4 seconds if changes are made)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFinalized || !hasUnsavedChanges || !id) return;

    // Reset previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setIsAutoSaving(true);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveNotesDraft(id, noteText);
        const now = new Date();
        setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      } catch (err) {
        console.error("Auto-save draft failed:", err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 4000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [noteText, hasUnsavedChanges, isFinalized, id, saveNotesDraft]);

  // Safe Navigation Guard: intercept navigation remove action if edits are not finalized
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isFinalized || !hasUnsavedChanges) {
        // Safe to go
        return;
      }

      // Prevent direct screen dismissal
      e.preventDefault();

      Alert.alert(
        "⚠️ Rascunho não Finalizado!",
        "Você possui rascunhos de evolução não salvos em nossa base segura. Deseja fechar e arquivar as notas agora?",
        [
          {
            text: "Continuar Editando",
            style: "cancel",
            onPress: () => {}
          },
          {
            text: "Sair sem Finalizar",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action) // Force routing exit
          }
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isFinalized, hasUnsavedChanges]);

  const handleFinalize = async () => {
    if (!id || !noteText.trim()) {
      Alert.alert("Erro", "O conteúdo da evolução clínica não pode estar vazio.");
      return;
    }

    Alert.alert(
      "🔒 Criptografar Prontuário",
      "Deseja assinar digitalmente e arquivar esta evolução? Uma vez finalizada, as notas originais serão limpas e convertidas em hashes criptográficos seguros e E2E.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar e Criptografar",
          onPress: async () => {
            try {
              await finalizeNotes(id, noteText);
              setIsFinalized(true);
              router.replace('/(tabs)');
            } catch (err) {
              console.error("Finalization failed:", err);
            }
          }
        }
      ]
    );
  };

  // Retrieve decrypted note if finalized
  const decryptedPastNote = useMemo(() => {
    if (appointment?.notesEncrypted) {
      return fakeDecrypt(appointment.notesEncrypted);
    }
    return "";
  }, [appointment]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Acessando prontuário eletrônico seguro...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Consulta não localizada.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Patient header card */}
        <View style={styles.patientInfoCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.patientName}>{appointment.patientName}</Text>
            <View style={[styles.statusTag, isFinalized ? styles.tagSuccess : styles.tagWarning]}>
              <Text style={[styles.statusTagText, isFinalized ? styles.textSuccess : styles.textWarning]}>
                {isFinalized ? "🔒 Prontuário Fechado" : "📝 Rascunho Aberto"}
              </Text>
            </View>
          </View>
          <Text style={styles.patientMeta}>CPF: ***.***.***-** | CRP Responsável: {appointment.patientId === 'p1' ? '06/12345-SP' : '06/98765-SP'}</Text>
        </View>

        {/* Sync/Status bar */}
        <View style={styles.syncContainer}>
          {isAutoSaving ? (
            <Text style={styles.syncText}>🟢 Salvando rascunho na nuvem local...</Text>
          ) : lastSavedTime ? (
            <Text style={styles.syncText}>✅ Rascunho salvo às {lastSavedTime}</Text>
          ) : (
            <Text style={styles.syncText}>🛡️ Nuvem Segura Ativa (Auto-save de 4s)</Text>
          )}
        </View>

        {/* Text Area Input */}
        <View style={styles.editorBox}>
          <TextInput
            style={[styles.editor, isFinalized && styles.editorDisabled]}
            value={isFinalized ? decryptedPastNote : noteText}
            onChangeText={setNoteText}
            placeholder="Registre aqui as anotações clínicas da sessão, evoluções do paciente, queixas, intervenções terapêuticas e próximos passos..."
            placeholderTextColor="#64748B"
            multiline
            textAlignVertical="top"
            editable={!isFinalized}
            autoFocus={!isFinalized}
          />
        </View>

        {/* Actions panel */}
        {!isFinalized ? (
          <TouchableOpacity
            style={styles.finalizeBtn}
            onPress={handleFinalize}
            activeOpacity={0.8}
          >
            <Text style={styles.finalizeBtnText}>Finalizar e Criptografar Evolução 🔒</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cryptographyDemoCard}>
            <Text style={styles.demoTitle}>🛡️ LGPD / HIPAA DEMONSTRAÇÃO DE CRIPTOGRAFIA</Text>
            <Text style={styles.demoDesc}>
              A evolução deste prontuário foi criptografada e armazenada de forma segura na base. No simulador abaixo, veja como os dados aparecem em backups brutos sem a chave privada do terapeuta.
            </Text>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => setShowEncryptedNotePreview(!showEncryptedNotePreview)}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>
                {showEncryptedNotePreview ? "Ocultar Estrutura de Banco" : "Ver Código Criptografado no Banco"}
              </Text>
            </TouchableOpacity>

            {showEncryptedNotePreview && (
              <View style={styles.cipherBox}>
                <Text style={styles.cipherLabel}>🔒 VALOR EM RAW STORAGE (BANCO DE DADOS):</Text>
                <Text style={styles.cipherText}>{appointment.notesEncrypted}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.complianceNote}>
          ⚠️ Lembrete Ético CFP: As informações registradas neste prontuário são confidenciais e protegidas pelo sigilo profissional (Art. 9º do Código de Ética dos Psicólogos).
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
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
  patientInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  statusTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  tagWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textSuccess: {
    color: '#10B981',
  },
  textWarning: {
    color: '#F59E0B',
  },
  syncContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  syncText: {
    color: '#4F46E5', // Brand Indigo
    fontSize: 12,
    fontWeight: '600',
  },
  editorBox: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minHeight: 220,
    padding: 14,
  },
  editor: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 200,
  },
  editorDisabled: {
    color: '#64748B',
  },
  finalizeBtn: {
    backgroundColor: '#4F46E5', // Brand Indigo CTA
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  finalizeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cryptographyDemoCard: {
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#4F46E5', // Brand Indigo accent
    padding: 16,
    marginTop: 20,
  },
  demoTitle: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  demoDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  demoBtn: {
    backgroundColor: '#FFFFFF',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  demoBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  cipherBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cipherLabel: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cipherText: {
    color: '#EF4444',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  complianceNote: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
