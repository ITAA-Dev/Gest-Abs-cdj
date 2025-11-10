export type AbsenceType = 'A' | 'AJ' | 'R' | 'Aut' | 'D';

// From `incidents_comportement` table
export interface IncidentComportement {
  id: string; // UUID
  stagiaire_id: string;
  date_incident: string; // YYYY-MM-DD
  motif: string;
  sanction: string;
  created_at?: string;
}

// Corresponds to the `stagiaires` table
export interface Trainee {
  id: string; // UUID
  cef: string;
  firstName: string; // prenom
  lastName: string; // nom
  birthDate: string; // date_naissance (YYYY-MM-DD)
  groupId: string; // groupe_id
  dropoutDate?: string | null; // date_deperdition (YYYY-MM-DD)
  created_at?: string;
  updated_at?: string;
  // Nested properties are now in separate tables
}

// Corresponds to the `absences` table
export interface Absence {
    id: string; // UUID
    stagiaire_id: string;
    date_absence: string; // YYYY-MM-DD
    session_id: string; // S1, S2, S3, S4
    type: AbsenceType;
    created_at?: string;
}

// Corresponds to the `groupes` table
export interface Group {
  id: string; // UUID
  name: string; // nom
  filiereId: string; // filiere_id
  annualHours: number; // masse_horaire_annuelle
  trainingYear: string; // annee_formation
  created_at?: string;
}

// Corresponds to the `filieres` table
export interface Filiere {
  id:string; // UUID
  name: string; // nom
  levelId: string; // niveau_id
  created_at?: string;
}

// Corresponds to the `niveaux` table
export interface Level {
  id: string; // UUID
  name: string; // nom
  created_at?: string;
}

export interface TrainingData {
  levels: Level[];
  filieres: Filiere[];
  groups: Group[];
  trainees: Trainee[];
  absences: Absence[];
  incidents: IncidentComportement[];
}

export interface ArchivedData {
  [year: string]: Omit<TrainingData, 'absences' | 'incidents'>; // Archiving doesn't need to be as granular for now
}

// From `profiles` table
export interface Profile {
  id: string; // UUID, references auth.users(id)
  email: string;
  nom_complet: string;
  role: 'superAdmin' | 'assistant';
  avatar_url?: string;
  updated_at?: string;
}

// From `establishments` table
export interface Establishment {
    id: string; // UUID
    name: string;
    logo_url: string | null;
    sup_admin_id: string;
    created_at?: string;
}
