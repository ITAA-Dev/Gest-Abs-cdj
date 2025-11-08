// FIX: Define the application's data types based on usage in constants.ts.
// This resolves errors related to missing type definitions.

export type AbsenceType = 'A' | 'AJ' | 'R' | 'Aut' | 'D';

export interface Absence {
  [sessionId: string]: AbsenceType;
}

export interface Absences {
  [date: string]: Absence;
}

export interface Behavior {
  date: string;
  motif: string;
  sanction: string;
}

export interface Trainee {
  id: string;
  cef: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: string;
  absences: Absences;
  behavior: Behavior[];
}

export interface Group {
  id: string;
  name: string;
  filiereId: string;
  trainingYear: string;
  annualHours: number;
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
