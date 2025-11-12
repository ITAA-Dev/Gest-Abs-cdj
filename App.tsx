// FIX: Corrected the React import statement to properly import React and its hooks. This resolves all subsequent "Cannot find name" errors in the file.
import React, from 'react';
import { initialLevels, initialFilieres, initialGroups, initialTrainees, DAYS, SESSIONS, SESSION_DURATION, RETARD_VALUE, ABSENCE_TYPES } from './constants';
import type { Trainee, Group, Filiere, Level, TrainingData, ArchivedData, AbsenceType, BehaviorIncident, User } from './types';
import { Auth } from './Auth';
import { supabase, signOut } from './supabase';


// Add external library types to window for Excel parsing and PDF generation
declare global {
    interface Window {
        XLSX: any;
        html2canvas: any;
        jspdf: any;
    }
}

const DEMO_USER: User = { 
  email: 'demo@log2.com', 
  name: 'Administrateur Démo', 
  role: 'superAdmin', 
  password: 'password123',
  establishmentInfo: {
      name: 'Mon Établissement de Formation',
      logo: null
  }
};


// --- ICONS ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ClockIcon = ({ className = "h-8 w-8 text-blue-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = ({ className = "h-8 w-8 text-indigo-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 016 3.803M15 21a6 6 0 00-9-5.197" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const PercentageIcon = ({ className = "h-8 w-8 text-purple-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l5-5m-5 5l5 5m6-12a2 2 0 100 4 2 2 0 000-4zm0 10a2 2 0 100 4 2 2 0 000-4z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const AlertIcon = ({ className = "h-8 w-8 text-yellow-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const CalendarIcon = ({ className = "h-8 w-8 text-cyan-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SanctionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const BehaviorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const UserMinusIcon = ({ className = "h-8 w-8 text-red-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm7-1h6" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm2-9V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5h10a1 1 0 100-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 13H9a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const UserCircleIcon = ({ className = 'h-8 w-8 text-gray-400' } : { className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;

// --- SANCTION DATA & LOGIC (ASSIDUITE) ---
const SANCTION_RULES_FOR_DISPLAY = [
    { retards: '4 Retards', days: '1 Journée', points: '-1', sanction: '1ère Mise en garde', authority: 'Gestionnaire des Stagiaires' },
    { retards: '8 Retards', days: '2 Journées', points: '-2', sanction: '2ème Mise en garde', authority: 'Gestionnaire des Stagiaires' },
    { retards: '12 Retards', days: '3 Journées', points: '-3', sanction: '1er Avertissement', authority: 'Directeur' },
    { retards: '16 Retards', days: '4 Journées', points: '-4', sanction: '2ème Avertissement', authority: 'Directeur' },
    { retards: '20 Retards', days: '5 Journées', points: '-5', sanction: 'Blâme', authority: 'Conseil Disciplinaire' },
    { retards: '24 Retards', days: '6 Journées', points: '-6', sanction: 'Exclusion de 2 jours', authority: 'Conseil de Discipline' },
    { retards: '28 Retards', days: '7 Journées', points: '-7', sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { retards: '32 Retards', days: '8 Journées', points: '-8', sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { retards: '36 Retards', days: '9 Journées', points: '-9', sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { retards: '40 Retards', days: '10 Journées', points: '-10', sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { retards: 'Au delà de 40 retards', days: 'Au delà de 10 journées', points: '', sanction: 'Exclusion définitive', authority: 'Conseil Discipline' }
];

const SANCTION_THRESHOLDS = [
    { minEquivalentRetards: 41, points: null, sanction: 'Exclusion définitive', authority: 'Conseil Discipline' },
    { minEquivalentRetards: 40, points: -10, sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { minEquivalentRetards: 36, points: -9, sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { minEquivalentRetards: 32, points: -8, sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { minEquivalentRetards: 28, points: -7, sanction: "Exclusion temporaire ou définitive à l'appréciation du CD", authority: 'Conseil Discipline' },
    { minEquivalentRetards: 24, points: -6, sanction: 'Exclusion de 2 jours', authority: 'Conseil de Discipline' },
    { minEquivalentRetards: 20, points: -5, sanction: 'Blâme', authority: 'Conseil Disciplinaire' },
    { minEquivalentRetards: 16, points: -4, sanction: '2ème Avertissement', authority: 'Directeur' },
    { minEquivalentRetards: 12, points: -3, sanction: '1er Avertissement', authority: 'Directeur' },
    { minEquivalentRetards: 8, points: -2, sanction: '2ème Mise en garde', authority: 'Gestionnaire des Stagiaires' },
    { minEquivalentRetards: 4, points: -1, sanction: '1ère Mise en garde', authority: 'Gestionnaire des Stagiaires' },
];

const calculateTraineeAbsenceStats = (trainee: Trainee, selectedMonth: string) => {
    let retardCount = 0;
    let absenceHours = 0; // Unjustified for sanctions ('A')

    for (const date in trainee.absences) {
        if (trainee.dropoutDate && date >= trainee.dropoutDate) continue; // Ignore absences after dropout date
        if (!selectedMonth || date.substring(0, 7) === selectedMonth) {
            for (const sessionId in trainee.absences[date]) {
                const type = trainee.absences[date][sessionId] as AbsenceType;
                if (type === 'A') absenceHours += SESSION_DURATION;
                else if (type === 'R') retardCount++;
            }
        }
    }
    
    const equivalentRetardsFromAbsence = (absenceHours / RETARD_VALUE);
    const totalEquivalentRetards = retardCount + equivalentRetardsFromAbsence;
    const totalAbsenceDays = absenceHours / (SESSION_DURATION * 2);

    for (const level of SANCTION_THRESHOLDS) {
        if (totalEquivalentRetards >= level.minEquivalentRetards) {
            return { retardCount, totalAbsenceDays, sanction: level };
        }
    }

    return { retardCount, totalAbsenceDays, sanction: null };
};

const getSanctionStyle = (sanction: { sanction: string } | null) => {
    if (!sanction) return 'bg-gray-100 text-gray-800';
    const sanctionText = sanction.sanction.toLowerCase();
    if (sanctionText.includes('exclusion') || sanctionText.includes('blâme')) {
        return 'bg-red-100 text-red-800';
    }
    if (sanctionText.includes('avertissement')) {
        return 'bg-orange-100 text-orange-800';
    }
    if (sanctionText.includes('mise en garde')) {
        return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
};

// --- SANCTION DATA & LOGIC (COMPORTEMENT) ---
const BEHAVIOR_SANCTION_RULES_FOR_DISPLAY = [
    { motif: '1ère Indiscipline', sanction: 'Mise en garde', points: '-1', authority: 'Gestionnaire des Stagiaires' },
    { motif: '2ème Indiscipline', sanction: 'Avertissement', points: '-2', authority: 'Directeur' },
    { motif: '3ème Indiscipline', sanction: 'Blâme', points: '-3', authority: 'Conseil de Discipline' },
    { motif: '4ème Indiscipline', sanction: 'Exclusion de 2 jours', points: '-4', authority: 'Conseil de Discipline' },
    { motif: '5ème Indiscipline', sanction: 'Exclusion définitive', points: '-5', authority: 'Conseil de Discipline' }
];

const BEHAVIOR_SANCTION_THRESHOLDS = [
    { minIncidents: 5, points: -5, sanction: 'Exclusion définitive', authority: 'Conseil de Discipline' },
    { minIncidents: 4, points: -4, sanction: 'Exclusion de 2 jours', authority: 'Conseil de Discipline' },
    { minIncidents: 3, points: -3, sanction: 'Blâme', authority: 'Conseil de Discipline' },
    { minIncidents: 2, points: -2, sanction: 'Avertissement', authority: 'Directeur' },
    { minIncidents: 1, points: -1, sanction: 'Mise en garde', authority: 'Gestionnaire des Stagiaires' }
];

const calculateTraineeBehaviorStats = (trainee: Trainee) => {
    const incidents = trainee.behavior || [];
    const incidentCount = incidents.length;

    if (incidentCount === 0) {
        return { incidentCount, sanction: null };
    }

    // Create a map of sanction name to severity level (lower index in thresholds array = higher severity)
    const sanctionSeverity = new Map(BEHAVIOR_SANCTION_THRESHOLDS.map((rule, index) => [rule.sanction, BEHAVIOR_SANCTION_THRESHOLDS.length - index]));

    let highestSanctionObject = null;
    let maxSeverity = -1;

    for (const incident of incidents) {
        // The incident now has a sanction property
        const severity = sanctionSeverity.get(incident.sanction);
        if (severity !== undefined && severity > maxSeverity) {
            maxSeverity = severity;
            // Find the full sanction object from the thresholds array to get points, authority etc.
            highestSanctionObject = BEHAVIOR_SANCTION_THRESHOLDS.find(s => s.sanction === incident.sanction) || null;
        }
    }

    return { incidentCount, sanction: highestSanctionObject };
};


const getBehaviorSanctionStyle = (sanction: { sanction: string } | null) => {
     if (!sanction) return 'bg-gray-100 text-gray-800';
    const sanctionText = sanction.sanction.toLowerCase();
    if (sanctionText.includes('exclusion') || sanctionText.includes('blâme')) {
        return 'bg-red-100 text-red-800';
    }
    if (sanctionText.includes('avertissement')) {
        return 'bg-orange-100 text-orange-800';
    }
    if (sanctionText.includes('mise en garde')) {
        return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
}


// --- UTILITY FUNCTIONS ---
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};


const getAcademicYearMonths = (year: string) => {
    // FIX: Ensure 'year' is a string before calling `.includes()` on it. This prevents runtime
    // errors if invalid data (e.g., a number) is loaded from localStorage.
    if (typeof year !== 'string' || !year.includes('-')) {
        return [];
    }
    const [startYear] = year.split('-').map(Number);
    const months = [];
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    for (let i = 8; i < 12; i++) { // Sept to Dec
        months.push({ name: `${monthNames[i]} ${startYear}`, value: `${startYear}-${String(i + 1).padStart(2, '0')}` });
    }
    for (let i = 0; i < 7; i++) { // Jan to July
        months.push({ name: `${monthNames[i]} ${startYear + 1}`, value: `${startYear + 1}-${String(i + 1).padStart(2, '0')}` });
    }
    return months;
};

const getWeeksForMonth = (month: string) => { // month is YYYY-MM
    const weeks: Date[] = [];
    if (!month) return weeks;
    const [year, monthIndex] = month.split('-').map(Number);
    const firstDayOfMonth = new Date(year, monthIndex - 1, 1);
    
    let current = new Date(firstDayOfMonth);
    current.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1));

    while (current.getMonth() <= monthIndex - 1 || new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() <= monthIndex -1) {
         if ((current.getMonth() === monthIndex - 1 && current.getFullYear() === year) || (weeks.length > 0 && current.getFullYear() <= year)) {
            weeks.push(new Date(current));
        }
        current.setDate(current.getDate() + 7);
        if (current.getFullYear() > year && current.getMonth() > 0) break;
    }
    return weeks.filter(d => d.getFullYear() >= year-1 && d.getFullYear() <= year+1);
};

const calculateAge = (birthDateString: string): number => {
    if (!birthDateString || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateString)) return 0;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : 0;
};

const parseDateDDMMYYYY = (dateString: string): string => {
    const parts = String(dateString).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!parts) return ''; // return invalid format
    const [, day, month, year] = parts;
    return `${year}-${month}-${day}`;
};

const convertExcelDate = (excelDate: number) => {
    if (typeof excelDate !== 'number' || excelDate <= 0) return '';
    // Excel's epoch is 1899-12-30 (day 0), not 1900-01-01.
    // It also incorrectly treats 1900 as a leap year.
    // The offset 25569 correctly converts for dates after 1900-02-28.
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
};


// --- UI STYLES ---
const inputStyle = "w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 transition";

// --- CONFIRMATION MODAL COMPONENT ---
// FIX: Refactored to use a type alias for props to improve clarity and resolve potential type inference issues with the 'children' prop.
type ConfirmationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    // FIX: Made the 'children' prop optional to resolve a TypeScript error on line 527.
    // The compiler was incorrectly reporting it as missing, even though it was provided via JSX.
    children?: React.ReactNode;
};
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }: ConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <div className="mt-2 text-sm text-gray-600">
                    {children}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- EXPORT HEADER COMPONENT ---
const ExportHeader = ({ establishmentInfo, trainingYear, title, subtitle }: {
  establishmentInfo: { name: string, logo: string | null },
  trainingYear: string,
  title: string,
  subtitle?: string
}) => (
  <header className="mb-6 pb-4 border-b-2 border-gray-300">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        {establishmentInfo.logo && <img src={establishmentInfo.logo} alt="Logo" className="h-16 w-auto max-w-[150px] object-contain" />}
        <div>
          <h1 className="text-xl font-bold text-gray-800">{establishmentInfo.name}</h1>
          <p className="text-sm text-gray-500">Année de Formation: <span className="font-semibold">{trainingYear}</span></p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-lg font-semibold text-blue-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
  </header>
);

// --- MAIN APP COMPONENT ---
function App() {
    // --- REAL-TIME & LOCAL STORAGE SETUP ---
    const CLIENT_ID = React.useRef(Math.random().toString(36).substring(2, 15));
    const channel = React.useMemo(() => supabase.channel('app-data-sync'), []);
    const isUpdatingFromBroadcast = React.useRef(false);
    
    const useStateWithLocalStorage = (storageKey: string, defaultValue: any) => {
        const [value, setValue] = React.useState(() => {
            try {
                const item = window.localStorage.getItem(storageKey);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error(`Error reading localStorage key “${storageKey}”:`, error);
                return defaultValue;
            }
        });

        React.useEffect(() => {
            try {
                const serializedValue = JSON.stringify(value);
                window.localStorage.setItem(storageKey, serializedValue);
                // Broadcast change to other clients if not from a broadcast
                if (!isUpdatingFromBroadcast.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'state-update',
                        payload: { key: storageKey, value: serializedValue, clientId: CLIENT_ID.current }
                    });
                }
            } catch (error) {
                console.error(`Error setting localStorage key “${storageKey}”:`, error);
            }
        }, [storageKey, value]);

        return [value, setValue];
    };

  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useStateWithLocalStorage('app_users', []);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  const [allData, setAllData] = useStateWithLocalStorage('app_all_data', {
    levels: initialLevels,
    filieres: initialFilieres,
    groups: initialGroups,
    trainees: initialTrainees,
  });

  const [archivedData, setArchivedData] = useStateWithLocalStorage('app_archived_data', {});
  const [currentTrainingYear, setCurrentTrainingYear] = useStateWithLocalStorage('app_current_training_year', () => {
    const allYearsInGroups = allData.groups.map((g: Group) => g.trainingYear);
    return allYearsInGroups.length > 0 ? allYearsInGroups.sort().reverse()[0] : '2023-2024';
  });

  // --- ESTABLISHMENT INFO (DERIVED FROM SUPER ADMIN) ---
  const establishmentInfo = React.useMemo(() => {
    const superAdmin = users.find((u: User) => u.role === 'superAdmin');
    if (superAdmin) {
        return superAdmin.establishmentInfo || { name: 'Mon Établissement de Formation', logo: null };
    }
    return { name: 'Mon Établissement de Formation', logo: null };
  }, [users]);
  
  const setEstablishmentInfo = (newInfo: { name: string; logo: string | null } | ((prev: { name: string; logo: string | null }) => { name: string; logo: string | null })) => {
      setUsers((prevUsers: User[]) => {
          return prevUsers.map(u => {
              if (u.role === 'superAdmin') {
                  const oldInfo = u.establishmentInfo || { name: 'Mon Établissement de Formation', logo: null };
                  const resolvedNewInfo = typeof newInfo === 'function' ? newInfo(oldInfo) : newInfo;
                  return { ...u, establishmentInfo: resolvedNewInfo };
              }
              return u;
          });
      });
  };

  
  // --- DEMO USER & LOCAL LOGIN ---
  React.useEffect(() => {
    // Ensure the demo user always exists and has establishment info
    setUsers((currentUsers: User[]) => {
        if (!Array.isArray(currentUsers)) currentUsers = [];
        let demoUser = currentUsers.find(u => u.email === DEMO_USER.email);
        if (demoUser) {
             if (!demoUser.establishmentInfo) {
                return currentUsers.map(u => u.email === DEMO_USER.email ? { ...u, establishmentInfo: DEMO_USER.establishmentInfo } : u);
             }
             return currentUsers;
        } else {
            return [...currentUsers, DEMO_USER];
        }
    });
  }, []);

  const handleLogin = (email: string, password?: string): string | null => {
    const user = users.find((u: User) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return null;
    }
    return "Email ou mot de passe incorrect.";
  };
  
  // --- AUTH & REAL-TIME SYNC EFFECTS ---
  React.useEffect(() => {
    // Supabase Realtime Subscription
    const subscription = channel
        .on('broadcast', { event: 'state-update' }, ({ payload }) => {
            if (payload.clientId === CLIENT_ID.current) return;

            const { key, value } = payload;
            if (window.localStorage.getItem(key) !== value) {
                isUpdatingFromBroadcast.current = true;
                window.localStorage.setItem(key, value);
                try {
                    const parsedValue = JSON.parse(value);
                    switch(key) {
                        case 'app_users': setUsers(parsedValue); break;
                        case 'app_all_data': setAllData(parsedValue); break;
                        case 'app_archived_data': setArchivedData(parsedValue); break;
                        case 'app_current_training_year': setCurrentTrainingYear(parsedValue); break;
                    }
                } catch (e) { console.error('Error parsing broadcast data', e); }
                setTimeout(() => { isUpdatingFromBroadcast.current = false; }, 50);
            }
        })
        .subscribe();
    
    // Supabase Auth Subscription
    setLoadingAuth(true);
    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const supabaseUser = session.user;
        const existingUser = users.find((u: User) => u.email === supabaseUser.email);
        
        if (existingUser) {
          setCurrentUser(existingUser);
        } else {
          const superAdminExists = users.some((u: User) => u.role === 'superAdmin');
          if (!superAdminExists) {
            const newSuperAdmin: User = {
              email: supabaseUser.email!,
              name: supabaseUser.user_metadata.full_name || supabaseUser.email!.split('@')[0],
              role: 'superAdmin',
              picture: supabaseUser.user_metadata.picture,
              establishmentInfo: { name: 'Mon Établissement de Formation', logo: null }
            };
            setUsers((prev: User[]) => [...prev, newSuperAdmin]);
            setCurrentUser(newSuperAdmin);
            setActiveTab('donnees');
          } else {
            signOut().then(() => {
              alert("Accès non autorisé. Votre compte n'est pas enregistré. Veuillez contacter l'administrateur.");
              setCurrentUser(null);
            });
          }
        }
      } else {
        if (!currentUser || currentUser?.password === undefined) {
             setCurrentUser(null);
        }
      }
      setLoadingAuth(false);
    });

    return () => {
        supabase.removeChannel(channel);
        authSubscription.data.subscription.unsubscribe();
    };
  }, [users, setUsers, channel]);
  
  // --- MEMOIZED DERIVED STATE ---
  const trainingYears = React.useMemo(() => {
    const years = new Set([currentTrainingYear, ...Object.keys(archivedData)]);
    allData.groups.forEach((group: Group) => years.add(group.trainingYear));
    const validYears = Array.from(years).filter(y => typeof y === 'string');
    return validYears.sort((a, b) => b.localeCompare(a));
  }, [currentTrainingYear, archivedData, allData.groups]);

  const currentYearData = React.useMemo(() => {
    const currentGroups = allData.groups.filter((g: Group) => g.trainingYear === currentTrainingYear);
    const currentGroupIds = new Set(currentGroups.map(g => g.id));
    return {
      levels: allData.levels,
      filieres: allData.filieres,
      groups: currentGroups,
      trainees: allData.trainees.filter((t: Trainee) => currentGroupIds.has(t.groupId)),
    };
  }, [allData, currentTrainingYear]);
    
  const allYearsData = React.useMemo(() => ({...archivedData, [currentTrainingYear]: currentYearData}), [archivedData, currentTrainingYear, currentYearData]);

  // --- "SAME-BROWSER" SYNC EFFECT ---
  React.useEffect(() => {
    const syncState = (e: StorageEvent) => {
      if (!e.key || !e.newValue || isUpdatingFromBroadcast.current) return;
      try {
        const newValue = JSON.parse(e.newValue);
        switch (e.key) {
          case 'app_users': setUsers(newValue); break;
          case 'app_all_data': setAllData(newValue); break;
          case 'app_archived_data': setArchivedData(newValue); break;
          case 'app_current_training_year': setCurrentTrainingYear(newValue); break;
        }
      } catch (error) {
        console.error("Failed to parse storage update:", error);
      }
    };

    window.addEventListener('storage', syncState);
    return () => window.removeEventListener('storage', syncState);
  }, []);

  // --- HANDLERS ---
  const handleLogout = async () => {
    if (currentUser?.password) {
        setCurrentUser(null);
    } else {
        await signOut();
        setCurrentUser(null);
    }
  };

  // --- RENDER LOGIC ---
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Vérification de la session...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        establishmentInfo={establishmentInfo}
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {activeTab === 'dashboard' && <DashboardView allYearsData={allYearsData} />}
        {activeTab === 'saisie' && <AbsenceSaisieView data={currentYearData} setAllData={setAllData} availableYears={trainingYears} currentYear={currentTrainingYear} setCurrentYear={setCurrentTrainingYear} />}
        {activeTab === 'assiduite' && <AssiduiteView allYearsData={allYearsData} />}
        {activeTab === 'comportement' && <ComportementView allYearsData={allYearsData} setAllData={setAllData} setArchivedData={setArchivedData} currentTrainingYear={currentTrainingYear} />}
        {activeTab === 'donnees_personnelles' && <DonneesPersonnellesView allYearsData={allYearsData} establishmentInfo={establishmentInfo} />}
        {activeTab === 'historique' && <HistoryView allYearsData={allYearsData} establishmentInfo={establishmentInfo} setAllData={setAllData} setArchivedData={setArchivedData} setCurrentTrainingYear={setCurrentTrainingYear} currentTrainingYear={currentTrainingYear} />}
        {activeTab === 'donnees' && <DataView allData={allData} setAllData={setAllData} trainingYears={trainingYears} archived={archivedData} setArchived={setArchivedData} currentYear={currentTrainingYear} setCurrentTrainingYear={setCurrentTrainingYear} establishmentInfo={establishmentInfo} setEstablishmentInfo={setEstablishmentInfo} currentUser={currentUser} users={users} setUsers={setUsers} />}
        {activeTab === 'admin' && currentUser.role === 'superAdmin' && <AdminView users={users} setUsers={setUsers} />}
      </main>
    </div>
  );
}

