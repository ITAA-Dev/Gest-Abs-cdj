export type AbsenceType = 'A' | 'AJ' | 'R' | 'Aut' | 'D';

export interface BehaviorIncident {
  date: string; // YYYY-MM-DD
  motif: string;
  sanction: string;
}

export interface Trainee {
  id: string;
  cef: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  groupId: string;
  absences: {
    [date: string]: { // YYYY-MM-DD
      [sessionId: string]: AbsenceType;
    };
  };
  behavior?: BehaviorIncident[];
  dropoutDate?: string; // YYYY-MM-DD
}

export interface Group {
  id: string;
  name: string;
  filiereId: string;
  annualHours: number;
  trainingYear: string;
}

export interface Filiere {
  id: string;
  name: string;
  levelId: string;
}

export interface Level {
  id: string;
  name: string;
}

export interface TrainingData {
  levels: Level[];
  filieres: Filiere[];
  groups: Group[];
  trainees: Trainee[];
}

export interface ArchivedData {
  [year: string]: TrainingData;
}

export interface User {
  id: string; // Supabase auth user ID
  email: string;
  name?: string;
  picture?: string;
  role: 'sup_admin' | 'admin_assistant'; // Role from public.users table
  establishment_id: string; // From public.users table
}

export interface Assistant {
    id: string;
    email: string;
    name: string;
    role: 'admin_assistant';
}
