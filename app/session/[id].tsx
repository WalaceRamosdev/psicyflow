import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mockAPI } from '../../utils/mockAPI';
import { Appointment } from '../../types';
import { VideoRoom } from '../../components/VideoRoom';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const ap = await mockAPI.getAppointmentById(id);
        setAppointment(ap);
      } catch (err) {
        console.error("Failed to load appointment details:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleHangUp = () => {
    // Return back to dashboard once call is closed
    router.replace('/(tabs)');
  };

  const handleOpenNotes = () => {
    if (!id) return;
    router.push(`/notes/${id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Conectando ao canal de vídeo seguro E2E...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Consulta não localizada.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.backBtnText}>Voltar ao Painel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Customized Header */}
        <View style={styles.sessionHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Sair</Text>
          </TouchableOpacity>
          <Text style={styles.sessionTitle}>Teleconsulta Segura</Text>
          <View style={styles.encryptionIndicator}>
            <Text style={styles.encryptionText}>HIPAA 🛡️</Text>
          </View>
        </View>

        {/* Video Canvas Component */}
        <View style={styles.videoRoomWrapper}>
          <VideoRoom
            patientName={appointment.patientName}
            patientAvatar={appointment.patientAvatar}
            onHangUp={handleHangUp}
            onOpenNotes={handleOpenNotes}
          />
        </View>

        {/* Action Button: Start Evolution Notes */}
        <View style={styles.actionPanel}>
          <TouchableOpacity 
            style={styles.evolutionBtn} 
            onPress={handleOpenNotes}
            activeOpacity={0.8}
          >
            <Text style={styles.evolutionIcon}>📝</Text>
            <Text style={styles.evolutionBtnText}>Iniciar Prontuário Eletrônico</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sessionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  encryptionIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  encryptionText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoRoomWrapper: {
    flex: 1,
    marginBottom: 16,
  },
  actionPanel: {
    width: '100%',
  },
  evolutionBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  evolutionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  evolutionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
