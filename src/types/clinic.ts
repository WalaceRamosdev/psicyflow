export interface BookingRules {
  startHour: string;       // e.g. "08:00"
  endHour: string;         // e.g. "18:00"
  bufferMinutes: number;   // e.g. 10, 15
  lunchStart: string;      // e.g. "12:00"
  lunchEnd: string;        // e.g. "13:00"
  workDays: number[];      // Sunday = 0, Monday = 1, etc. e.g. [1, 2, 3, 4, 5]
}

export interface WebAnalytics {
  cliques24h: number;
  cliques7d: number;
}

export interface ProfessionalProfile {
  id: string;
  name: string;
  crp: string;
  avatar: string;
  bio: string;
  specialties: string[];    // e.g. "Infantil", "Casal", "Luto", "Depressão"
  sessionValue: number;
  firstSessionValue: number;
  cancellationPolicy: string; // e.g. "Cancelamento grátis até 24h antes"
  officeDomain?: string;       // e.g. "drasilva.com.br"
  officeDomainLinked: boolean;
  bookingRules: BookingRules;
  analytics: WebAnalytics;
}

export type AppointmentStatus =
  | 'requested'
  | 'confirmed_patient'
  | 'confirmed_therapist'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  date: string;            // YYYY-MM-DD
  time: string;            // HH:MM
  duration: number;        // minutes, e.g. 50
  status: AppointmentStatus;
  cancellationReason?: string;
  hasFinancialAlert?: boolean; // True if patient has outstanding debts
  notesDraft?: string;
  notesEncrypted?: string;
  notesFinalized: boolean;
  type: 'online' | 'presencial';
  roomUrl?: string;
}

export interface FinancialTransaction {
  id: string;
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;         // YYYY-MM-DD
  paymentDate?: string;
  paymentGatewayLink?: string; // Predefined link (Stripe / Mercado Pago)
  taxCalculated?: number;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  date: string;
  title: string;
  content: string;         // Plaintext clinical data (decrypted)
  contentEncrypted?: string; // AES256 or secure draft payload
  isFinalized: boolean;
  templateName?: string;   // "Modelo TCC", "Modelo Psicanálise", etc.
  patientSymptomTrend?: 'stable' | 'improved' | 'declining';
  attachments?: string[];  // absolute file paths or secure cloud URIs
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  preferredDays: number[];  // Preferred days of week
  preferredHours: string[]; // "morning", "afternoon", "night"
}
