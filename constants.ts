import { Level, Filiere, Group, Trainee, AbsenceType } from './types';

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const SESSIONS = [
  { id: 'S1', time: '08H30 - 11H00' },
  { id: 'S2', time: '11H00 - 13H30' },
  { id: 'S3', time: '13H30 - 16H00' },
  { id: 'S4', time: '16H00 - 18H30' },
];

export const SESSION_DURATION = 2.5; // hours
export const RETARD_VALUE = 1.25; // hours (4 retards = 1 jour = 5h, donc 5/4 = 1.25)
// FIX: Added AbsenceType to the import statement above.
export const ABSENCE_TYPES: AbsenceType[] = ['A', 'AJ', 'R', 'Aut', 'D'];

// --- Initial Data ---

export const initialLevels: Level[] = [
  { id: 'L1', name: 'Technicien Spécialisé' },
  { id: 'L2', name: 'Technicien' },
];

export const initialFilieres: Filiere[] = [
  { id: 'F1', name: 'Développement Digital', levelId: 'L1' },
  { id: 'F2', name: 'Infrastructure Digitale', levelId: 'L1' },
  { id: 'F3', name: 'Gestion des Entreprises', levelId: 'L2' },
];

export const initialGroups: Group[] = [
  { id: 'G1', name: 'DEV101', filiereId: 'F1', trainingYear: '2023-2024', annualHours: 1200 },
  { id: 'G2', name: 'DEV102', filiereId: 'F1', trainingYear: '2023-2024', annualHours: 1200 },
  { id: 'G3', name: 'ID101', filiereId: 'F2', trainingYear: '2023-2024', annualHours: 1100 },
  { id: 'G4', name: 'GE101', filiereId: 'F3', trainingYear: '2023-2024', annualHours: 900 },
];

export const initialTrainees: Trainee[] = [
  { id: 'T1', cef: 'A123', firstName: 'Jean', lastName: 'Dupont', birthDate: '2002-05-15', groupId: 'G1', absences: {}, behavior: [{ date: '2023-10-15', motif: 'Refus de travail', sanction: 'Mise en garde' }] },
  { id: 'T2', cef: 'B456', firstName: 'Marie', lastName: 'Curie', birthDate: '2003-08-20', groupId: 'G1', absences: {}, behavior: [] },
  { id: 'T3', cef: 'C789', firstName: 'Pierre', lastName: 'Martin', birthDate: '2002-01-10', groupId: 'G2', absences: {}, behavior: [
      { date: '2023-11-01', motif: 'Perturbation en cours', sanction: 'Mise en garde' },
      { date: '2023-11-20', motif: 'Manque de respect', sanction: 'Avertissement' },
      { date: '2024-01-10', motif: 'Usage du téléphone', sanction: 'Blâme' },
  ] },
  { id: 'T4', cef: 'D101', firstName: 'Lucie', lastName: 'Bernard', birthDate: '2004-11-30', groupId: 'G3', absences: {}, behavior: [] },
  { id: 'T5', cef: 'E112', firstName: 'Ahmed', lastName: 'El Fassi', birthDate: '2003-03-25', groupId: 'G4', absences: {}, behavior: [] },
];
