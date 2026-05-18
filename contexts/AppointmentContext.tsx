import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { mockAPI } from '../utils/mockAPI';
import { Appointment, Patient, SubscriptionStatus } from '../types';

interface AppointmentContextType {
  appointments: Appointment[];
  patients: Patient[];
  isLoading: boolean;
  fetchAppointments: () => Promise<void>;
  fetchPatients: () => Promise<void>;
  reconfirmAppointment: (id: string) => Promise<void>;
  updateStatus: (id: string, status: 'confirmed' | 'pending' | 'cancelled') => Promise<void>;
  updatePatientSubscription: (id: string, status: SubscriptionStatus) => Promise<void>;
  saveNotesDraft: (id: string, draft: string) => Promise<void>;
  finalizeNotes: (id: string, notes: string) => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockAPI.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      Alert.alert("Erro de Rede", "Não foi possível carregar as consultas da nuvem segura.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockAPI.getPatients();
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  const reconfirmAppointment = useCallback(async (id: string) => {
    try {
      const appointment = appointments.find((ap) => ap.id === id);
      if (!appointment) return;

      Alert.alert(
        "📣 Notificação Enviada!",
        `Disparado mock de confirmação ativa via SMS & WhatsApp para ${appointment.patientName}.\n\nSimulando resposta do paciente...`,
        [
          {
            text: "Ok, Aguardar",
            style: "default"
          },
          {
            text: "Simular Confirmação",
            onPress: async () => {
              setIsLoading(true);
              try {
                const updated = await mockAPI.updateAppointmentStatus(id, 'confirmed');
                setAppointments((prev) =>
                  prev.map((ap) => (ap.id === id ? updated : ap))
                );
                Alert.alert("Sucesso", `${appointment.patientName} reconfirmou a sessão de forma ativa!`);
              } catch (err) {
                console.error("Failed to simulate confirm:", err);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error("Failed to trigger reconfirmation push:", err);
    }
  }, [appointments]);

  const updateStatus = useCallback(async (id: string, status: 'confirmed' | 'pending' | 'cancelled') => {
    setIsLoading(true);
    try {
      const updated = await mockAPI.updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((ap) => (ap.id === id ? updated : ap))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      Alert.alert("Erro", "Erro ao atualizar o status da consulta.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePatientSubscription = useCallback(async (id: string, status: SubscriptionStatus) => {
    setIsLoading(true);
    try {
      const updated = await mockAPI.updatePatientSubscription(id, status);
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch (err) {
      console.error("Error updating patient subscription:", err);
      Alert.alert("Erro", "Erro ao atualizar o pacote recorrente do paciente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveNotesDraft = useCallback(async (id: string, draft: string) => {
    try {
      setAppointments((prev) =>
        prev.map((ap) => (ap.id === id ? { ...ap, notesDraft: draft } : ap))
      );
      await mockAPI.saveNotesDraft(id, draft);
    } catch (err) {
      console.error("Error saving evolution draft:", err);
    }
  }, []);

  const finalizeNotes = useCallback(async (id: string, notes: string) => {
    setIsLoading(true);
    try {
      const updated = await mockAPI.finalizeNotes(id, notes);
      setAppointments((prev) =>
        prev.map((ap) => (ap.id === id ? updated : ap))
      );
      Alert.alert("✨ Sucesso", "Evolução clínica finalizada e criptografada localmente com sucesso.");
    } catch (err) {
      console.error("Error finalising notes:", err);
      Alert.alert("Erro", "Não foi possível criptografar ou arquivar esta evolução.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        patients,
        isLoading,
        fetchAppointments,
        fetchPatients,
        reconfirmAppointment,
        updateStatus,
        updatePatientSubscription,
        saveNotesDraft,
        finalizeNotes,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
