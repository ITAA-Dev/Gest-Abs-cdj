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
  email: string;
  name: string;
  role: 'superAdmin' | 'assistant';
  password?: string;
  picture?: string;
}
