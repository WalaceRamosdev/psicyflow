import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { fakeEncrypt, fakeDecrypt } from './security';
import { User, Patient, Appointment, SubscriptionStatus } from '../types';

// --- CONSTANTS & STORAGE KEYS ---
const SECURE_TOKEN_KEY = "psychflow_auth_token";
const USER_PROFILE_KEY = "psychflow_user_profile";
const USERS_DB_KEY = "@psychflow_users_db";

const APPOINTMENTS_STORAGE_KEY = "psychflow_appointments_v1";
const PATIENTS_STORAGE_KEY = "psychflow_patients_v1";

const SEED_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "Mariana Silva Costa",
    email: "mariana.silva@email.com",
    cpf: "12839485722",
    phone: "11982736455",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    subscriptionStatus: "active",
    sessionCount: 12,
    consecutiveMisses: 0,
    sessionsPerWeek: 1,
    clinicalReason: "Ansiedade Crônica"
  },
  {
    id: "p2",
    name: "Gabriel Santos Oliveira",
    email: "gabriel.oliveira@email.com",
    cpf: "34928374811",
    phone: "11977223344",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    subscriptionStatus: "inactive",
    sessionCount: 2,
    consecutiveMisses: 2,
    sessionsPerWeek: 1,
    clinicalReason: "Crise Depressiva"
  },
  {
    id: "p3",
    name: "Beatriz Ribeiro Lima",
    email: "beatriz.lima@email.com",
    cpf: "28473829144",
    phone: "21998765432",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    subscriptionStatus: "active",
    sessionCount: 24,
    consecutiveMisses: 0,
    sessionsPerWeek: 2,
    clinicalReason: "Conflito Conjugal"
  },
  {
    id: "p4",
    name: "Lucas Mendes Pereira",
    email: "lucas.mendes@email.com",
    cpf: "45091823488",
    phone: "31988554411",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    subscriptionStatus: "inactive",
    sessionCount: 1,
    consecutiveMisses: 0,
    sessionsPerWeek: 1,
    clinicalReason: "Foco e TDAH"
  }
];

const SEED_APPOINTMENTS = (todayStr: string): Appointment[] => [
  {
    id: "ap1",
    patientId: "p1",
    patientName: "Mariana Silva Costa",
    patientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    date: todayStr,
    time: "14:00",
    status: "confirmed",
    type: "online",
    notesDraft: "",
    notesEncrypted: "",
    notesFinalized: false
  },
  {
    id: "ap2",
    patientId: "p2",
    patientName: "Gabriel Santos Oliveira",
    patientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    date: todayStr,
    time: "15:30",
    status: "pending",
    type: "online",
    notesDraft: "",
    notesEncrypted: "",
    notesFinalized: false
  },
  {
    id: "ap3",
    patientId: "p3",
    patientName: "Beatriz Ribeiro Lima",
    patientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    date: todayStr,
    time: "17:00",
    status: "confirmed",
    type: "online",
    notesDraft: "Paciente relata progresso significativo com a gestão de ansiedade utilizando técnicas cognitivas...",
    notesEncrypted: fakeEncrypt("Evolução da sessão anterior: Paciente apresentou diminuição em sintomas ansiosos agudos."),
    notesFinalized: true
  },
  {
    id: "ap4",
    patientId: "p4",
    patientName: "Lucas Mendes Pereira",
    patientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    date: todayStr,
    time: "19:00",
    status: "pending",
    type: "presencial",
    notesDraft: "",
    notesEncrypted: "",
    notesFinalized: false
  }
];