// --- HEADER & NAVIGATION ---
const Header = ({ activeTab, setActiveTab, establishmentInfo, user, onLogout }: {
    activeTab: string; 
    setActiveTab: (tab: string) => void;
    establishmentInfo: { name: string, logo: string | null };
    user: { name: string; email: string; picture?: string, role: string };
    onLogout: () => void;
}) => {
  const allTabs = [
    { id: 'dashboard', label: 'Tableau de Bord' },
    { id: 'saisie', label: 'Saisie' },
    { id: 'assiduite', label: 'Assiduité' },
    { id: 'comportement', label: 'Comportement'},
    { id: 'donnees_personnelles', label: 'Données Personnelles' },
    { id: 'historique', label: 'Historique' },
    { id: 'donnees', label: 'Paramètres' },
    { id: 'admin', label: 'Admin', role: 'superAdmin' },
  ];

  const visibleTabs = allTabs.filter(tab => !tab.role || tab.role === user.role);

  return (
    <header className="bg-blue-800 text-white shadow-md sticky top-0 z-30 print:hidden">
       <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Absences</h1>
            <div className="flex items-center gap-2 mt-1">
                {establishmentInfo.logo && <img src={establishmentInfo.logo} alt="Logo de l'établissement" className="h-8 w-auto rounded" />}
                <h2 className="text-base sm:text-lg font-semibold text-blue-200">{establishmentInfo.name}</h2>
            </div>
        </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs text-blue-300">{user.email}</div>
            </div>
             {user.picture ? (
                <img src={user.picture} alt="User" className="h-10 w-10 rounded-full" />
            ) : (
                <UserCircleIcon className="h-10 w-10 text-blue-300"/>
            )}
            <button onClick={onLogout} title="Déconnexion" className="p-2 rounded-full hover:bg-blue-700 transition-colors">
                <LogoutIcon/>
            </button>
        </div>
      </div>
      <nav className="bg-blue-700">
        <div className="px-4 sm:px-6 lg:px-8">
           <div className="flex space-x-2 sm:space-x-4 whitespace-nowrap overflow-x-auto no-scrollbar">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm sm:text-base font-medium rounded-md transition-colors duration-200 shrink-0 ${
                  activeTab === tab.id ? 'bg-blue-900' : 'hover:bg-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

// --- SAISIE VIEW ---
const AbsenceSaisieView = ({ data, setAllData, availableYears, currentYear, setCurrentYear }: {data: TrainingData, setAllData: React.Dispatch<React.SetStateAction<TrainingData>>, availableYears: string[], currentYear: string, setCurrentYear: (year: string) => void}) => {
    const [saisieFilters, setSaisieFilters] = React.useState({ groupId: '', month: '', week: ''});
    const [saveStatus, setSaveStatus] = React.useState('');
    const { groupId: selectedGroupId, month: selectedMonth, week: selectedWeek } = saisieFilters;

    const [isDropoutModalOpen, setIsDropoutModalOpen] = React.useState(false);
    const [dropoutCandidate, setDropoutCandidate] = React.useState<{traineeId: string; date: string; sessionId: string;} | null>(null);

    const academicMonths = React.useMemo(() => getAcademicYearMonths(currentYear), [currentYear]);
    const weeks = React.useMemo(() => getWeeksForMonth(selectedMonth), [selectedMonth]);
    const sortedGroups = React.useMemo(() => [...data.groups].sort((a, b) => a.name.localeCompare(b.name)), [data.groups]);
    
    // Initialize filters on first load or when data/year changes
    React.useEffect(() => {
        let needsUpdate = false;
        const newFilters = { ...saisieFilters };

        const groupExistsInYear = sortedGroups.some(g => g.id === newFilters.groupId);

        if (sortedGroups.length > 0 && (!newFilters.groupId || !groupExistsInYear)) {
            newFilters.groupId = sortedGroups[0].id;
            needsUpdate = true;
        } 
        else if (sortedGroups.length === 0 && newFilters.groupId) {
            newFilters.groupId = '';
            needsUpdate = true;
        }

        const today = new Date();
        const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const monthExists = academicMonths.some(m => m.value === currentMonthValue);
        
        if (!newFilters.month) {
            newFilters.month = monthExists ? currentMonthValue : (academicMonths[0]?.value || '');
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            setSaisieFilters(newFilters);
        }

    }, [data.groups, currentYear]);
    
     React.useEffect(() => {
        if (selectedMonth) {
            const newWeeks = getWeeksForMonth(selectedMonth);
            if (newWeeks.length > 0) {
                 const currentWeekStart = getWeekStartDate(new Date()).toISOString();
                 const weekExists = newWeeks.some(w => w.toISOString() === selectedWeek);
                 const currentWeekExists = newWeeks.some(w => w.toISOString() === currentWeekStart);

                 if (!weekExists || !selectedWeek) {
                     const weekToSet = currentWeekExists ? currentWeekStart : newWeeks[0].toISOString();
                     setSaisieFilters(prev => ({...prev, week: weekToSet}));
                 }
            } else {
                 setSaisieFilters(prev => ({...prev, week: ''}));
            }
        }
    }, [selectedMonth]);
    
    React.useEffect(() => {
        const currentWeeks = getWeeksForMonth(selectedMonth);
        const weekIsValid = currentWeeks.some(w => w.toISOString() === selectedWeek);

        if (selectedMonth && !weekIsValid && currentWeeks.length > 0) {
            setSaisieFilters(prev => ({ ...prev, week: currentWeeks[0].toISOString() }));
        } else if (currentWeeks.length === 0) {
            setSaisieFilters(prev => ({...prev, week: ''}));
        }

    }, [selectedGroupId, selectedMonth, selectedWeek]);


    const handleCancelDropout = () => {
        if (!dropoutCandidate) return;

        setAllData(prevData => {
            const { traineeId, date, sessionId } = dropoutCandidate;
            const newTrainees = [...prevData.trainees];
            const traineeIndex = newTrainees.findIndex(t => t.id === traineeId);
            if (traineeIndex === -1) return prevData;

            const trainee = { ...newTrainees[traineeIndex] };
            const newAbsences = JSON.parse(JSON.stringify(trainee.absences));

            if (newAbsences[date]?.[sessionId]) {
                delete newAbsences[date][sessionId];
                if (Object.keys(newAbsences[date]).length === 0) {
                    delete newAbsences[date];
                }
                trainee.absences = newAbsences;
                newTrainees[traineeIndex] = trainee;
                return { ...prevData, trainees: newTrainees };
            }
            
            return prevData;
        });

        setIsDropoutModalOpen(false);
        setDropoutCandidate(null);
    };

    const handleConfirmDropout = () => {
        if (!dropoutCandidate) return;

        const { traineeId, date } = dropoutCandidate;

        setAllData(prevData => {
            const newTrainees = [...prevData.trainees];
            const traineeIndex = newTrainees.findIndex(t => t.id === traineeId);
            if (traineeIndex === -1) return prevData;

            let trainee = { ...newTrainees[traineeIndex] };
            
            trainee.dropoutDate = date;
            const yearEndStr = currentYear.split('-')[1];
            const yearEnd = new Date(parseInt(yearEndStr), 6, 31); // July 31st
            let currentDate = new Date(date);

            while(currentDate <= yearEnd) {
                const currentDateStr = formatDate(currentDate);
                if (!trainee.absences[currentDateStr]) trainee.absences[currentDateStr] = {};
                SESSIONS.forEach(session => {
                    trainee.absences[currentDateStr][session.id] = 'D';
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }

            newTrainees[traineeIndex] = trainee;
            return { ...prevData, trainees: newTrainees };
        });

        setIsDropoutModalOpen(false);
        setDropoutCandidate(null);
    };

    const handleAbsenceClick = (traineeId: string, date: string, sessionId: string) => {
        setAllData(prevData => {
            const newTrainees = [...prevData.trainees];
            const traineeIndex = newTrainees.findIndex(t => t.id === traineeId);
            if (traineeIndex === -1) return prevData;

            let trainee = { ...newTrainees[traineeIndex] };

            if (trainee.dropoutDate) return prevData; // Cannot change absences for a dropout

            const newAbsences = { ...trainee.absences };
            if (!newAbsences[date]) newAbsences[date] = {};
            const currentStatus = newAbsences[date][sessionId];
            
            const currentIndex = currentStatus ? ABSENCE_TYPES.indexOf(currentStatus) : -1;
            const nextIndex = (currentIndex + 1) % (ABSENCE_TYPES.length + 1);
            let nextStatus: AbsenceType | undefined = undefined;
            if (nextIndex < ABSENCE_TYPES.length) {
                nextStatus = ABSENCE_TYPES[nextIndex];
            }

            if (nextStatus === 'D') {
                setDropoutCandidate({ traineeId, date, sessionId });
                setIsDropoutModalOpen(true);
                return prevData; // Don't apply change immediately, wait for modal confirmation
            }

            if(nextStatus) {
                newAbsences[date][sessionId] = nextStatus;
            } else {
                delete newAbsences[date][sessionId];
                if (Object.keys(newAbsences[date]).length === 0) delete newAbsences[date];
            }
            
            trainee.absences = newAbsences;

            newTrainees[traineeIndex] = trainee;
            return { ...prevData, trainees: newTrainees };
        });
    };
    
    const filteredTrainees = React.useMemo(() => 
        selectedGroupId ? [...data.trainees]
            .filter(t => t.groupId === selectedGroupId)
            .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)) : [],
        [data.trainees, selectedGroupId]
    );

    const weekDates = React.useMemo(() => {
        if (!selectedWeek) return [];
        const start = new Date(selectedWeek);
        return Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    }, [selectedWeek]);

    const getAbsenceStyle = (status?: AbsenceType, isDisabled = false) => {
        if (isDisabled) return 'bg-gray-400 text-white cursor-not-allowed';
        switch(status) {
            case 'A': return 'bg-red-500 hover:bg-red-600 text-white';
            case 'AJ': return 'bg-orange-400 hover:bg-orange-500 text-white';
            case 'R': return 'bg-black hover:bg-gray-800 text-white';
            case 'Aut': return 'bg-blue-500 hover:bg-blue-600 text-white';
            case 'D': return 'bg-gray-700 hover:bg-gray-800 text-white';
            default: return 'bg-gray-200 hover:bg-gray-300';
        }
    };
    
    const handleSave = () => {
        setSaveStatus('Données sauvegardées avec succès !');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const dropoutCandidateTrainee = React.useMemo(() => {
        return dropoutCandidate ? data.trainees.find(t => t.id === dropoutCandidate.traineeId) : null;
    }, [dropoutCandidate, data.trainees]);
    

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
            <ConfirmationModal
                isOpen={isDropoutModalOpen}
                onClose={handleCancelDropout}
                onConfirm={handleConfirmDropout}
                title="Confirmation de Déperdition"
            >
                <p>
                    Êtes-vous sûr de vouloir marquer le stagiaire <span className="font-bold">{dropoutCandidateTrainee?.lastName.toUpperCase()} {dropoutCandidateTrainee?.firstName}</span> comme déperdu ?
                </p>
                <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
                    Cette action est irréversible et remplira toutes ses futures absences avec "D".
                </p>
            </ConfirmationModal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="training-year" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation</label>
                    <select id="training-year" value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} className={inputStyle}>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                    <select id="group" value={selectedGroupId} onChange={e => setSaisieFilters(prev => ({...prev, groupId: e.target.value}))} className={inputStyle} disabled={!data.groups.length}>
                        {sortedGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                    <select id="month" value={selectedMonth} onChange={e => setSaisieFilters(prev => ({...prev, month: e.target.value, week: ''}))} className={inputStyle}>
                        {academicMonths.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-1">Semaine</label>
                     <select id="week" value={selectedWeek} onChange={e => setSaisieFilters(prev => ({...prev, week: e.target.value}))} className={inputStyle} disabled={!weeks.length}>
                       {weeks.map(weekStart => (
                           <option key={weekStart.toISOString()} value={weekStart.toISOString()}>
                               Du {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au {new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                           </option>
                       ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto relative rounded-lg shadow-sm border">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="py-3 px-2 border-b-2 border-gray-200 sticky left-0 bg-gray-100 z-20">Stagiaire</th>
                            {weekDates.map((date, index) => (
                                <th key={index} scope="col" colSpan={SESSIONS.length} className="py-3 px-2 sm:px-6 border-b-2 border-l border-gray-200 text-center">
                                    {DAYS[index]} <br/> {date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th scope="col" className="py-2 px-2 border-b-2 border-gray-200 sticky left-0 bg-gray-100 z-20"></th>
                            {weekDates.map((_, dayIndex) => 
                                SESSIONS.map((session, sessionIndex) => (
                                    <th key={`${dayIndex}-${sessionIndex}`} scope="col" className="py-2 px-2 text-center border-b-2 border-l border-gray-200 text-xs font-medium">
                                        {session.id}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrainees.length > 0 ? filteredTrainees.map(trainee => {
                            const isDropout = !!trainee.dropoutDate;
                            return (
                                <tr key={trainee.id} className={`bg-white border-b ${isDropout ? 'bg-gray-100' : 'hover:bg-gray-50'} group`}>
                                    <td className={`py-2 px-2 font-medium text-gray-900 whitespace-nowrap sticky left-0 z-10 ${isDropout ? 'bg-gray-100' : 'bg-white group-hover:bg-gray-50'}`}>
                                        {trainee.lastName.toUpperCase()} {trainee.firstName}
                                    </td>
                                    {weekDates.map((date, dayIndex) => {
                                        const dateString = formatDate(date);
                                        return SESSIONS.map((session, sessionIndex) => {
                                            const statusToShow = isDropout && dateString >= trainee.dropoutDate! 
                                                ? 'D' 
                                                : trainee.absences[dateString]?.[session.id];
                                                                                        
                                            return (
                                                <td key={`${dateString}-${session.id}`} className="p-1 border-l border-gray-200 text-center">
                                                    <button onClick={() => handleAbsenceClick(trainee.id, dateString, session.id)} 
                                                            disabled={isDropout}
                                                            className={`w-8 h-8 mx-auto flex items-center justify-center font-bold text-xs transition-all duration-150 rounded-md shadow-sm ${getAbsenceStyle(statusToShow, isDropout)}`}>
                                                        {statusToShow || ''}
                                                    </button>
                                                </td>
                                            );
                                        });
                                    })}
                                </tr>
                            )
                        }) : (
                           <tr>
                                <td colSpan={1 + 6 * SESSIONS.length} className="text-center py-10 text-gray-500">
                                    Aucun stagiaire trouvé pour ce groupe. Veuillez sélectionner un groupe ou en créer un dans l'onglet 'Données'.
                                </td>
                           </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="flex items-center justify-end gap-4 mt-4">
                {saveStatus && <span className="text-green-600 font-medium animate-pulse">{saveStatus}</span>}
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105">
                    Sauvegarder la semaine
                </button>
            </div>
        </div>
    );
};

// --- DASHBOARD VIEW ---
const DashboardView = ({ allYearsData }: { allYearsData: ArchivedData & { [key: string]: TrainingData } }) => {
    const allYears = React.useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    const [selectedYear, setSelectedYear] = React.useState(allYears[0] || '');
    
    const yearData = React.useMemo(() => allYearsData[selectedYear], [allYearsData, selectedYear]);
    const academicMonths = React.useMemo(() => getAcademicYearMonths(selectedYear), [selectedYear]);

    const [selectedGroupId, setSelectedGroupId] = React.useState<string>('');
    const [selectedMonth, setSelectedMonth] = React.useState<string>('');
    const [selectedTraineeId, setSelectedTraineeId] = React.useState<string>('');

    const groupOptions = React.useMemo(() => yearData?.groups.map(g => ({id: g.id, name: g.name})).sort((a,b) => a.name.localeCompare(b.name)) || [], [yearData]);
    const monthOptions = React.useMemo(() => academicMonths.map(m => ({id: m.value, name: m.name})) || [], [academicMonths]);
    
    const traineesForSelectedGroups = React.useMemo(() => {
        if (!yearData) return [];
        if (!selectedGroupId) return yearData.trainees;
        return yearData.trainees.filter(t => t.groupId === selectedGroupId);
    }, [yearData, selectedGroupId]);

    const traineeOptions = React.useMemo(() => {
        return traineesForSelectedGroups
            .map(t => ({ id: t.id, name: `${t.lastName.toUpperCase()} ${t.firstName}` }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [traineesForSelectedGroups]);
    
    const filteredTrainees = React.useMemo(() => {
        if (!selectedTraineeId) return traineesForSelectedGroups;
        return traineesForSelectedGroups.filter(t => t.id === selectedTraineeId);
    }, [traineesForSelectedGroups, selectedTraineeId]);
    
    const dropoutTrainees = React.useMemo(() => filteredTrainees.filter(t => t.dropoutDate), [filteredTrainees]);

    const selectedTrainee = React.useMemo(() => {
        return (selectedTraineeId && filteredTrainees.length === 1) ? filteredTrainees[0] : null;
    }, [selectedTraineeId, filteredTrainees]);
    
    const dropoutMessage = React.useMemo(() => {
        return selectedTrainee?.dropoutDate 
            ? `Stagiaire en déperdition depuis le ${new Date(selectedTrainee.dropoutDate).toLocaleDateString('fr-FR')}`
            : undefined;
    }, [selectedTrainee]);


    const traineeStats = React.useMemo(() => {
        return filteredTrainees.map(trainee => {
            let totalHours = 0;
            for (const date in trainee.absences) {
                // For stats, we ignore absences after dropout date
                if(trainee.dropoutDate && date >= trainee.dropoutDate) continue;

                if (!selectedMonth || date.substring(0, 7) === selectedMonth) {
                    for (const sessionId in trainee.absences[date]) {
                        const type = trainee.absences[date][sessionId] as AbsenceType;
                        if (type === 'A' || type === 'AJ' || type === 'Aut') totalHours += SESSION_DURATION;
                        else if (type === 'R') totalHours += RETARD_VALUE;
                    }
                }
            }
            const sanctionInfo = calculateTraineeAbsenceStats(trainee, selectedMonth);
            return { 
                id: trainee.id, 
                // FIX: Corrected a typo from 't.firstName' to 'trainee.firstName' to resolve a reference error.
                name: `${trainee.lastName.toUpperCase()} ${trainee.firstName}`, 
                hours: totalHours,
                sanction: sanctionInfo.sanction
            };
        }).sort((a, b) => b.hours - a.hours);
    }, [filteredTrainees, selectedMonth]);

    const excludedTrainees = React.useMemo(() => 
        traineeStats.filter(t => t.sanction?.sanction === 'Exclusion définitive'), 
        [traineeStats]
    );

    const alertedTrainees = React.useMemo(() => 
        traineeStats.filter(t => t.sanction && t.sanction.minEquivalentRetards >= 20 && t.sanction.minEquivalentRetards < 41), 
        [traineeStats]
    );

    const globalStats = React.useMemo(() => {
        const totalAbsenceHours = traineeStats.reduce((sum, trainee) => sum + trainee.hours, 0);
        const absenceTypeCounts: { [key in AbsenceType]: number } = { A: 0, AJ: 0, R: 0, Aut: 0, D: 0 };
        const monthlyAbsenceHours: { [month: string]: number } = {};
        academicMonths.forEach(m => { monthlyAbsenceHours[m.value] = 0; });

        filteredTrainees.forEach(trainee => {
            for (const date in trainee.absences) {
                if(trainee.dropoutDate && date >= trainee.dropoutDate) continue;
                const month = date.substring(0, 7);
                if (!selectedMonth || month === selectedMonth) {
                    for (const sessionId in trainee.absences[date]) {
                        const type = trainee.absences[date][sessionId];
                        if (absenceTypeCounts[type] !== undefined) absenceTypeCounts[type]++;
                        if(monthlyAbsenceHours[month] !== undefined) {
                            if (type === 'A' || type === 'AJ' || type === 'Aut') monthlyAbsenceHours[month] += SESSION_DURATION;
                            else if (type === 'R') monthlyAbsenceHours[month] += RETARD_VALUE;
                        }
                    }
                }
            }
        });
        
        const totalExpectedHours = filteredTrainees.reduce((acc, trainee) => {
            const group = yearData.groups.find(g => g.id === trainee.groupId);
            return acc + (group ? group.annualHours : 0);
        }, 0);
        
        const absenteeismRate = totalExpectedHours > 0 ? (totalAbsenceHours / totalExpectedHours) * 100 : 0;
        
        const dropoutCount = dropoutTrainees.length;
        const totalTrainees = filteredTrainees.length;
        const dropoutRate = totalTrainees > 0 ? (dropoutCount / totalTrainees) * 100 : 0;


        return { totalAbsenceHours, absenceTypeCounts, monthlyAbsenceHours, absenteeismRate, totalExpectedHours, dropoutCount, dropoutRate };
    }, [filteredTrainees, dropoutTrainees, selectedMonth, academicMonths, traineeStats, yearData]);

    const BarChartAbsenceType = ({ data }: { data: { [key in AbsenceType]: number } }) => {
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        if (total === 0) return <div className="flex items-center justify-center h-full text-gray-500">Aucune donnée</div>;
    
        const maxVal = Math.max(...Object.values(data), 1);
        const types: { key: AbsenceType; label: string; color: string }[] = [
            { key: 'A', label: 'Absence', color: 'bg-red-500' },
            { key: 'AJ', label: 'Justifiée', color: 'bg-orange-500' },
            { key: 'R', label: 'Retard', color: 'bg-black' },
            { key: 'Aut', label: 'Autorisé', color: 'bg-blue-500' },
        ];
    
        return (
            <div className="w-full h-full flex items-end justify-around gap-4 px-4 pt-8">
                {types.map(type => {
                    const value = data[type.key];
                    const heightPercentage = maxVal > 0 ? (value / maxVal) * 90 : 0;
                    return (
                        <div key={type.key} className="relative flex flex-col items-center h-full flex-1">
                            <div className="relative flex-grow w-full flex items-end justify-center">
                                 <div 
                                    className={`w-3/4 rounded-t-md ${type.color} transition-all duration-500 relative`} 
                                    style={{ height: `${heightPercentage}%` }}
                                    title={`${type.label}: ${value}`}
                                 >
                                    <span className="absolute bottom-full mb-1 w-full text-center text-sm font-bold text-gray-700">{value}</span>
                                 </div>
                            </div>
                            <div className="text-xs text-center font-medium text-gray-500 mt-2 shrink-0">{type.label}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const MonthlyBarChart = ({ data, academicMonths }: { data: { [month: string]: number }; academicMonths: {name: string, value: string}[] }) => {
        const getMonthBarColor = (hours: number) => {
            if (hours > 10) return 'bg-red-500 hover:bg-red-600';
            if (hours > 5) return 'bg-orange-400 hover:bg-orange-500';
            return 'bg-blue-500 hover:bg-blue-600';
        };

        const chartData = academicMonths.map(month => ({
            name: month.name.split(' ')[0],
            shortName: month.name.split(' ')[0].substring(0, 3),
            hours: data[month.value] || 0,
        }));
    
        const values = chartData.map(d => d.hours);
        const maxVal = Math.max(...values, 5); 
        const hasData = values.some(v => v > 0);
    
        if (!hasData) {
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Aucune donnée d'absence à afficher.
                </div>
            );
        }
    
        return (
             <div className="w-full h-full flex flex-col px-2 flex-grow pt-6">
                <div className="flex-grow w-full flex items-end justify-around gap-1 border-b border-gray-200">
                    {chartData.map((point, i) => {
                        const heightPercentage = maxVal > 0 ? (point.hours / maxVal) * 90 : 0;
                        return (
                            <div key={i} className="group relative flex-grow h-full flex items-end justify-center">
                                <div className="absolute -top-1 text-xs font-bold text-gray-700">{point.hours > 0 ? point.hours.toFixed(1) : ''}</div>
                                <div
                                    className={`w-3/4 ${getMonthBarColor(point.hours)} rounded-t-md transition-all duration-300`}
                                    style={{ height: `${heightPercentage}%` }}
                                    title={`${point.name}: ${point.hours.toFixed(1)}`}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-around mt-1 shrink-0">
                    {chartData.map((d, i) => (
                        <div key={i} className="text-xs text-gray-500 text-center flex-1" title={d.name}>{d.shortName}</div>
                    ))}
                </div>
            </div>
        );
    };


    if (!yearData) {
        return <div className="bg-white p-6 rounded-lg shadow-lg text-center"><p className="text-gray-600">Aucune donnée disponible.</p></div>;
    }
    
    const DropoutMessageDisplay = ({ message }: { message: string }) => (
        <div className="flex items-center justify-center h-full">
            <p className="text-center p-4 text-red-600 font-bold animate-pulse">{message}</p>
        </div>
    );
    
    const ChartDropoutOverlay = ({ message }: { message: string }) => (
         <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <p className="text-red-600 font-bold text-lg text-center animate-pulse p-4">{message}</p>
         </div>
    );


    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Filtres du Tableau de Bord</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={inputStyle}>
                            {allYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select value={selectedGroupId} onChange={e => {
                            setSelectedGroupId(e.target.value);
                            setSelectedTraineeId(''); // Reset trainee filter when group changes
                        }} className={inputStyle}>
                            <option value="">Tous les groupes</option>
                            {groupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={inputStyle}>
                            <option value="">Tous les mois</option>
                            {monthOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
                        <select value={selectedTraineeId} onChange={e => setSelectedTraineeId(e.target.value)} className={inputStyle}>
                            <option value="">Tous les stagiaires</option>
                            {traineeOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<UsersIcon />} title="Effectif Total" value={`${filteredTrainees.length}`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<CalendarIcon />} title="Masse Horaire Prévue" value={`${globalStats.totalExpectedHours.toFixed(0)}`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<ClockIcon />} title="Total Heures d'Absence" value={`${globalStats.totalAbsenceHours.toFixed(2)}`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<PercentageIcon />} title="Taux d'Absentéisme" value={`${globalStats.absenteeismRate.toFixed(2)}%`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<AlertIcon />} title="Stagiaires en Alerte" value={`${alertedTrainees.length}`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<AlertIcon className="h-8 w-8 text-red-500" />} title="Stagiaires à Exclure" value={`${excludedTrainees.length}`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<UserMinusIcon />} title="Nombre de Déperdus" value={`${globalStats.dropoutCount}`} dropoutMessage={dropoutMessage} />
                <StatCard icon={<UserMinusIcon className="h-8 w-8 text-red-700" />} title="Taux de Déperdition" value={`${globalStats.dropoutRate.toFixed(2)}%`} dropoutMessage={dropoutMessage} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col h-96 relative">
                    {dropoutMessage && <ChartDropoutOverlay message={dropoutMessage} />}
                    <h3 className="text-base font-semibold text-gray-600 mb-2 text-center">Répartition par Type (Actifs)</h3>
                    <div className="flex-grow">
                       <BarChartAbsenceType data={globalStats.absenceTypeCounts} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col h-96 relative">
                    {dropoutMessage && <ChartDropoutOverlay message={dropoutMessage} />}
                    <h3 className="text-base font-semibold text-gray-600 mb-2 text-center">Tendance Mensuelle (heures d'absence) | Total: {globalStats.totalAbsenceHours.toFixed(2)}</h3>
                    <MonthlyBarChart data={globalStats.monthlyAbsenceHours} academicMonths={academicMonths} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertIcon className="h-6 w-6 text-red-500" />
                        <h3 className="text-lg font-semibold text-gray-600">Stagiaires à Exclure</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {dropoutMessage ? <DropoutMessageDisplay message={dropoutMessage} /> : (
                            <ul className="space-y-3">
                            {excludedTrainees.map(trainee => (
                                <li key={trainee.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-red-50">
                                    <span className="truncate pr-2 font-semibold">{trainee.name}</span>
                                    <span className={`font-semibold px-2 py-1 rounded-full text-xs text-center shrink-0 ${getSanctionStyle(trainee.sanction)}`}>
                                        {trainee.sanction?.sanction}
                                    </span>
                                </li>
                            ))}
                            {excludedTrainees.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Aucun stagiaire concerné.</p>}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertIcon className="h-6 w-6 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-gray-600">Stagiaires en Alerte</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {dropoutMessage ? <DropoutMessageDisplay message={dropoutMessage} /> : (
                            <ul className="space-y-3">
                            {alertedTrainees.map(trainee => (
                                <li key={trainee.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                    <span className="truncate pr-2">{trainee.name}</span>
                                    <span className={`font-semibold px-2 py-1 rounded-full text-xs text-center shrink-0 ${getSanctionStyle(trainee.sanction)}`}>
                                        {trainee.sanction?.sanction}
                                    </span>
                                </li>
                            ))}
                            {alertedTrainees.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Aucun stagiaire en alerte.</p>}
                            </ul>
                        )}
                    </div>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <UserGroupIcon />
                        <h3 className="text-lg font-semibold text-gray-600">Top 5 Stagiaires Absents (Actifs)</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {dropoutMessage ? <DropoutMessageDisplay message={dropoutMessage} /> : (
                            <ul className="space-y-3">
                            {traineeStats.filter(t => !dropoutTrainees.some(d => d.id === t.id)).slice(0, 5).map(trainee => (
                                <li key={trainee.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                    <span className="truncate pr-2">{trainee.name}</span>
                                    <span className="font-bold bg-red-100 text-red-800 px-2 py-1 rounded-full shrink-0">{trainee.hours.toFixed(2)}</span>
                                </li>
                            ))}
                            {traineeStats.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Aucun stagiaire à afficher.</p>}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <UserMinusIcon className="h-6 w-6" />
                        <h3 className="text-lg font-semibold text-gray-600">Liste des Déperdus</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                       <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="py-2 px-2 sm:px-4">Stagiaire</th>
                                    <th className="py-2 px-2 sm:px-4">Groupe</th>
                                    <th className="py-2 px-2 sm:px-4">Date de départ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dropoutTrainees.map(trainee => (
                                    <tr key={trainee.id} className="hover:bg-gray-50">
                                        <td className="py-2 px-2 sm:px-4 font-medium">{`${trainee.lastName.toUpperCase()} ${trainee.firstName}`}</td>
                                        <td className="py-2 px-2 sm:px-4">{yearData.groups.find(g => g.id === trainee.groupId)?.name}</td>
                                        <td className="py-2 px-2 sm:px-4">{trainee.dropoutDate ? new Date(trainee.dropoutDate).toLocaleDateString('fr-FR') : 'N/A'}</td>
                                    </tr>
                                ))}
                                {dropoutTrainees.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4 text-gray-500">Aucun stagiaire déperdu.</td>
                                    </tr>
                                )}
                            </tbody>
                       </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value, dropoutMessage }: {icon: React.ReactNode, title: string, value: string, dropoutMessage?: string}) => (
    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
        <div className="bg-gray-100 p-3 rounded-full shrink-0">{icon}</div>
        <div className="flex-1">
            <div className="flex justify-between items-baseline">
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                 {dropoutMessage && <p className="text-xs text-red-600 font-semibold">{dropoutMessage}</p>}
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// --- ASSIDUITE VIEW ---
const AssiduiteView = ({ allYearsData }: { allYearsData: ArchivedData & { [key: string]: TrainingData } }) => {
    const allYears = React.useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    const [selectedYear, setSelectedYear] = React.useState(allYears[0] || '');
    
    const yearData = React.useMemo(() => allYearsData[selectedYear], [allYearsData, selectedYear]);

    const [selectedGroupId, setSelectedGroupId] = React.useState<string>('');
    const [selectedTraineeId, setSelectedTraineeId] = React.useState<string>('');
    const [isBaremeVisible, setIsBaremeVisible] = React.useState(false);
    
    const groupOptions = React.useMemo(() => yearData?.groups.map(g => ({id: g.id, name: g.name})).sort((a,b) => a.name.localeCompare(b.name)) || [], [yearData]);
    
    const traineesForSelectedGroups = React.useMemo(() => {
        if (!yearData) return [];
        if (!selectedGroupId) return yearData.trainees;
        return yearData.trainees.filter(t => t.groupId === selectedGroupId);
    }, [yearData, selectedGroupId]);

    const traineeOptions = React.useMemo(() => {
        return traineesForSelectedGroups
            .map(t => ({ id: t.id, name: `${t.lastName.toUpperCase()} ${t.firstName}` }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [traineesForSelectedGroups]);
    
    const filteredTrainees = React.useMemo(() => {
        if (!selectedTraineeId) return traineesForSelectedGroups;
        return traineesForSelectedGroups.filter(t => t.id === selectedTraineeId);
    }, [traineesForSelectedGroups, selectedTraineeId]);

    const traineesWithSanctions = React.useMemo(() => {
        return filteredTrainees.map(trainee => {
            const stats = calculateTraineeAbsenceStats(trainee, ''); // all months for the year
            const group = yearData.groups.find(g => g.id === trainee.groupId);
            return {
                ...trainee,
                ...stats,
                groupName: group?.name || 'N/A'
            }
        })
        .sort((a, b) => b.retardCount - a.retardCount);
    }, [filteredTrainees, yearData]);
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <SanctionIcon />
                      <h2 className="text-xl font-bold">Barème des Sanctions (Assiduité)</h2>
                    </div>
                    <button onClick={() => setIsBaremeVisible(!isBaremeVisible)} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                        <span>{isBaremeVisible ? 'Cacher' : 'Afficher'} le barème</span>
                        <div className={`transform transition-transform ${isBaremeVisible ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </div>
                    </button>
                </div>
                 {isBaremeVisible && (
                    <div className="overflow-x-auto rounded-lg border animate-fade-in-down">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="py-3 px-2 sm:px-6">Cumul des Retards</th>
                                    <th className="py-3 px-2 sm:px-6">Cumul des Absences</th>
                                    <th className="py-3 px-2 sm:px-6">Points à Déduire</th>
                                    <th className="py-3 px-2 sm:px-6">Sanctions</th>
                                    <th className="py-3 px-2 sm:px-6">Autorité de Décision</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SANCTION_RULES_FOR_DISPLAY.map((rule, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="py-4 px-2 sm:px-6 font-medium">{rule.retards}</td>
                                        <td className="py-4 px-2 sm:px-6">{rule.days}</td>
                                        <td className="py-4 px-2 sm:px-6">{rule.points}</td>
                                        <td className="py-4 px-2 sm:px-6 font-semibold">{rule.sanction}</td>
                                        <td className="py-4 px-2 sm:px-6">{rule.authority}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Suivi de l'Assiduité des Stagiaires</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={inputStyle}>
                            {allYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select value={selectedGroupId} onChange={e => {
                            setSelectedGroupId(e.target.value);
                            setSelectedTraineeId(''); // Reset trainee filter
                        }} className={inputStyle}>
                            <option value="">Tous les groupes</option>
                            {groupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
                        <select value={selectedTraineeId} onChange={e => setSelectedTraineeId(e.target.value)} className={inputStyle}>
                            <option value="">Tous les stagiaires</option>
                            {traineeOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border max-h-[600px]">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="py-3 px-2 sm:px-6">Stagiaire</th>
                                <th className="py-3 px-2 sm:px-6">Groupe</th>
                                <th className="py-3 px-2 sm:px-6 text-center">Retards (nb)</th>
                                <th className="py-3 px-2 sm:px-6 text-center">Absences (jours)</th>
                                <th className="py-3 px-2 sm:px-6">Sanction Appliquée</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {traineesWithSanctions.map(trainee => (
                                <tr key={trainee.id} className={`hover:bg-gray-50 transition-colors ${trainee.dropoutDate ? 'bg-gray-200 opacity-60' : (trainee.sanction ? 'bg-yellow-50/50' : '')}`}>
                                    <td className="py-4 px-2 sm:px-6 font-medium text-gray-900">{trainee.lastName.toUpperCase()} {trainee.firstName}</td>
                                    <td className="py-4 px-2 sm:px-6">{trainee.groupName}</td>
                                    <td className="py-4 px-2 sm:px-6 text-center">{trainee.retardCount}</td>
                                    <td className="py-4 px-2 sm:px-6 text-center">{trainee.totalAbsenceDays.toFixed(1)}</td>
                                    <td className="py-4 px-2 sm:px-6">
                                        {trainee.dropoutDate ? (
                                            <span className="font-semibold px-2 py-1 rounded-full text-xs bg-gray-700 text-white">
                                                Déperdu
                                            </span>
                                        ) : trainee.sanction ? (
                                            <span className={`font-semibold px-2 py-1 rounded-full text-xs ${getSanctionStyle(trainee.sanction)}`}>
                                                {trainee.sanction.sanction}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Aucune</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {traineesWithSanctions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">Aucun stagiaire à afficher avec les filtres actuels.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- BEHAVIOR MODAL ---
const BehaviorModal = ({ isOpen, onClose, onSave, trainee, incident, setIncident }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    trainee: Trainee | null;
    incident: Omit<BehaviorIncident, 'id'>;
    setIncident: React.Dispatch<React.SetStateAction<Omit<BehaviorIncident, 'id'>>>;
}) => {
    if (!isOpen || !trainee) return null;

    const sanctionOptions = BEHAVIOR_SANCTION_RULES_FOR_DISPLAY.map(rule => rule.sanction);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-lg w-full transform transition-all animate-fade-in-down">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter une Indiscipline</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Pour: <span className="font-semibold">{trainee.lastName.toUpperCase()} {trainee.firstName}</span>
                </p>
                <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="incident-date" className="block text-sm font-medium text-gray-700 mb-1">Date de l'incident</label>
                            <input
                                id="incident-date"
                                type="date"
                                value={incident.date}
                                onChange={e => setIncident(prev => ({ ...prev, date: e.target.value }))}
                                className={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="incident-motif" className="block text-sm font-medium text-gray-700 mb-1">Nature de l'indiscipline</label>
                            <input
                                id="incident-motif"
                                type="text"
                                value={incident.motif}
                                onChange={e => setIncident(prev => ({ ...prev, motif: e.target.value }))}
                                placeholder="ex: Usage du téléphone en classe"
                                className={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="incident-sanction" className="block text-sm font-medium text-gray-700 mb-1">Sanction appliquée</label>
                            <select
                                id="incident-sanction"
                                value={incident.sanction}
                                onChange={e => setIncident(prev => ({ ...prev, sanction: e.target.value }))}
                                className={inputStyle}
                                required
                            >
                                {sanctionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold transition-colors">
                            Annuler
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors">
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPORTEMENT VIEW ---
const ComportementView = ({ allYearsData, setAllData, setArchivedData, currentTrainingYear }: { allYearsData: ArchivedData & { [key: string]: TrainingData }, setAllData: React.Dispatch<React.SetStateAction<TrainingData>>, setArchivedData: React.Dispatch<React.SetStateAction<ArchivedData>>, currentTrainingYear: string }) => {
    const allYears = React.useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    const [selectedYear, setSelectedYear] = React.useState(allYears[0] || '');
    
    const yearData = React.useMemo(() => allYearsData[selectedYear], [allYearsData, selectedYear]);

    const [selectedGroupId, setSelectedGroupId] = React.useState<string>('');
    const [selectedTraineeId, setSelectedTraineeId] = React.useState<string>('');
    const [isBaremeVisible, setIsBaremeVisible] = React.useState(false);
    
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [currentTargetTrainee, setCurrentTargetTrainee] = React.useState<Trainee | null>(null);
    const [newIncident, setNewIncident] = React.useState({
        date: formatDate(new Date()),
        motif: '',
        sanction: BEHAVIOR_SANCTION_RULES_FOR_DISPLAY[0].sanction
    });
    
    const [expandedTraineeId, setExpandedTraineeId] = React.useState<string | null>(null);
    const expandedListRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expandedListRef.current && !expandedListRef.current.contains(event.target as Node)) {
                setExpandedTraineeId(null);
            }
        };

        if (expandedTraineeId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expandedTraineeId]);


    const groupOptions = React.useMemo(() => yearData?.groups.map(g => ({id: g.id, name: g.name})).sort((a,b) => a.name.localeCompare(b.name)) || [], [yearData]);
    
    const traineesForSelectedGroups = React.useMemo(() => {
        if (!yearData) return [];
        if (!selectedGroupId) return yearData.trainees;
        return yearData.trainees.filter(t => t.groupId === selectedGroupId);
    }, [yearData, selectedGroupId]);

    const traineeOptions = React.useMemo(() => {
        return traineesForSelectedGroups
            .map(t => ({ id: t.id, name: `${t.lastName.toUpperCase()} ${t.firstName}` }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [traineesForSelectedGroups]);
    
    const filteredTrainees = React.useMemo(() => {
        if (!selectedTraineeId) return traineesForSelectedGroups;
        return traineesForSelectedGroups.filter(t => t.id === selectedTraineeId);
    }, [traineesForSelectedGroups, selectedTraineeId]);

    const traineesWithBehaviorSanctions = React.useMemo(() => {
        return filteredTrainees.map(trainee => {
            const stats = calculateTraineeBehaviorStats(trainee);
            const group = yearData.groups.find(g => g.id === trainee.groupId);
            return {
                ...trainee,
                ...stats,
                groupName: group?.name || 'N/A'
            }
        })
        .sort((a, b) => (b.incidentCount || 0) - (a.incidentCount || 0));
    }, [filteredTrainees, yearData]);

    const handleOpenModal = (trainee: Trainee) => {
        if (trainee.dropoutDate) return; // Do not allow adding incidents for dropouts
        setCurrentTargetTrainee(trainee);
        setNewIncident({
            date: formatDate(new Date()),
            motif: '',
            sanction: BEHAVIOR_SANCTION_RULES_FOR_DISPLAY[0].sanction
        });
        setIsModalOpen(true);
    };
    
    const handleSaveIncident = () => {
        if (!currentTargetTrainee || !newIncident.motif) {
            alert("Le motif est obligatoire.");
            return;
        }

        const incidentToAdd: BehaviorIncident = { ...newIncident };
        
        const updateTraineeLogic = (trainee: Trainee) => {
            if (trainee.id === currentTargetTrainee.id) {
                const updatedBehavior = trainee.behavior ? [...trainee.behavior, incidentToAdd] : [incidentToAdd];
                return { ...trainee, behavior: updatedBehavior };
            }
            return trainee;
        };

        if (selectedYear === currentTrainingYear) {
            setAllData(prevData => ({
                ...prevData,
                trainees: prevData.trainees.map(updateTraineeLogic)
            }));
        } else {
            setArchivedData(prevArchivedData => {
                const yearDataToUpdate = prevArchivedData[selectedYear];
                if (!yearDataToUpdate) return prevArchivedData;

                const updatedYearData = {
                    ...yearDataToUpdate,
                    trainees: yearDataToUpdate.trainees.map(updateTraineeLogic)
                };
                
                return {
                    ...prevArchivedData,
                    [selectedYear]: updatedYearData
                };
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
             <BehaviorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveIncident}
                trainee={currentTargetTrainee}
                incident={newIncident}
                setIncident={setNewIncident}
            />
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BehaviorIcon />
                        <h2 className="text-xl font-bold">Barème des Sanctions (Comportement)</h2>
                    </div>
                    <button onClick={() => setIsBaremeVisible(!isBaremeVisible)} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                        <span>{isBaremeVisible ? 'Cacher' : 'Afficher'} le barème</span>
                        <div className={`transform transition-transform ${isBaremeVisible ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </div>
                    </button>
                </div>
                {isBaremeVisible && (
                    <div className="overflow-x-auto rounded-lg border animate-fade-in-down">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="py-3 px-2 sm:px-6">Motifs</th>
                                    <th className="py-3 px-2 sm:px-6">Sanctions</th>
                                    <th className="py-3 px-2 sm:px-6">Points à déduire</th>
                                    <th className="py-3 px-2 sm:px-6">Autorité de décision</th>
                                </tr>
                            </thead>
                            <tbody>
                                {BEHAVIOR_SANCTION_RULES_FOR_DISPLAY.map((rule, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="py-4 px-2 sm:px-6 font-medium">{rule.motif}</td>
                                        <td className="py-4 px-2 sm:px-6 font-semibold">{rule.sanction}</td>
                                        <td className="py-4 px-2 sm:px-6">{rule.points}</td>
                                        <td className="py-4 px-2 sm:px-6">{rule.authority}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Suivi du Comportement des Stagiaires</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={inputStyle}>
                            {allYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select value={selectedGroupId} onChange={e => { setSelectedGroupId(e.target.value); setSelectedTraineeId(''); }} className={inputStyle}>
                            <option value="">Tous les groupes</option>
                            {groupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
                        <select value={selectedTraineeId} onChange={e => setSelectedTraineeId(e.target.value)} className={inputStyle}>
                            <option value="">Tous les stagiaires</option>
                            {traineeOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border max-h-[600px]">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="py-3 px-2 sm:px-6">Stagiaire</th>
                                <th className="py-3 px-2 sm:px-6">Groupe</th>
                                <th className="py-3 px-2 sm:px-6 text-center">Indisciplines (nb)</th>
                                <th className="py-3 px-2 sm:px-6">Sanction Appliquée</th>
                                <th className="py-3 px-2 sm:px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {traineesWithBehaviorSanctions.map(trainee => (
                                <tr key={trainee.id} className={`transition-colors ${trainee.dropoutDate ? 'bg-gray-200 opacity-60' : 'hover:bg-gray-50'}`}>
                                    <td className="py-4 px-2 sm:px-6 font-medium text-gray-900 align-top">{trainee.lastName.toUpperCase()} {trainee.firstName}</td>
                                    <td className="py-4 px-2 sm:px-6 align-top">{trainee.groupName}</td>
                                    <td className="py-4 px-2 sm:px-6 text-center align-top">{trainee.incidentCount}</td>
                                    <td className="py-4 px-2 sm:px-6 align-top">
                                        {trainee.dropoutDate ? (
                                             <span className="font-semibold px-2 py-1 rounded-full text-xs bg-gray-700 text-white">
                                                Déperdu
                                            </span>
                                        ) : (trainee.behavior && trainee.behavior.length > 0) ? (
                                            <div ref={expandedTraineeId === trainee.id ? expandedListRef : null}>
                                                {(() => {
                                                    const isExpanded = expandedTraineeId === trainee.id;
                                                    const sortedBehavior = [...trainee.behavior].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                                    const sanctionsToShow = isExpanded ? sortedBehavior : sortedBehavior.slice(0, 1);
                                                    
                                                    return (
                                                        <div className="relative">
                                                            <ul className="space-y-2 text-xs">
                                                                {sanctionsToShow.map((incident, index) => {
                                                                    const sanctionRule = BEHAVIOR_SANCTION_THRESHOLDS.find(s => s.sanction === incident.sanction);
                                                                    return (
                                                                        <li key={index} className="p-2 rounded-md bg-gray-50 border border-gray-200">
                                                                            <div className="font-semibold text-gray-700">{incident.motif}</div>
                                                                            <div className="flex justify-between items-center mt-1">
                                                                                <span className="text-gray-500">{new Date(incident.date).toLocaleDateString('fr-FR')}</span>
                                                                                <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${getBehaviorSanctionStyle(sanctionRule || null)}`}>
                                                                                    {incident.sanction}
                                                                                </span>
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                            {sortedBehavior.length > 1 && (
                                                                <button
                                                                    onClick={() => setExpandedTraineeId(prevId => prevId === trainee.id ? null : trainee.id)}
                                                                    className="text-xs text-blue-600 hover:underline mt-2 font-semibold"
                                                                >
                                                                    {isExpanded ? 'Masquer les sanctions' : `Afficher les ${sortedBehavior.length} sanctions`}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Aucune</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-2 sm:px-6 text-center align-top">
                                        <button 
                                            onClick={() => handleOpenModal(trainee)} 
                                            className={`text-blue-600 ${trainee.dropoutDate ? 'cursor-not-allowed text-gray-400' : 'hover:text-blue-800'}`}
                                            title="Ajouter une indiscipline"
                                            disabled={!!trainee.dropoutDate}
                                        >
                                            <PlusCircleIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {traineesWithBehaviorSanctions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">Aucun stagiaire à afficher avec les filtres actuels.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- UTILITY FUNCTION FOR PERSONAL DATA VIEW ---
const calculateMonthlyAbsenceStats = (trainee: Trainee, academicMonths: { name: string, value: string }[]) => {
    if (!trainee) return [];

    let cumulativeRetardCount = 0;
    let cumulativeUnjustifiedAbsenceHours = 0;
    const monthlyStats: { 
        monthName: string; 
        unjustifiedHours: number;
        justifiedHours: number;
        authorizedHours: number;
        retardCount: number; 
        sanction: string; 
    }[] = [];

    for (const month of academicMonths) {
        let monthlyRetardCount = 0;
        let monthlyUnjustifiedHours = 0;
        let monthlyJustifiedHours = 0;
        let monthlyAuthorizedHours = 0;

        for (const date in trainee.absences) {
            if (date.substring(0, 7) === month.value) { // Filter by month
                if (trainee.dropoutDate && date >= trainee.dropoutDate) continue; // Ignore after dropout
                for (const sessionId in trainee.absences[date]) {
                    const type = trainee.absences[date][sessionId] as AbsenceType;
                    if (type === 'A') monthlyUnjustifiedHours += SESSION_DURATION;
                    else if (type === 'AJ') monthlyJustifiedHours += SESSION_DURATION;
                    else if (type === 'Aut') monthlyAuthorizedHours += SESSION_DURATION;
                    else if (type === 'R') monthlyRetardCount++;
                }
            }
        }
        
        cumulativeRetardCount += monthlyRetardCount;
        cumulativeUnjustifiedAbsenceHours += monthlyUnjustifiedHours;

        const equivalentRetardsFromAbsence = (cumulativeUnjustifiedAbsenceHours / RETARD_VALUE);
        const totalEquivalentRetards = cumulativeRetardCount + equivalentRetardsFromAbsence;

        let sanctionResult = null;
        for (const level of SANCTION_THRESHOLDS) {
            if (totalEquivalentRetards >= level.minEquivalentRetards) {
                sanctionResult = level;
                break;
            }
        }
        
        monthlyStats.push({
            monthName: month.name,
            unjustifiedHours: monthlyUnjustifiedHours,
            justifiedHours: monthlyJustifiedHours,
            authorizedHours: monthlyAuthorizedHours,
            retardCount: monthlyRetardCount,
            sanction: sanctionResult ? sanctionResult.sanction : 'Aucune'
        });
    }

    return monthlyStats;
};


// --- FICHE INDIVIDUELLE COMPONENT ---
const FicheIndividuelle = ({ trainee, yearData, academicYear, establishmentInfo }: { 
    trainee: Trainee, 
    yearData: TrainingData, 
    academicYear: string,
    establishmentInfo: { name: string, logo: string | null }
}) => {
    const [isDownloading, setIsDownloading] = React.useState(false);
    const group = yearData.groups.find(g => g.id === trainee.groupId);
    const filiere = group ? yearData.filieres.find(f => f.id === group.filiereId) : null;
    const level = filiere ? yearData.levels.find(l => l.id === filiere.levelId) : null;
    const academicMonths = getAcademicYearMonths(academicYear);
    
    const absenceMonthlySummary = React.useMemo(() => calculateMonthlyAbsenceStats(trainee, academicMonths), [trainee, academicMonths]);
    const behaviorSummary = React.useMemo(() => [...(trainee.behavior || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [trainee.behavior]);
    
    const handleDownload = () => {
        const ficheElement = document.getElementById('fiche-individuelle');
        if (!ficheElement) {
            console.error("Element to download not found");
            alert("Erreur: Impossible de trouver l'élément à télécharger.");
            return;
        }
        
        setIsDownloading(true);

        const { jsPDF } = window.jspdf;
        const now = new Date();
        const timestamp = `${now.toLocaleDateString('fr-CA').replace(/-/g, '')}-${now.toLocaleTimeString('fr-FR').replace(/:/g, '')}`;
        const filename = `Fiche_${trainee.lastName}_${trainee.firstName}_${timestamp}.pdf`;
        
        const canvasOptions = { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            ignoreElements: (element: Element) => element.classList.contains('no-pdf')
        };

        window.html2canvas(ficheElement, canvasOptions).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const ratio = imgWidth / imgHeight;
            let width = pdfWidth - 40; // Margin
            let height = width / ratio;
            
            if (height > pdfHeight - 40) {
                height = pdfHeight - 40;
                width = height * ratio;
            }
            
            const x = (pdfWidth - width) / 2;
            const y = 20; // Top margin

            pdf.addImage(imgData, 'PNG', x, y, width, height);
            pdf.save(filename);
        }).catch(err => {
            console.error("Error generating PDF:", err);
            alert("Une erreur est survenue lors de la génération du PDF.");
        }).finally(() => {
            setIsDownloading(false);
        });
    };


    return (
        <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg" id="fiche-individuelle">
            <ExportHeader
                establishmentInfo={establishmentInfo}
                trainingYear={academicYear}
                title="Fiche de Renseignements Individuelle"
            />
            <div className="flex justify-end no-pdf">
                 <button 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="download-button flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
                >
                    {isDownloading ? (
                        'Téléchargement...'
                    ) : (
                        <>
                            <DownloadIcon />
                            Télécharger la Fiche
                        </>
                    )}
                </button>
            </div>

            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations du Stagiaire</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                    <div><span className="font-semibold text-gray-500">Nom & Prénom:</span> <span className="ml-2 text-gray-800">{trainee.lastName.toUpperCase()} {trainee.firstName}</span></div>
                    <div><span className="font-semibold text-gray-500">Date de naissance:</span> <span className="ml-2 text-gray-800">{new Date(trainee.birthDate).toLocaleDateString('fr-FR')}</span></div>
                    <div><span className="font-semibold text-gray-500">Âge:</span> <span className="ml-2 text-gray-800">{calculateAge(trainee.birthDate)} ans</span></div>
                    <div><span className="font-semibold text-gray-500">CEF:</span> <span className="ml-2 text-gray-800">{trainee.cef}</span></div>
                    <div><span className="font-semibold text-gray-500">Niveau:</span> <span className="ml-2 text-gray-800">{level?.name || 'N/A'}</span></div>
                    <div><span className="font-semibold text-gray-500">Filière:</span> <span className="ml-2 text-gray-800">{filiere?.name || 'N/A'}</span></div>
                    <div><span className="font-semibold text-gray-500">Groupe:</span> <span className="ml-2 text-gray-800">{group?.name || 'N/A'}</span></div>
                </div>
            </div>

            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tableau Récapitulatif des Absences</h3>
                 <div className="rounded-lg border">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="py-3 px-2 sm:px-4">Mois</th>
                                <th className="py-3 px-2 sm:px-4 text-center">Absences Non Justifiées (h)</th>
                                <th className="py-3 px-2 sm:px-4 text-center">Absences Justifiées (h)</th>
                                <th className="py-3 px-2 sm:px-4 text-center">Autorisations (h)</th>
                                <th className="py-3 px-2 sm:px-4 text-center">Retards (nb)</th>
                                <th className="py-3 px-2 sm:px-4">Sanction (cumulative)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {absenceMonthlySummary.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="py-3 px-2 sm:px-4 font-medium">{row.monthName}</td>
                                    <td className="py-3 px-2 sm:px-4 text-center">{row.unjustifiedHours}</td>
                                    <td className="py-3 px-2 sm:px-4 text-center">{row.justifiedHours}</td>
                                    <td className="py-3 px-2 sm:px-4 text-center">{row.authorizedHours}</td>
                                    <td className="py-3 px-2 sm:px-4 text-center">{row.retardCount}</td>
                                    <td className="py-3 px-2 sm:px-4 font-semibold break-words">{row.sanction}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tableau Récapitulatif des Comportements</h3>
                <div className="rounded-lg border">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="py-3 px-2 sm:px-4">Date</th>
                                <th className="py-3 px-2 sm:px-4">Motif</th>
                                <th className="py-3 px-2 sm:px-4">Sanction</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                             {behaviorSummary.length > 0 ? behaviorSummary.map((incident, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="py-3 px-2 sm:px-4">{new Date(incident.date).toLocaleDateString('fr-FR')}</td>
                                    <td className="py-3 px-2 sm:px-4 break-words">{incident.motif}</td>
                                    <td className="py-3 px-2 sm:px-4 font-semibold break-words">{incident.sanction}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-6 text-gray-500">Aucun incident de comportement enregistré.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- DONNEES PERSONNELLES VIEW ---
const DonneesPersonnellesView = ({ allYearsData, establishmentInfo }: { 
    allYearsData: ArchivedData & { [key: string]: TrainingData },
    establishmentInfo: { name: string, logo: string | null }
}) => {
    const allYears = React.useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    const [selectedYear, setSelectedYear] = React.useState(allYears[0] || '');
    
    const yearData = React.useMemo(() => allYearsData[selectedYear], [allYearsData, selectedYear]);

    const [selectedGroupId, setSelectedGroupId] = React.useState<string>('');
    const [selectedTraineeId, setSelectedTraineeId] = React.useState<string>('');
    
    const groupOptions = React.useMemo(() => yearData?.groups.map(g => ({id: g.id, name: g.name})).sort((a,b) => a.name.localeCompare(b.name)) || [], [yearData]);
    
    const traineesForSelectedGroups = React.useMemo(() => {
        if (!yearData) return [];
        if (!selectedGroupId) return yearData.trainees;
        return yearData.trainees.filter(t => t.groupId === selectedGroupId);
    }, [yearData, selectedGroupId]);

    const traineeOptions = React.useMemo(() => {
        return traineesForSelectedGroups
            .map(t => ({ id: t.id, name: `${t.lastName.toUpperCase()} ${t.firstName}` }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [traineesForSelectedGroups]);
    
    const selectedTrainee = React.useMemo(() => {
        if (!selectedTraineeId || !yearData) return null;
        return yearData.trainees.find(t => t.id === selectedTraineeId) || null;
    }, [selectedTraineeId, yearData]);

    // Reset filters when year changes
    React.useEffect(() => {
        setSelectedGroupId('');
        setSelectedTraineeId('');
    }, [selectedYear]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-lg print:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <ClipboardListIcon />
                    <h2 className="text-xl font-bold">Données Personnelles du Stagiaire</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={inputStyle}>
                            {allYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select value={selectedGroupId} onChange={e => {
                            setSelectedGroupId(e.target.value);
                            setSelectedTraineeId(''); // Reset trainee filter
                        }} className={inputStyle}>
                            <option value="">Tous les groupes</option>
                            {groupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
                        <select value={selectedTraineeId} onChange={e => setSelectedTraineeId(e.target.value)} className={inputStyle} disabled={!selectedGroupId}>
                            <option value="">Sélectionner un stagiaire</option>
                            {traineeOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedTrainee && yearData ? (
                <div id="printable-area">
                    <FicheIndividuelle 
                        trainee={selectedTrainee} 
                        yearData={yearData} 
                        academicYear={selectedYear}
                        establishmentInfo={establishmentInfo} 
                    />
                </div>
            ) : (
                <div className="bg-white p-10 rounded-lg shadow-lg text-center print:hidden">
                    <ClipboardListIcon />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Veuillez sélectionner un stagiaire</h3>
                    <p className="mt-1 text-sm text-gray-500">Utilisez les filtres ci-dessus pour afficher sa fiche de renseignements.</p>
                </div>
            )}
        </div>
    );
};


// --- DATA VIEW / PARAMETRES ---
const DataView = ({ allData, setAllData, trainingYears, archived, setArchived, currentYear, setCurrentTrainingYear, establishmentInfo, setEstablishmentInfo, currentUser, users, setUsers }: { 
    allData: TrainingData, 
    setAllData: React.Dispatch<React.SetStateAction<TrainingData>>, 
    trainingYears: string[], 
    archived: ArchivedData, 
    setArchived: React.Dispatch<React.SetStateAction<ArchivedData>>, 
    currentYear: string, 
    setCurrentTrainingYear: (year: string) => void,
    establishmentInfo: { name: string, logo: string | null },
    setEstablishmentInfo: (info: any) => void,
    currentUser: User,
    users: User[],
    setUsers: (users: any) => void
}) => {
    const [editingFiliereId, setEditingFiliereId] = React.useState<string | null>(null);
    const [editedFiliereHours, setEditedFiliereHours] = React.useState<number>(0);
    const [actionStatus, setActionStatus] = React.useState('');
    
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [importYear, setImportYear] = React.useState(trainingYears[0] || '');
    const [importYearError, setImportYearError] = React.useState('');

    const [openSection, setOpenSection] = React.useState<string | null>(currentUser.role === 'superAdmin' ? 'generalInfo' : 'importData');

    const toggleSection = (sectionId: string) => {
        setOpenSection(prev => prev === sectionId ? null : sectionId);
    };

    // General Info state
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState(establishmentInfo.name);
    const [confirmModal, setConfirmModal] = React.useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });


    // Filters for MH Section
    const [mhYear, setMhYear] = React.useState(trainingYears[0] || '');
    
    // Filters for Trainees Section
    const [traineeListFilters, setTraineeListFilters] = React.useState({ year: trainingYears[0] || '', groupId: '' });


    const mhYearData = React.useMemo(() => {
        return {
            groups: allData.groups.filter(g => g.trainingYear === mhYear),
            filieres: allData.filieres
        }
    }, [allData, mhYear]);
    
    const mhYearFilieres = React.useMemo(() => {
        const filiereMap = new Map<string, { filiere: Filiere; representativeGroup: Group }>();
        mhYearData.groups.forEach(group => {
            if (!filiereMap.has(group.filiereId)) {
                const filiere = mhYearData.filieres.find(f => f.id === group.filiereId);
                if (filiere) {
                    filiereMap.set(group.filiereId, { filiere, representativeGroup: group });
                }
            }
        });
        return Array.from(filiereMap.values()).sort((a, b) => a.filiere.name.localeCompare(b.filiere.name));
    }, [mhYearData]);

    const traineeListGroups = React.useMemo(() => {
        return allData.groups
            .filter(g => g.trainingYear === traineeListFilters.year)
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [allData.groups, traineeListFilters.year]);
    
    React.useEffect(() => {
        // Reset group when year changes and the selected group doesn't exist anymore
        const groupExists = traineeListGroups.some(g => g.id === traineeListFilters.groupId);
        if (!groupExists) {
            setTraineeListFilters(prev => ({ ...prev, groupId: '' }));
        }
    }, [traineeListFilters.year, traineeListGroups]);


    const filteredTraineesForList = React.useMemo(() => {
        const groupIdsForYear = new Set(allData.groups.filter(g => g.trainingYear === traineeListFilters.year).map(g => g.id));
        let trainees = allData.trainees.filter(t => groupIdsForYear.has(t.groupId));

        if (traineeListFilters.groupId) {
            trainees = trainees.filter(t => t.groupId === traineeListFilters.groupId);
        }
        
        return trainees.sort((a,b) => a.lastName.localeCompare(b.lastName));
    }, [allData.trainees, allData.groups, traineeListFilters]);

    // --- GENERAL INFO HANDLERS ---
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEstablishmentInfo((prev: any) => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        } else {
            alert("Veuillez sélectionner un fichier image valide (png, jpg, etc.).");
        }
        event.target.value = ''; // Reset input to allow re-uploading the same file
    };

    const handleEditName = () => {
        setTempName(establishmentInfo.name);
        setIsEditingName(true);
    };
    const handleSaveName = () => {
        setEstablishmentInfo((prev: any) => ({ ...prev, name: tempName }));
        setIsEditingName(false);
    };
    const handleCancelName = () => {
        setIsEditingName(false);
    };

    const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleDeleteLogo = () => {
        openConfirmModal('Supprimer le logo', 'Êtes-vous sûr de vouloir supprimer le logo de l\'établissement ?', () => {
            setEstablishmentInfo((prev: any) => ({ ...prev, logo: null }));
            closeConfirmModal();
        });
    };

    const handleDeleteName = () => {
        openConfirmModal('Supprimer le nom', 'Êtes-vous sûr de vouloir supprimer le nom de l\'établissement ? Cette action est irréversible.', () => {
            setEstablishmentInfo((prev: any) => ({ ...prev, name: '' }));
            setTempName('');
            setIsEditingName(false);
            closeConfirmModal();
        });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setSelectedFile(file || null);
    };

    const handleImportYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const year = e.target.value;
        setImportYear(year);
        if (!/^\d{4}-\d{4}$/.test(year)) {
            setImportYearError("Format invalide. Utilisez AAAA-AAAA.");
        } else {
            setImportYearError("");
        }
    };

    const handleExportTemplate = () => {
        const headers = ['Niveau', 'Filiere', 'Groupe', 'CEF', 'Nom', 'Prénom', 'DateNaissance'];
        const exampleRow = ['Technicien Spécialisé', 'Développement Digital', 'DEV101', 'A123456', 'Dupont', 'Jean', '15/05/2002'];
        
        const ws = window.XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        
        ws['!cols'] = [
            { wch: 25 }, // Niveau
            { wch: 25 }, // Filiere
            { wch: 15 }, // Groupe
            { wch: 15 }, // CEF
            { wch: 20 }, // Nom
            { wch: 20 }, // Prénom
            { wch: 20 }  // DateNaissance
        ];
        
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'Stagiaires');
        
        window.XLSX.writeFile(wb, 'Modele_Import_Stagiaires.xlsx');
    };

    const handleImportConfirm = () => {
        if (!selectedFile) {
            alert("Veuillez d'abord sélectionner un fichier.");
            return;
        }
        if (importYearError || !importYear) {
            alert("Veuillez entrer une année de formation valide au format AAAA-AAAA.");
            return;
        }

        const reader = new FileReader();
        
        reader.onerror = () => {
            setActionStatus(`Erreur: Impossible de lire le fichier ${selectedFile.name}.`);
            setTimeout(() => setActionStatus(''), 5000);
            console.error('File reading error:', reader.error);
        };
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                if (jsonData.length < 2) {
                     setActionStatus('Erreur: Fichier Excel vide ou sans en-têtes.');
                     setTimeout(() => setActionStatus(''), 3000);
                     return;
                }

                const headerRow = jsonData[0];
                const headerIndexMap = new Map<string, number>();
                headerRow.forEach((header, index) => {
                    const normalizedHeader = String(header).trim().toLowerCase().replace(/é/g, 'e');
                    if (normalizedHeader) headerIndexMap.set(normalizedHeader, index);
                });

                const getIndex = (keys: string[]): number | undefined => {
                    for (const key of keys) {
                        if (headerIndexMap.has(key)) return headerIndexMap.get(key);
                    }
                    return undefined;
                };

                const colIndices = {
                    level: getIndex(['niveau']),
                    filiere: getIndex(['filiere']),
                    group: getIndex(['groupe']),
                    cef: getIndex(['cef']),
                    lastName: getIndex(['nom']),
                    firstName: getIndex(['prenom', 'prénom']),
                    birthDate: getIndex(['datenaissance'])
                };

                const missingCols = Object.entries(colIndices)
                    .filter(([, value]) => value === undefined)
                    .map(([key]) => key);

                if (missingCols.length > 0) {
                     setActionStatus(`Erreur: Colonnes manquantes: ${missingCols.join(', ')}.`);
                     setTimeout(() => setActionStatus(''), 5000);
                     return;
                }
                
                const processingErrors: string[] = [];
                const newEntities = {
                    levels: [] as Level[],
                    filieres: [] as Filiere[],
                    groups: [] as Group[],
                    trainees: [] as Trainee[],
                };

                const tempState = { ...allData };
                
                const levelMap = new Map(tempState.levels.map(l => [l.name.toLowerCase(), l]));
                const filiereMap = new Map(tempState.filieres.map(f => [f.name.toLowerCase(), f]));
                const groupMap = new Map(tempState.groups.filter(g => g.trainingYear === importYear).map(g => [g.name.toLowerCase(), g]));
                
                const normalize = (str: string) => (str || '').toString().toLowerCase().trim();
                const getEnrollmentKey = (trainee: {cef: string, lastName: string, firstName: string, groupId: string}) => {
                    return `${normalize(trainee.cef)}|${normalize(trainee.lastName)}|${normalize(trainee.firstName)}|${trainee.groupId}`;
                };
                const existingEnrollments = new Set(tempState.trainees.map(getEnrollmentKey));
                const enrollmentsInFile = new Set<string>();
                
                const rows = jsonData.slice(1).filter(row => row.some(cell => String(cell).trim() !== ""));

                rows.forEach((columns, index) => {
                    const rowNum = index + 2;

                    const levelName = String(columns[colIndices.level!]).trim();
                    const filiereName = String(columns[colIndices.filiere!]).trim();
                    const groupName = String(columns[colIndices.group!]).trim();
                    const cef = String(columns[colIndices.cef!]).trim();
                    const lastName = String(columns[colIndices.lastName!]).trim();
                    const firstName = String(columns[colIndices.firstName!]).trim();
                    const birthDateRaw = columns[colIndices.birthDate!];

                    if (!levelName || !filiereName || !groupName || !cef || !lastName || !firstName || !birthDateRaw) {
                        processingErrors.push(`Ligne ${rowNum}: Une ou plusieurs cellules requises sont vides.`);
                        return;
                    }

                    let level = levelMap.get(levelName.toLowerCase());
                    if (!level) {
                        level = { id: `L-${Date.now()}-${index}`, name: levelName };
                        newEntities.levels.push(level);
                        levelMap.set(levelName.toLowerCase(), level);
                    }

                    let filiere = filiereMap.get(filiereName.toLowerCase());
                    if (!filiere) {
                        filiere = { id: `F-${Date.now()}-${index}`, name: filiereName, levelId: level.id };
                        newEntities.filieres.push(filiere);
                        filiereMap.set(filiereName.toLowerCase(), filiere);
                    }

                    let group = groupMap.get(groupName.toLowerCase());
                    if (!group) {
                        group = { id: `G-${Date.now()}-${index}`, name: groupName, filiereId: filiere.id, annualHours: 1200, trainingYear: importYear };
                        newEntities.groups.push(group);
                        groupMap.set(groupName.toLowerCase(), group);
                    }
                    
                    const enrollmentKey = getEnrollmentKey({cef, lastName, firstName, groupId: group.id});
                    if (existingEnrollments.has(enrollmentKey) || enrollmentsInFile.has(enrollmentKey)) {
                        return;
                    }
                    
                    let birthDate = '';
                    if (typeof birthDateRaw === 'number' && birthDateRaw > 0) {
                        birthDate = convertExcelDate(birthDateRaw);
                    } else if (typeof birthDateRaw === 'string') {
                        birthDate = parseDateDDMMYYYY(birthDateRaw);
                    }
                    
                    if (!birthDate) {
                        processingErrors.push(`Ligne ${rowNum}: Format de date invalide pour ${firstName} ${lastName} (attendu JJ/MM/AAAA ou format date Excel).`);
                        return;
                    }
                    
                    const newTrainee = {
                        id: `T-${Date.now()}-${index}`,
                        cef, firstName, lastName, birthDate,
                        groupId: group.id,
                        absences: {}
                    };
                    newEntities.trainees.push(newTrainee);
                    enrollmentsInFile.add(enrollmentKey);
                });

                if (processingErrors.length > 0) {
                     alert(`Erreurs lors de l'importation :\n\n${processingErrors.join('\n')}`);
                     setActionStatus(`Échec de l'importation. ${processingErrors.length} erreur(s) trouvée(s).`);
                     setTimeout(() => setActionStatus(''), 5000);
                     return;
                }
                
                const importedTraineeCount = newEntities.trainees.length;
                if (importedTraineeCount === 0 && newEntities.groups.length === 0) {
                     setActionStatus(`Aucun nouveau stagiaire ou groupe à importer. Les données sont déjà à jour.`);
                     setTimeout(() => setActionStatus(''), 5000);
                     return;
                }

                const shouldArchiveCurrentYear = importYear !== currentYear && allData.groups.some(g => g.trainingYear === currentYear);

                if (shouldArchiveCurrentYear) {
                    const currentYearGroups = allData.groups.filter(g => g.trainingYear === currentYear);
                    const currentYearGroupIds = new Set(currentYearGroups.map(g => g.id));
                    const currentYearTrainees = allData.trainees.filter(t => currentYearGroupIds.has(t.groupId));

                    const dataToArchive: TrainingData = {
                        levels: allData.levels,
                        filieres: allData.filieres,
                        groups: currentYearGroups,
                        trainees: currentYearTrainees,
                    };

                    setArchived(prev => ({ ...prev, [currentYear]: dataToArchive }));
                }

                setAllData(prevAllData => {
                    let baseGroups = prevAllData.groups;
                    let baseTrainees = prevAllData.trainees;

                    if (shouldArchiveCurrentYear) {
                        const currentYearGroupIds = new Set(baseGroups.filter(g => g.trainingYear === currentYear).map(g => g.id));
                        baseGroups = baseGroups.filter(g => g.trainingYear !== currentYear);
                        baseTrainees = baseTrainees.filter(t => !currentYearGroupIds.has(t.groupId));
                    }
                    
                    return {
                        levels: [...prevAllData.levels, ...newEntities.levels],
                        filieres: [...prevAllData.filieres, ...newEntities.filieres],
                        groups: [...baseGroups, ...newEntities.groups],
                        trainees: [...baseTrainees, ...newEntities.trainees],
                    };
                });
                
                setCurrentTrainingYear(importYear);

                setActionStatus(`${importedTraineeCount} stagiaire(s) importé(s) avec succès pour l'année ${importYear} !`);
                setTimeout(() => setActionStatus(''), 5000);
                setSelectedFile(null);

            } catch(error) {
                console.error("Error parsing Excel file:", error);
                setActionStatus("Erreur fatale lors de la lecture du fichier Excel. Vérifiez son format et son contenu.");
                setTimeout(() => setActionStatus(''), 5000);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleEditFiliere = (filiere: Filiere, group: Group) => {
        setEditingFiliereId(filiere.id);
        setEditedFiliereHours(group.annualHours);
    };

    const handleCancelFiliere = () => {
        setEditingFiliereId(null);
        setEditedFiliereHours(0);
    };

    const handleSaveFiliere = (filiereId: string) => {
        setAllData(prevData => {
            const updatedGroups = prevData.groups.map(g => {
                if (g.filiereId === filiereId && g.trainingYear === mhYear) {
                    return { ...g, annualHours: editedFiliereHours };
                }
                return g;
            });
            return { ...prevData, groups: updatedGroups };
        });
        setActionStatus('Masse horaire mise à jour avec succès.');
        setTimeout(() => setActionStatus(''), 3000);
        handleCancelFiliere();
    };

    const handleDeleteFiliereForYear = (filiereId: string, filiereName: string) => {
        openConfirmModal(
            `Supprimer la filière ${filiereName} pour ${mhYear}?`,
            `Ceci supprimera tous les groupes et stagiaires associés à cette filière pour l'année ${mhYear}. Cette action est irréversible.`,
            () => {
                setAllData(prevData => {
                    const groupsToDelete = prevData.groups.filter(g => g.filiereId === filiereId && g.trainingYear === mhYear);
                    const groupIdsToDelete = new Set(groupsToDelete.map(g => g.id));
                    
                    const remainingGroups = prevData.groups.filter(g => !groupIdsToDelete.has(g.id));
                    const remainingTrainees = prevData.trainees.filter(t => !groupIdsToDelete.has(t.groupId));

                    return { ...prevData, groups: remainingGroups, trainees: remainingTrainees };
                });
                closeConfirmModal();
            }
        );
    };
    
    const handleDeleteTrainee = (traineeId: string, traineeName: string) => {
        openConfirmModal(
            `Supprimer le stagiaire ${traineeName}?`,
            `Toutes les données de ce stagiaire seront supprimées définitivement. Cette action est irréversible.`,
            () => {
                setAllData(prevData => ({
                    ...prevData,
                    trainees: prevData.trainees.filter(t => t.id !== traineeId)
                }));
                closeConfirmModal();
            }
        );
    };
    
    const handleArchive = () => {
        if (!window.confirm(`Êtes-vous sûr de vouloir archiver l'année ${currentYear} ? Cette action est irréversible.`)) {
            return;
        }

        const newYearName = window.prompt("Veuillez entrer le nom de la nouvelle année de formation (ex: 2024-2025):");
        if (!newYearName || !/^\d{4}-\d{4}$/.test(newYearName)) {
            alert("Format de l'année invalide. Veuillez utiliser le format AAAA-AAAA.");
            return;
        }

        const currentYearGroups = allData.groups.filter(g => g.trainingYear === currentYear);
        const currentYearGroupIds = new Set(currentYearGroups.map(g => g.id));
        const currentYearTrainees = allData.trainees.filter(t => currentYearGroupIds.has(t.groupId));

        const dataToArchive: TrainingData = {
            levels: allData.levels,
            filieres: allData.filieres,
            groups: currentYearGroups,
            trainees: currentYearTrainees,
        };

        setArchived(prev => ({ ...prev, [currentYear]: dataToArchive }));
        
        setAllData(prev => ({
            ...prev,
            groups: prev.groups.filter(g => g.trainingYear !== currentYear),
            trainees: prev.trainees.filter(t => !currentYearGroupIds.has(t.groupId)),
        }));
        
        setCurrentTrainingYear(newYearName);
        
        alert(`L'année ${currentYear} a été archivée. Vous travaillez maintenant sur la nouvelle année : ${newYearName}.`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
             <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
            >
                <p>{confirmModal.message}</p>
            </ConfirmationModal>

            {currentUser.role === 'superAdmin' && (
                <div className="border-b pb-4">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('generalInfo')}>
                        <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardListIcon/> Informations Générales</h2>
                        <button className="p-1">{openSection === 'generalInfo' ? <ChevronUpIcon/> : <ChevronDownIcon/>}</button>
                    </div>
                    {openSection === 'generalInfo' && (
                        <div className="mt-4 space-y-6 animate-fade-in-down p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nom de l'établissement</h3>
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <input value={tempName} onChange={e => setTempName(e.target.value)} className={inputStyle} placeholder="Entrez le nom de l'établissement"/>
                                        <button onClick={handleSaveName} className="p-2 text-green-600 hover:text-green-800 bg-green-100 rounded-md"><SaveIcon/></button>
                                        <button onClick={handleCancelName} className="p-2 text-gray-500 hover:text-gray-700 bg-gray-200 rounded-md"><CancelIcon/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-2 bg-white border rounded-md">
                                        <span className="font-medium text-gray-800">{establishmentInfo.name || <span className="italic text-gray-400">Aucun nom défini</span>}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleEditName} className="p-2 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50" title="Modifier le nom"><EditIcon/></button>
                                            <button onClick={handleDeleteName} className="p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50" title="Supprimer le nom"><DeleteIcon/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Logo de l'établissement</h3>
                                <div className="flex items-center gap-4">
                                    {establishmentInfo.logo ? (
                                        <img src={establishmentInfo.logo} alt="Logo" className="h-16 w-auto border p-1 rounded-md bg-white shadow-sm"/>
                                    ) : (
                                        <div className="h-16 w-24 flex items-center justify-center bg-gray-100 border-dashed border-2 rounded-md text-gray-400 text-sm">
                                            Aucun logo
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="logo-upload" className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors inline-flex items-center text-sm">
                                            <UploadIcon /> {establishmentInfo.logo ? "Modifier" : "Ajouter"}
                                        </label>
                                        <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                        {establishmentInfo.logo && <button onClick={handleDeleteLogo} className="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors inline-flex items-center text-sm"><DeleteIcon/> <span className="ml-2">Supprimer</span></button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

             <div className="border-b pb-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('importData')}>
                    <h2 className="text-xl font-bold flex items-center gap-2"><SettingsIcon /> Importer des Données</h2>
                    <button className="p-1">{openSection === 'importData' ? <ChevronUpIcon/> : <ChevronDownIcon/>}</button>
                </div>
                {openSection === 'importData' && (
                    <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50 space-y-4 animate-fade-in-down">
                        <p className="text-sm text-gray-600 mb-2">
                           Préparez un fichier Excel (.xlsx) avec les 7 colonnes suivantes dans cet ordre :
                           <br/>
                           <code className="text-xs bg-gray-200 p-1 rounded font-mono mt-1 inline-block">Niveau, Filiere, Groupe, CEF, Nom, Prénom, DateNaissance</code>
                           <br/>
                           <span className="text-xs italic text-gray-500">Note: La date de naissance doit être au format JJ/MM/AAAA ou un format de date standard Excel.</span>
                        </p>

                        <div>
                            <label htmlFor="import-year" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation pour l'import</label>
                            <input id="import-year" type="text" value={importYear} onChange={handleImportYearChange} placeholder="ex: 2024-2025" className={`${inputStyle} ${importYearError ? 'border-red-500' : ''}`} />
                            {importYearError && <p className="text-red-500 text-xs mt-1">{importYearError}</p>}
                        </div>
                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                             <button onClick={handleExportTemplate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105 inline-flex items-center">
                                <DownloadIcon />
                                Télécharger le modèle
                            </button>
                            <label htmlFor="excel-upload" className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105 inline-flex items-center">
                                <UploadIcon />
                                Choisir un fichier Excel
                            </label>
                            <input id="excel-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileSelect} />
                             <span className="text-sm text-gray-500 italic">{selectedFile?.name || 'Aucun fichier sélectionné'}</span>
                        </div>
                        <div className="flex justify-end items-center gap-4">
                            {actionStatus && <span className={`text-sm font-medium animate-pulse ${actionStatus.startsWith('Erreur') || actionStatus.startsWith('Échec') ? 'text-red-600' : 'text-green-600'}`}>{actionStatus}</span>}
                            <button onClick={handleImportConfirm} disabled={!selectedFile || !!importYearError} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none">
                                Confirmer l'Importation
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-b pb-4">
                 <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('annualHours')}>
                    <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="h-6 w-6"/> MH annuelle affectée</h2>
                    <button className="p-1">{openSection === 'annualHours' ? <ChevronUpIcon/> : <ChevronDownIcon/>}</button>
                </div>
                {openSection === 'annualHours' && (
                    <div className="mt-4 animate-fade-in-down">
                        <div className="mb-4 max-w-xs">
                           <label htmlFor="mh-year" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation</label>
                           <select id="mh-year" value={mhYear} onChange={e => setMhYear(e.target.value)} className={inputStyle}>
                                {trainingYears.map(year => <option key={year} value={year}>{year}</option>)}
                           </select>
                        </div>

                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-2 sm:px-6">Filière</th>
                                        <th className="py-3 px-2 sm:px-6">Masse Horaire Annuelle</th>
                                        <th className="py-3 px-2 sm:px-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mhYearFilieres.map(({ filiere, representativeGroup }) => {
                                        const isEditing = editingFiliereId === filiere.id;
                                        return (
                                            <tr key={filiere.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="py-4 px-2 sm:px-6 font-medium text-gray-900">{filiere.name}</td>
                                                <td className="py-4 px-2 sm:px-6">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editedFiliereHours}
                                                            onChange={e => setEditedFiliereHours(Number(e.target.value))}
                                                            className={`${inputStyle} w-32`}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="bg-gray-200 px-3 py-1 rounded-md">{representativeGroup.annualHours}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-2 sm:px-6 flex items-center space-x-3 whitespace-nowrap">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => handleSaveFiliere(filiere.id)} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                                            <button onClick={handleCancelFiliere} className="text-gray-500 hover:text-gray-700"><CancelIcon /></button>
                                                        </>
                                                    ) : (
                                                      <>
                                                        <button onClick={() => handleEditFiliere(filiere, representativeGroup)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                                        <button onClick={() => handleDeleteFiliereForYear(filiere.id, filiere.name)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                                      </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {mhYearFilieres.length === 0 && (
                                        <tr><td colSpan={3} className="text-center p-4 text-gray-500">Aucune filière pour cette année.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="border-b pb-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('manageTrainees')}>
                    <h2 className="text-xl font-bold flex items-center gap-2"><UserGroupIcon/> Gestion des Stagiaires</h2>
                    <button className="p-1">{openSection === 'manageTrainees' ? <ChevronUpIcon/> : <ChevronDownIcon/>}</button>
                </div>
                {openSection === 'manageTrainees' && (
                    <div className="mt-4 animate-fade-in-down">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                           <div>
                                <label htmlFor="trainee-list-year" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation</label>
                                <select 
                                    id="trainee-list-year" 
                                    value={traineeListFilters.year} 
                                    onChange={e => setTraineeListFilters({ year: e.target.value, groupId: ''})} 
                                    className={inputStyle}
                                >
                                    {trainingYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                           </div>
                           <div>
                                <label htmlFor="trainee-list-group" className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                                <select 
                                    id="trainee-list-group" 
                                    value={traineeListFilters.groupId} 
                                    onChange={e => setTraineeListFilters(prev => ({ ...prev, groupId: e.target.value }))}
                                    className={inputStyle}
                                >
                                    <option value="">Tous les groupes</option>
                                    {traineeListGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                </select>
                           </div>
                        </div>

                         <div className="overflow-x-auto rounded-lg border max-h-96">
                             <table className="w-full text-sm text-left text-gray-500">
                                 <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                     <tr>
                                         <th className="py-3 px-2 sm:px-6">CEF</th>
                                         <th className="py-3 px-2 sm:px-6">Nom</th>
                                         <th className="py-3 px-2 sm:px-6">Prénom</th>
                                         <th className="py-3 px-2 sm:px-6">Date de Naissance</th>
                                         <th className="py-3 px-2 sm:px-6">Groupe</th>
                                         <th className="py-3 px-2 sm:px-6">Action</th>
                                     </tr>
                                 </thead>
                                 <tbody className="bg-white">
                                    {filteredTraineesForList.map(trainee => (
                                        <tr key={trainee.id} className={`border-b hover:bg-gray-50 ${trainee.dropoutDate ? 'opacity-50 bg-gray-100' : ''}`}>
                                            <td className="py-4 px-2 sm:px-6 font-mono text-gray-700 whitespace-nowrap">{trainee.cef}</td>
                                            <td className="py-4 px-2 sm:px-6 font-medium text-gray-900">{trainee.lastName.toUpperCase()}</td>
                                            <td className="py-4 px-2 sm:px-6">{trainee.firstName}</td>
                                            <td className="py-4 px-2 sm:px-6 whitespace-nowrap">{new Date(trainee.birthDate).toLocaleDateString('fr-FR')}</td>
                                            <td className="py-4 px-2 sm:px-6">{allData.groups.find(g => g.id === trainee.groupId)?.name}</td>
                                            <td className="py-4 px-2 sm:px-6 whitespace-nowrap">
                                                <button onClick={() => handleDeleteTrainee(trainee.id, `${trainee.firstName} ${trainee.lastName.toUpperCase()}`)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                            </td>
                                        </tr>
                                    ))}
                                 </tbody>
                             </table>
                             {filteredTraineesForList.length === 0 && <p className="text-center py-8 text-gray-500">Aucun stagiaire à afficher pour cette sélection.</p>}
                         </div>
                    </div>
                )}
            </div>
             <div>
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('archiveData')}>
                    <h2 className="text-xl font-bold flex items-center gap-2"><DownloadIcon /> Archivage</h2>
                     <button className="p-1">{openSection === 'archiveData' ? <ChevronUpIcon/> : <ChevronDownIcon/>}</button>
                </div>
                 {openSection === 'archiveData' && (
                     <div className="mt-4 border border-gray-200 p-4 rounded-lg bg-gray-50 animate-fade-in-down">
                        <h3 className="font-semibold text-lg text-blue-800">Archiver l'année en cours</h3>
                        <p className="text-gray-600 mt-1">
                            Cette action va sauvegarder toutes les données de l'année <span className="font-bold">{currentYear}</span> et vous permettra de démarrer une nouvelle année de formation.
                        </p>
                        <button onClick={handleArchive} className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105">
                            Archiver l'année {currentYear}
                        </button>
                    </div>
                 )}
            </div>
        </div>
    );
};

type RecapDataType = { year: string; monthValue: string; groupId: string; groupName: string; };

const formatMonthName = (monthStr: string) => { // '2025-10'
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    const monthName = date.toLocaleString('fr-FR', { month: 'long' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year;
};

// --- RECAPITULATIF CONTENT for History View ---
const RecapitulatifContent = ({ allYearsData, recapData, establishmentInfo }: { 
    allYearsData: ArchivedData & { [key: string]: TrainingData }, 
    recapData: RecapDataType,
    establishmentInfo: { name: string, logo: string | null }
}) => {
    const { year, monthValue, groupId, groupName } = recapData;
    const yearData = allYearsData[year];

    const recapStats = React.useMemo(() => {
        if (!yearData) return [];
        const traineesInGroup = yearData.trainees.filter(t => t.groupId === groupId);

        return traineesInGroup.map(trainee => {
            const counts: { [key in AbsenceType]?: number } = {};
            for (const date in trainee.absences) {
                if (date.startsWith(monthValue)) {
                     if (trainee.dropoutDate && date >= trainee.dropoutDate) continue; 
                    for (const sessionId in trainee.absences[date]) {
                        const type = trainee.absences[date][sessionId];
                        counts[type] = (counts[type] || 0) + 1;
                    }
                }
            }
            return {
                id: trainee.id,
                name: `${trainee.lastName.toUpperCase()} ${trainee.firstName}`,
                A: counts['A'] || 0,
                AJ: counts['AJ'] || 0,
                R: counts['R'] || 0,
                Aut: counts['Aut'] || 0,
            };
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [yearData, groupId, monthValue]);
    
    return (
        <div className="p-4 sm:p-6 bg-white rounded-lg">
            <ExportHeader
                establishmentInfo={establishmentInfo}
                trainingYear={year}
                title="Récapitulatif des Absences"
                subtitle={`${groupName} - ${formatMonthName(monthValue)}`}
            />
            <div className="rounded-lg border max-h-[60vh]">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                        <tr>
                            <th className="py-3 px-4">Stagiaire</th>
                            <th className="py-3 px-4 text-center">Absences (A)</th>
                            <th className="py-3 px-4 text-center">Retards (R)</th>
                            <th className="py-3 px-4 text-center">Justifiées (AJ)</th>
                            <th className="py-3 px-4 text-center">Autorisées (Aut)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recapStats.map(stat => (
                            <tr key={stat.id}>
                                <td className="py-3 px-4 font-medium text-gray-900 break-words">{stat.name}</td>
                                <td className="py-3 px-4 text-center font-semibold text-red-600">{stat.A > 0 ? `${(stat.A * SESSION_DURATION).toFixed(2)}h (${stat.A})` : '0'}</td>
                                <td className="py-3 px-4 text-center font-semibold">{stat.R}</td>
                                <td className="py-3 px-4 text-center text-orange-600">{stat.AJ > 0 ? `${(stat.AJ * SESSION_DURATION).toFixed(2)}h (${stat.AJ})` : '0'}</td>
                                <td className="py-3 px-4 text-center text-blue-600">{stat.Aut > 0 ? `${(stat.Aut * SESSION_DURATION).toFixed(2)}h (${stat.Aut})` : '0'}</td>
                            </tr>
                        ))}
                        {recapStats.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-4">Aucune donnée pour ce groupe ce mois-ci.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- RECAPITULATIF MODAL for History View ---
const RecapitulatifModal = ({ isOpen, onClose, allYearsData, recapData, establishmentInfo }: {
    isOpen: boolean;
    onClose: () => void;
    allYearsData: ArchivedData & { [key: string]: TrainingData };
    recapData: RecapDataType | null;
    establishmentInfo: { name: string, logo: string | null };
}) => {
    if (!isOpen || !recapData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl m-4 max-w-4xl w-full transform transition-all animate-fade-in-down">
                <div className="p-4 border-b">
                    <button onClick={onClose} className="float-right text-gray-400 hover:text-gray-600">
                        <CancelIcon />
                    </button>
                </div>
                <RecapitulatifContent allYearsData={allYearsData} recapData={recapData} establishmentInfo={establishmentInfo} />
                 <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- HISTORY VIEW ---
const HistoryView = ({ allYearsData, establishmentInfo, setAllData, setArchivedData, setCurrentTrainingYear, currentTrainingYear }: { 
    allYearsData: ArchivedData & { [key: string]: TrainingData },
    establishmentInfo: { name: string, logo: string | null },
    setAllData: React.Dispatch<React.SetStateAction<TrainingData>>,
    setArchivedData: React.Dispatch<React.SetStateAction<ArchivedData>>,
    setCurrentTrainingYear: (year: string) => void,
    currentTrainingYear: string,
}) => {
    const sortedYears = React.useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    const [filters, setFilters] = React.useState({ year: sortedYears[0] || '', month: '' });

    const [expandedMonths, setExpandedMonths] = React.useState<Record<string, boolean>>({});
    const [isRecapModalOpen, setIsRecapModalOpen] = React.useState(false);
    const [recapData, setRecapData] = React.useState<RecapDataType | null>(null);
    const [pdfExportData, setPdfExportData] = React.useState<RecapDataType | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState<string | null>(null); // holds the key of the group being exported
    const [confirmModal, setConfirmModal] = React.useState<{isOpen: boolean, year?: string}>({isOpen: false});
    
    const availableMonthsForSelectedYear = React.useMemo(() => {
        const yearData = allYearsData[filters.year];
        if (!yearData) return [];
        return Array.from(
            new Set(yearData.trainees.flatMap(t => Object.keys(t.absences).map(d => d.substring(0, 7))))
        ).sort((a, b) => b.localeCompare(a));
    }, [allYearsData, filters.year]);

    React.useEffect(() => {
        // When year filter changes, reset the month filter
        setFilters(prev => ({ ...prev, month: '' }));
    }, [filters.year]);

    React.useEffect(() => {
        if (!pdfExportData) return;

        // Give React a moment to render the hidden component
        const timer = setTimeout(() => {
            const source = document.getElementById('pdf-export-source');
            const { jsPDF } = window.jspdf;

            if (source) {
                window.html2canvas(source, { scale: 2, useCORS: true }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    const ratio = canvasWidth / canvasHeight;

                    let width = pdfWidth - 40; // Margin
                    let height = width / ratio;
                    
                    if (height > pdfHeight - 40) {
                        height = pdfHeight - 40;
                        width = height * ratio;
                    }
            
                    const x = (pdfWidth - width) / 2;
                    const y = 20; // Top margin

                    pdf.addImage(imgData, 'PNG', x, y, width, height);
                    pdf.save(`Recapitulatif_${pdfExportData.groupName}_${pdfExportData.monthValue}.pdf`);
                }).finally(() => {
                    setPdfExportData(null);
                    setIsGeneratingPdf(null);
                });
            } else {
                 setPdfExportData(null);
                 setIsGeneratingPdf(null);
            }
        }, 500);

        return () => clearTimeout(timer);

    }, [pdfExportData]);


    const toggleMonth = (monthKey: string) => setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
    
    const handleShowRecap = (year: string, monthValue: string, groupId: string, groupName: string) => {
        setRecapData({ year, monthValue, groupId, groupName });
        setIsRecapModalOpen(true);
    };

    const handleExportPdf = (year: string, monthValue: string, groupId: string, groupName: string) => {
        setIsGeneratingPdf(`${monthValue}-${groupId}`);
        setPdfExportData({ year, monthValue, groupId, groupName });
    };

    const handleRestoreClick = (yearToRestore: string) => {
        setConfirmModal({ isOpen: true, year: yearToRestore });
    };

    const confirmRestore = () => {
        const yearToRestore = confirmModal.year;
        if (!yearToRestore) return;

        const dataToRestore = allYearsData[yearToRestore];
        if (!dataToRestore) {
            console.error("Data for year to restore not found:", yearToRestore);
            setConfirmModal({ isOpen: false });
            return;
        }

        setAllData(prevAllData => {
            // De-duplicate levels and filieres by ID to avoid conflicts
            const mergedLevels = [...prevAllData.levels];
            const existingLevelIds = new Set(mergedLevels.map(l => l.id));
            dataToRestore.levels.forEach(level => {
                if (!existingLevelIds.has(level.id)) {
                    mergedLevels.push(level);
                    existingLevelIds.add(level.id);
                }
            });

            const mergedFilieres = [...prevAllData.filieres];
            const existingFiliereIds = new Set(mergedFilieres.map(f => f.id));
            dataToRestore.filieres.forEach(filiere => {
                if (!existingFiliereIds.has(filiere.id)) {
                    mergedFilieres.push(filiere);
                    existingFiliereIds.add(filiere.id);
                }
            });

            return {
                levels: mergedLevels,
                filieres: mergedFilieres,
                groups: [...prevAllData.groups, ...dataToRestore.groups],
                trainees: [...prevAllData.trainees, ...dataToRestore.trainees],
            };
        });

        setArchivedData(prevArchived => {
            const newArchived = { ...prevArchived };
            delete newArchived[yearToRestore];
            return newArchived;
        });
        
        setCurrentTrainingYear(yearToRestore);
        
        alert(`L'année ${yearToRestore} a été restaurée avec succès et définie comme année active.`);
        setConfirmModal({ isOpen: false });
    };


    const yearToDisplay = filters.year;
    const yearData = allYearsData[yearToDisplay];
    const monthsToDisplay = filters.month
        ? availableMonthsForSelectedYear.filter(m => m === filters.month)
        : availableMonthsForSelectedYear;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Historique des Saisies</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label htmlFor="history-year-filter" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation</label>
                    <select
                        id="history-year-filter"
                        value={filters.year}
                        onChange={e => setFilters({ ...filters, year: e.target.value })}
                        className={inputStyle}
                    >
                        {sortedYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="history-month-filter" className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                    <select
                        id="history-month-filter"
                        value={filters.month}
                        onChange={e => setFilters({ ...filters, month: e.target.value })}
                        className={inputStyle}
                        disabled={!filters.year}
                    >
                        <option value="">Tous les mois</option>
                        {availableMonthsForSelectedYear.map(m => <option key={m} value={m}>{formatMonthName(m)}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                {!yearData ? (
                    <p className="text-center text-gray-500 py-8">Aucune donnée pour l'année sélectionnée.</p>
                ) : (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                        <div className="w-full flex justify-between items-center p-4 bg-gray-100 text-gray-800 font-bold text-lg">
                            <span>Année de formation {yearToDisplay}</span>
                             {yearToDisplay !== currentTrainingYear && (
                                <button 
                                    onClick={() => handleRestoreClick(yearToDisplay)}
                                    className="flex items-center text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-3 rounded-md transition-colors shadow-sm"
                                    title={`Restaurer l'année ${yearToDisplay}`}
                                >
                                    <UploadIcon />
                                    <span className="ml-1.5 hidden sm:inline">Restaurer</span>
                                </button>
                            )}
                        </div>
                        <div className="p-2 sm:p-4 space-y-2 bg-white">
                            {monthsToDisplay.length > 0 ? monthsToDisplay.map(monthValue => {
                                const monthKey = `${yearToDisplay}-${monthValue}`;
                                const isMonthExpanded = expandedMonths[monthKey] ?? true;
                                
                                const groupsInMonth = yearData.groups
                                    .filter(g => yearData.trainees.some(t => t.groupId === g.id && Object.keys(t.absences).some(d => d.startsWith(monthValue))))
                                    .map(group => {
                                        const lastSaisieTimestamp = Math.max(0, ...yearData.trainees
                                            .filter(t => t.groupId === group.id)
                                            .flatMap(t => Object.keys(t.absences)
                                                .filter(d => d.startsWith(monthValue))
                                                .map(d => new Date(d).getTime())
                                            )
                                        );
                                        return { group, lastSaisie: new Date(lastSaisieTimestamp) };
                                    })
                                    .sort((a, b) => b.lastSaisie.getTime() - a.lastSaisie.getTime());

                                if (groupsInMonth.length === 0) return null;

                                return (
                                    <div key={monthKey} className="rounded-md overflow-hidden border border-gray-200">
                                        <button onClick={() => toggleMonth(monthKey)} className="w-full flex justify-between items-center p-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors">
                                            <span>{formatMonthName(monthValue)}</span>
                                            <span className={`transform transition-transform ${isMonthExpanded ? 'rotate-180' : ''}`}>{isMonthExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
                                        </button>
                                        {isMonthExpanded && (
                                            <div className="p-2 sm:p-4 text-gray-700 space-y-2">
                                                <div className="hidden sm:grid grid-cols-3 gap-4 text-xs font-bold uppercase text-gray-500 pb-2 border-b border-gray-200">
                                                    <span>Groupe</span>
                                                    <span className="text-center">Dernière Saisie</span>
                                                    <span className="text-right">Actions</span>
                                                </div>
                                                {groupsInMonth.map(({ group, lastSaisie }) => {
                                                    return (
                                                        <div key={group.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center p-2 rounded-md hover:bg-gray-50">
                                                            <div className="font-bold text-gray-900"><span className="sm:hidden text-gray-500 text-xs uppercase">Groupe: </span>{group.name}</div>
                                                            <div className="text-sm text-center whitespace-nowrap"><span className="sm:hidden text-gray-500 text-xs uppercase">Dernière Saisie: </span>{lastSaisie.getTime() > 0 ? lastSaisie.toLocaleDateString('fr-FR') : 'N/A'}</div>
                                                            <div className="flex justify-start sm:justify-end items-center space-x-2">
                                                                <button onClick={() => handleShowRecap(yearToDisplay, monthValue, group.id, group.name)} className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors shadow-sm">
                                                                    <ClipboardListIcon/> <span className="ml-1.5 hidden lg:inline">Récapitulatif</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleExportPdf(yearToDisplay, monthValue, group.id, group.name)} 
                                                                    disabled={isGeneratingPdf === `${monthValue}-${group.id}`}
                                                                    className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-wait"
                                                                >
                                                                    <PrinterIcon/> <span className="ml-1.5 hidden lg:inline">{isGeneratingPdf === `${monthValue}-${group.id}` ? 'Export...' : 'Exporter PDF'}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : <p className="text-center text-gray-500 p-4">Aucune donnée de saisie pour cette période.</p>}
                        </div>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmRestore}
                title="Confirmer la Restauration"
            >
                <p>
                    Êtes-vous sûr de vouloir restaurer l'année <span className="font-bold">{confirmModal.year}</span> ?
                </p>
                <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
                    Cette action réintégrera toutes les données de l'année (stagiaires, absences, etc.) dans les données actives et la définira comme l'année de travail actuelle.
                </p>
            </ConfirmationModal>
            <RecapitulatifModal 
                isOpen={isRecapModalOpen}
                onClose={() => setIsRecapModalOpen(false)}
                allYearsData={allYearsData}
                recapData={recapData}
                establishmentInfo={establishmentInfo}
            />
            {pdfExportData && (
                 <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                    <div id="pdf-export-source" className="w-[800px]">
                        <RecapitulatifContent allYearsData={allYearsData} recapData={pdfExportData} establishmentInfo={establishmentInfo} />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ADMIN VIEW ---
const AdminView = ({ users, setUsers }: { users: any[], setUsers: (users: any[]) => void }) => {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const assistants = users.filter(u => u.role === 'assistant');

    const handleAddAssistant = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (users.some(u => u.email === email)) {
            setError("Un utilisateur avec cet email existe déjà.");
            return;
        }

        const newAssistant = { name, email, password, role: 'assistant' };
        setUsers([...users, newAssistant]);

        // Reset form
        setName('');
        setEmail('');
        setPassword('');
    };

    const handleDeleteAssistant = (emailToDelete: string) => {
        if(window.confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur assistant ${emailToDelete} ?`)) {
            setUsers(users.filter(u => u.email !== emailToDelete));
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2"><AdminIcon/> Gestion des Administrateurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Ajouter un Admin Assistant</h3>
                    <form onSubmit={handleAddAssistant} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputStyle} required />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            Créer le compte
                        </button>
                    </form>
                </div>
                {/* List Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Liste des Admins Assistants</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {assistants.length > 0 ? assistants.map(assistant => (
                            <div key={assistant.email} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                <div>
                                    <p className="font-semibold text-gray-800">{assistant.name}</p>
                                    <p className="text-sm text-gray-500">{assistant.email}</p>
                                </div>
                                <button onClick={() => handleDeleteAssistant(assistant.email)} className="text-red-500 hover:text-red-700" title="Supprimer">
                                    <DeleteIcon/>
                                </button>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">Aucun administrateur assistant créé.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default App;