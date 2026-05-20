import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { fakeEncrypt } from './security';
import { User, Patient, Appointment, SubscriptionStatus } from '../types';
import { supabase } from '../src/services/supabase';

// Helper to sanitize keys (maintained for backward compatibility)
const sanitizeKey = (key: string): string => {
  return key.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Database Auto-Seeding: Populates a new therapist's account with demo patients and appointments
async function seedDatabaseIfEmpty(psychologistId: string) {
  try {
    const { count, error: countError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psychologistId);

    if (countError) throw countError;

    if (count === 0) {
      console.log("[Supabase Seed] Seeding default patients and appointments for:", psychologistId);
      
      const patientsToInsert = [
        {
          name: "Mariana Silva Costa",
          email: "mariana.silva@email.com",
          cpf: "12839485722",
          phone: "11982736455",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
          subscription_status: "active",
          psychologist_id: psychologistId
        },
        {
          name: "Gabriel Santos Oliveira",
          email: "gabriel.oliveira@email.com",
          cpf: "34928374811",
          phone: "11977223344",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
          subscription_status: "inactive",
          psychologist_id: psychologistId
        },
        {
          name: "Beatriz Ribeiro Lima",
          email: "beatriz.lima@email.com",
          cpf: "28473829144",
          phone: "21998765432",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          subscription_status: "active",
          psychologist_id: psychologistId
        },
        {
          name: "Lucas Mendes Pereira",
          email: "lucas.mendes@email.com",
          cpf: "45091823488",
          phone: "31988554411",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
          subscription_status: "inactive",
          psychologist_id: psychologistId
        }
      ];

      const { data: insertedPatients, error: patientsError } = await supabase
        .from('patients')
        .insert(patientsToInsert)
        .select();

      if (patientsError) throw patientsError;

      const p1 = insertedPatients.find(p => p.name.includes("Mariana"))?.id;
      const p2 = insertedPatients.find(p => p.name.includes("Gabriel"))?.id;
      const p3 = insertedPatients.find(p => p.name.includes("Beatriz"))?.id;
      const p4 = insertedPatients.find(p => p.name.includes("Lucas"))?.id;

      const todayStr = new Date().toISOString().split('T')[0];

      const appointmentsToInsert = [
        {
          psychologist_id: psychologistId,
          patient_id: p1,
          patient_name: "Mariana Silva Costa",
          patient_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
          date: todayStr,
          time: "14:00:00",
          status: "confirmed",
          type: "online",
          notes_draft: "",
          notes_encrypted: "",
          notes_finalized: false
        },
        {
          psychologist_id: psychologistId,
          patient_id: p2,
          patient_name: "Gabriel Santos Oliveira",
          patient_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
          date: todayStr,
          time: "15:30:00",
          status: "pending",
          type: "online",
          notes_draft: "",
          notes_encrypted: "",
          notes_finalized: false
        },
        {
          psychologist_id: psychologistId,
          patient_id: p3,
          patient_name: "Beatriz Ribeiro Lima",
          patient_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          date: todayStr,
          time: "17:00:00",
          status: "confirmed",
          type: "online",
          notes_draft: "",
          notes_encrypted: fakeEncrypt("Evolução da sessão anterior: Paciente apresentou diminuição em sintomas ansiosos agudos."),
          notes_finalized: true
        },
        {
          psychologist_id: psychologistId,
          patient_id: p4,
          patient_name: "Lucas Mendes Pereira",
          patient_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
          date: todayStr,
          time: "19:00:00",
          status: "pending",
          type: "presencial",
          notes_draft: "",
          notes_encrypted: "",
          notes_finalized: false
        }
      ];

      const { error: apptsError } = await supabase
        .from('appointments')
        .insert(appointmentsToInsert);

      if (apptsError) throw apptsError;

      const transactionsToInsert = [
        {
          psychologist_id: psychologistId,
          patient_id: p3,
          patient_name: 'Beatriz Ribeiro Lima',
          description: 'Sessão Psicoterapia Online (18/05)',
          amount: 180.00,
          type: 'income',
          status: 'paid',
          due_date: todayStr,
          payment_date: todayStr,
          tax_calculated: 10.80
        },
        {
          psychologist_id: psychologistId,
          patient_id: p2,
          patient_name: 'Gabriel Santos Oliveira',
          description: 'Mensalidade Pacote TCC Recorrente',
          amount: 720.00,
          type: 'income',
          status: 'overdue',
          due_date: new Date(Date.now() - 432000000).toISOString().split('T')[0],
          payment_gateway_link: 'https://checkout.psychflow.com/pay/p_gabriel_overdue_tcc',
          tax_calculated: 43.20
        },
        {
          psychologist_id: psychologistId,
          description: 'Aluguel Consultório Físico (Sala 4)',
          amount: 1200.00,
          type: 'expense',
          status: 'paid',
          due_date: todayStr,
          payment_date: todayStr
        }
      ];

      await supabase.from('financial_transactions').insert(transactionsToInsert);

      // Create initial clinical record log
      const { data: createdAppt } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', p3)
        .limit(1)
        .single();

      if (createdAppt) {
        const recordsToInsert = [
          {
            psychologist_id: psychologistId,
            patient_id: p3,
            appointment_id: createdAppt.id,
            date: todayStr,
            title: 'Sessão 4 - Análise Comportamental Burnout',
            content: 'Paciente apresenta melhora expressiva nos níveis de ansiedade após a aplicação da técnica de reestruturação cognitiva sobre tarefas laborais. Apresentou relato sobre regulação do sono estável. Planejado manutenção da tarefa comportamental.',
            is_finalized: true,
            template_name: 'Modelo TCC',
            patient_symptom_trend: 'improved',
            content_encrypted: fakeEncrypt('Paciente apresenta melhora expressiva nos níveis de ansiedade após a aplicação da técnica de reestruturação cognitiva.')
          }
        ];
        await supabase.from('clinical_records').insert(recordsToInsert);
      }
    }
  } catch (err) {
    console.error("[Seeding Error] Failed to seed Supabase database:", err);
  }
}

// Database Entity Mapping functions
const mapPatientFromDb = (db: any): Patient => ({
  id: db.id,
  name: db.name,
  email: db.email || '',
  cpf: db.cpf || '',
  phone: db.phone || '',
  avatar: db.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
  subscriptionStatus: (db.subscription_status === 'active' ? 'active' : 'inactive') as SubscriptionStatus,
  sessionCount: 12,
  consecutiveMisses: 0,
  sessionsPerWeek: 1,
  clinicalReason: 'Consulta de Rotina',
});

const mapAppointmentFromDb = (db: any): Appointment => ({
  id: db.id,
  patientId: db.patient_id,
  patientName: db.patient_name,
  patientAvatar: db.patient_avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
  date: db.date,
  time: db.time ? db.time.substring(0, 5) : '', // '14:00:00' -> '14:00'
  status: (db.status === 'confirmed' || db.status === 'confirmed_patient' || db.status === 'confirmed_therapist' ? 'confirmed' : db.status === 'pending' || db.status === 'requested' ? 'pending' : 'cancelled') as 'confirmed' | 'pending' | 'cancelled',
  type: (db.type === 'online' ? 'online' : 'presencial') as 'online' | 'presencial',
  notesDraft: db.notes_draft || '',
  notesEncrypted: db.notes_encrypted || '',
  notesFinalized: db.notes_finalized || false,
  roomUrl: db.room_url || (db.type === 'online' ? `https://meet.jit.si/PsychFlow_${db.psychologist_id?.replace(/[^a-zA-Z0-9]/g, '') || 'therapist'}_${db.id?.replace(/[^a-zA-Z0-9]/g, '')}` : undefined),
});

export const mockAPI = {
  /**
   * Helper to retrieve currently authenticated therapist's ID
   */
  async getActiveTherapistId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || 'guest';
  },

  /**
   * Database initialization - only seeds demo data in development mode.
   * Production accounts start clean and empty.
   */
  async initializeDatabase(therapistId: string): Promise<void> {
    if (__DEV__ && therapistId && therapistId !== 'guest') {
      await seedDatabaseIfEmpty(therapistId);
    }
  },

  // Auth wrappers kept for safety, deprecated in favor of direct Supabase context auth
  async login(email: string, pin: string) {
    return { user: {} as User, token: "" };
  },
  async register(name: string, email: string, crp: string, pin: string) {
    return { user: {} as User, token: "" };
  },
  async recoverPassword(email: string) {
    return "";
  },
  async loginWithBiometrics() {
    return null;
  },
  async logout() {},
  async getCachedProfile(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, crp, avatar')
        .eq('id', session.user.id)
        .single();
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.name || session.user.user_metadata?.name || 'Psicólogo',
        crp: profile?.crp || session.user.user_metadata?.crp || '',
        avatar: profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      };
    }
    return null;
  },

  /**
   * REAL SUPABASE-BACKED APPOINTMENTS & PATIENTS API
   */
  async getAppointments(): Promise<Appointment[]> {
    const therapistId = await this.getActiveTherapistId();
    if (therapistId === 'guest') return [];
    
    await this.initializeDatabase(therapistId);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('psychologist_id', therapistId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error("[Supabase getAppointments] Error fetching appointments:", error);
      return [];
    }

    return (data || []).map(mapAppointmentFromDb);
  },

  async getPatients(): Promise<Patient[]> {
    const therapistId = await this.getActiveTherapistId();
    if (therapistId === 'guest') return [];

    await this.initializeDatabase(therapistId);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('psychologist_id', therapistId)
      .order('name', { ascending: true });

    if (error) {
      console.error("[Supabase getPatients] Error fetching patients:", error);
      return [];
    }

    return (data || []).map(mapPatientFromDb);
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[Supabase getAppointmentById] Error fetching appointment ${id}:`, error);
      return null;
    }

    return data ? mapAppointmentFromDb(data) : null;
  },

  async updateAppointmentStatus(id: string, status: 'confirmed' | 'pending' | 'cancelled'): Promise<Appointment> {
    // Translate UI status back to database status column format
    const dbStatus = status === 'confirmed' ? 'confirmed' : status === 'pending' ? 'pending' : 'cancelled';

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase updateAppointmentStatus] Error:`, error);
      throw error;
    }

    return mapAppointmentFromDb(data);
  },

  async updatePatientSubscription(id: string, status: SubscriptionStatus): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update({ subscription_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase updatePatientSubscription] Error:`, error);
      throw error;
    }

    return mapPatientFromDb(data);
  },

  /**
   * CLINICAL EVOLUTION (SECURED SUPABASE DRAFTS & FINALIZATION)
   */
  async saveNotesDraft(id: string, draft: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ notes_draft: draft })
      .eq('id', id);

    if (error) {
      console.error(`[Supabase saveNotesDraft] Error:`, error);
    }
  },

  async finalizeNotes(id: string, clearTextNotes: string): Promise<Appointment> {
    const encryptedData = fakeEncrypt(clearTextNotes);

    const { data, error } = await supabase
      .from('appointments')
      .update({
        notes_draft: "",
        notes_encrypted: encryptedData,
        notes_finalized: true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase finalizeNotes] Error finalizing notes:`, error);
      throw error;
    }

    // Proactively log this inside clinical_records table
    try {
      await supabase.from('clinical_records').insert({
        psychologist_id: data.psychologist_id,
        patient_id: data.patient_id,
        appointment_id: data.id,
        title: `Evolução Clínica - Sessão ${data.date}`,
        content_encrypted: encryptedData,
        is_finalized: true,
        patient_symptom_trend: 'stable'
      });
    } catch (recordErr) {
      console.warn("[Supabase finalizeNotes] Warning: Failed to insert detailed clinical record row:", recordErr);
    }

    return mapAppointmentFromDb(data);
  }
};