// Helper delay generator to simulate REST network latency
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAPI = {
  /**
   * Helper to retrieve currently authenticated therapist's ID
   */
  async getActiveTherapistId(): Promise<string> {
    const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      const user = JSON.parse(profileJson) as User;
      return user.id;
    }
    return "guest";
  },

  /**
   * Initializes local storage with seed data if empty (Per Therapist Tenant)
   */
  async initializeDatabase(therapistId: string): Promise<void> {
    try {
      const appointmentsKey = `${APPOINTMENTS_STORAGE_KEY}_${therapistId}`;
      const patientsKey = `${PATIENTS_STORAGE_KEY}_${therapistId}`;

      const appointments = await AsyncStorage.getItem(appointmentsKey);
      const patients = await AsyncStorage.getItem(patientsKey);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      if (!patients) {
        // Pre-populate seed patients ONLY for the pre-seeded developer demo user
        const initialPatients = therapistId === "therapist_99" ? SEED_PATIENTS : [];
        await AsyncStorage.setItem(patientsKey, JSON.stringify(initialPatients));
      }
      if (!appointments) {
        // Pre-populate seed appointments ONLY for the pre-seeded developer demo user
        const initialAps = therapistId === "therapist_99" ? SEED_APPOINTMENTS(todayStr) : [];
        await AsyncStorage.setItem(appointmentsKey, JSON.stringify(initialAps));
      }
    } catch (error) {
      console.error("Failed to seed database:", error);
    }
  },

  /**
   * AUTHENTICATION & MULTI-TENANT REGISTRY API
   */
  async login(email: string, pin: string): Promise<{ user: User; token: string }> {
    await delay(300);
    const cleanedEmail = email.toLowerCase().trim();

    // 1. Seed global users database if empty with default demo therapist
    const usersJson = await AsyncStorage.getItem(USERS_DB_KEY);
    let usersList: User[] = usersJson ? JSON.parse(usersJson) : [];

    const demoExists = usersList.some(u => u.email === "demo@psychflow.com");
    if (!demoExists) {
      const demoUser: User = {
        id: "therapist_99",
        name: "Dr. Roberto D'Avila",
        email: "demo@psychflow.com",
        crp: "06/12345-SP",
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200"
      };
      usersList.push(demoUser);
      await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(usersList));
      // Seed default pin in SecureStore for demo account
      await SecureStore.setItemAsync(`psychflow_pin_${demoUser.email}`, "123456");
    }

    // 2. Lookup therapist in users list
    const matchedUser = usersList.find(u => u.email === cleanedEmail);
    if (!matchedUser) {
      throw new Error("Nenhum profissional cadastrado com este e-mail.");
    }

    // 3. Verify security PIN from native SecureStore
    const storedPin = await SecureStore.getItemAsync(`psychflow_pin_${cleanedEmail}`);
    if (storedPin !== pin) {
      throw new Error("PIN de segurança incorreto.");
    }

    const mockToken = `mock_jwt_token_secure_${matchedUser.id}_${Date.now()}`;

    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(matchedUser));

    // Bootstrap database for the logged-in tenant
    await this.initializeDatabase(matchedUser.id);

    return { user: matchedUser, token: mockToken };
  },

  async register(name: string, email: string, crp: string, pin: string): Promise<{ user: User; token: string }> {
    await delay(400);
    const cleanedEmail = email.toLowerCase().trim();

    if (!name.trim() || !email.trim() || !crp.trim() || !pin.trim()) {
      throw new Error("Por favor, preencha todos os campos obrigatórios.");
    }

    const usersJson = await AsyncStorage.getItem(USERS_DB_KEY);
    const usersList: User[] = usersJson ? JSON.parse(usersJson) : [];

    // Check if email already registered
    const emailExists = usersList.some(u => u.email === cleanedEmail);
    if (emailExists) {
      throw new Error("Este e-mail já está cadastrado no PsychFlow.");
    }

    // Create new therapist profile
    const newUserId = `therapist_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: name.trim(),
      email: cleanedEmail,
      crp: crp.trim(),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" // Default profile avatar
    };

    // Store in global therapist registry
    usersList.push(newUser);
    await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(usersList));

    // Save PIN securely in native device Keychain/Keystore
    await SecureStore.setItemAsync(`psychflow_pin_${cleanedEmail}`, pin);

    // Automatically set active session
    const mockToken = `mock_jwt_token_secure_${newUserId}_${Date.now()}`;
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newUser));

    // Bootstrap database for the new tenant
    await this.initializeDatabase(newUserId);

    return { user: newUser, token: mockToken };
  },

  async recoverPassword(email: string): Promise<string> {
    await delay(400);
    const cleanedEmail = email.toLowerCase().trim();

    const usersJson = await AsyncStorage.getItem(USERS_DB_KEY);
    const usersList: User[] = usersJson ? JSON.parse(usersJson) : [];

    const matchedUser = usersList.find(u => u.email === cleanedEmail);
    if (!matchedUser) {
      throw new Error("Nenhum profissional cadastrado com este e-mail.");
    }

    // Generate a temporary 6-digit recovery PIN
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Overwrite old PIN in SecureStore
    await SecureStore.setItemAsync(`psychflow_pin_${cleanedEmail}`, generatedPin);

    return generatedPin;
  },

  async loginWithBiometrics(): Promise<{ user: User; token: string } | null> {
    await delay(200);
    const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);

    if (token && profileJson) {
      const user = JSON.parse(profileJson) as User;
      return { user, token };
    }
    return null;
  },

  async logout(): Promise<void> {
    await delay(100);
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
  },

  async getCachedProfile(): Promise<User | null> {
    const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return profileJson ? (JSON.parse(profileJson) as User) : null;
  },

  /**
   * APPOINTMENTS & PATIENTS API (With Tenant Key Isolation)
   */
  async getAppointments(): Promise<Appointment[]> {
    await delay(300);
    const therapistId = await this.getActiveTherapistId();
    const appointmentsKey = `${APPOINTMENTS_STORAGE_KEY}_${therapistId}`;
    await this.initializeDatabase(therapistId);

    const data = await AsyncStorage.getItem(appointmentsKey);
    return data ? (JSON.parse(data) as Appointment[]) : [];
  },

  async getPatients(): Promise<Patient[]> {
    await delay(300);
    const therapistId = await this.getActiveTherapistId();
    const patientsKey = `${PATIENTS_STORAGE_KEY}_${therapistId}`;
    await this.initializeDatabase(therapistId);

    const data = await AsyncStorage.getItem(patientsKey);
    return data ? (JSON.parse(data) as Patient[]) : [];
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    await delay(200);
    const appointments = await this.getAppointments();
    return appointments.find(ap => ap.id === id) || null;
  },

  async updateAppointmentStatus(id: string, status: 'confirmed' | 'pending' | 'cancelled'): Promise<Appointment> {
    await delay(300);
    const therapistId = await this.getActiveTherapistId();
    const appointmentsKey = `${APPOINTMENTS_STORAGE_KEY}_${therapistId}`;

    const appointments = await this.getAppointments();
    const index = appointments.findIndex(ap => ap.id === id);
    if (index === -1) throw new Error("Consulta não encontrada.");

    appointments[index].status = status;
    await AsyncStorage.setItem(appointmentsKey, JSON.stringify(appointments));
    return appointments[index];
  },

  async updatePatientSubscription(id: string, status: SubscriptionStatus): Promise<Patient> {
    await delay(300);
    const therapistId = await this.getActiveTherapistId();
    const patientsKey = `${PATIENTS_STORAGE_KEY}_${therapistId}`;

    const patients = await this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Paciente não encontrado.");

    patients[index].subscriptionStatus = status;
    await AsyncStorage.setItem(patientsKey, JSON.stringify(patients));
    return patients[index];
  },

  /**
   * CLINICAL EVOLUTION (SECURED AUTO-SAVE LOGIC)
   */
  async saveNotesDraft(id: string, draft: string): Promise<void> {
    const therapistId = await this.getActiveTherapistId();
    const appointmentsKey = `${APPOINTMENTS_STORAGE_KEY}_${therapistId}`;

    const appointments = await this.getAppointments();
    const index = appointments.findIndex(ap => ap.id === id);
    if (index === -1) return;

    appointments[index].notesDraft = draft;
    await AsyncStorage.setItem(appointmentsKey, JSON.stringify(appointments));
  },

  async finalizeNotes(id: string, clearTextNotes: string): Promise<Appointment> {
    await delay(400);
    const therapistId = await this.getActiveTherapistId();
    const appointmentsKey = `${APPOINTMENTS_STORAGE_KEY}_${therapistId}`;

    const appointments = await this.getAppointments();
    const index = appointments.findIndex(ap => ap.id === id);
    if (index === -1) throw new Error("Consulta não encontrada.");

    const encryptedData = fakeEncrypt(clearTextNotes);

    appointments[index].notesDraft = "";
    appointments[index].notesEncrypted = encryptedData;
    appointments[index].notesFinalized = true;

    await AsyncStorage.setItem(appointmentsKey, JSON.stringify(appointments));
    return appointments[index];
  }
};
