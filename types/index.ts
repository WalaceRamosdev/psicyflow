export type SubscriptionStatus = 'active' | 'inactive';

export type BondTag = 'novo' | 'risco_evasao' | 'alta_frequencia' | 'regular';

export interface User {
  id: string;
  name: string;
  email: string;
  crp: string;
  avatar: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  avatar: string;
  subscriptionStatus: SubscriptionStatus;
  sessionCount: number;
  consecutiveMisses: number;
  sessionsPerWeek: number;
  clinicalReason: string; // e.g. "Ansiedade", "Depressão", "Terapia de Casal"
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'confirmed' | 'pending' | 'cancelled';
  type: 'online' | 'presencial';
  notesDraft?: string;
  notesEncrypted?: string;
  notesFinalized?: boolean;
  roomUrl?: string;
}

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  actionType?: 'stories_generator' | 'reminder_48h' | 'none';
}
