import { AbsenceType } from './types';

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const SESSIONS = [
  { id: 'S1', time: '08H30 - 11H00' },
  { id: 'S2', time: '11H00 - 13H30' },
  { id: 'S3', time: '13H30 - 16H00' },
  { id: 'S4', time: '16H00 - 18H30' },
];

export const SESSION_DURATION = 2.5; // hours
export const RETARD_VALUE = 1.25; // hours (4 retards = 1 jour = 5h, donc 5/4 = 1.25)
export const ABSENCE_TYPES: AbsenceType[] = ['A', 'AJ', 'R', 'Aut', 'D'];

// --- Initial Data has been removed as data is now fetched from Supabase ---
