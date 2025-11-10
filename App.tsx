// FIX: Corrected the React import statement to properly import React and its hooks. This resolves all subsequent "Cannot find name" errors in the file.
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DAYS, SESSIONS, SESSION_DURATION, RETARD_VALUE, ABSENCE_TYPES } from './constants';
import type { Trainee, Group, Filiere, Level, TrainingData, ArchivedData, AbsenceType, IncidentComportement, Profile, Establishment, Absence } from './types';
import { Auth } from './Auth';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';


// Add external library types to window for Excel parsing and PDF generation
declare global {
    interface Window {
        XLSX: any;
        html2canvas: any;
        jspdf: any;
    }
}


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

const calculateTraineeAbsenceStats = (trainee: Trainee, allAbsences: Absence[], selectedMonth: string) => {
    let retardCount = 0;
    let absenceHours = 0; // Unjustified for sanctions ('A')

    const traineeAbsences = allAbsences.filter(a => a.stagiaire_id === trainee.id);

    for (const absence of traineeAbsences) {
        if (trainee.dropoutDate && absence.date_absence >= trainee.dropoutDate) continue;
        if (!selectedMonth || absence.date_absence.substring(0, 7) === selectedMonth) {
            if (absence.type === 'A') absenceHours += SESSION_DURATION;
            else if (absence.type === 'R') retardCount++;
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

const calculateTraineeBehaviorStats = (trainee: Trainee, allIncidents: IncidentComportement[]) => {
    const incidents = allIncidents.filter(i => i.stagiaire_id === trainee.id);
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
    if (!year || !year.includes('-')) return [];
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
  // --- STATE MANAGEMENT ---
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [establishmentInfo, setEstablishmentInfo] = useState<{name: string, logo: string | null}>({
    name: 'Mon Établissement de Formation',
    logo: null,
  });

  // All data from Supabase
  const [allData, setAllData] = useState<TrainingData>({
    levels: [], filieres: [], groups: [], trainees: [], absences: [], incidents: []
  });

  const [archivedData, setArchivedData] = useStateWithLocalStorage('app_archived_data', {}); // Archiving can remain in localStorage for simplicity for now.
  const [currentTrainingYear, setCurrentTrainingYear] = useStateWithLocalStorage('app_current_training_year', '2023-2024');
  
  // --- Session and Profile Handling ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Check for profile
          let { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!userProfile) {
            // If no profile, check if a superAdmin already exists
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'superAdmin');
            const isFirstAdmin = (!admins || admins.length === 0);

            if (session.user.app_metadata.provider === 'google' && isFirstAdmin) {
                const { data: newProfile, error } = await supabase.from('profiles').insert({
                    id: session.user.id,
                    email: session.user.email!,
                    nom_complet: session.user.user_metadata.full_name,
                    avatar_url: session.user.user_metadata.avatar_url,
                    role: 'superAdmin'
                }).select().single();
                if (error) console.error("Error creating superAdmin profile:", error);
                else userProfile = newProfile;
            }
          }
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

    // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!profile) return;
    
    try {
        const [
            levels, filieres, groups, trainees, absences, incidents, establishment
        ] = await Promise.all([
            supabase.from('niveaux').select('*'),
            supabase.from('filieres').select('*'),
            supabase.from('groupes').select('*'),
            supabase.from('stagiaires').select('*'),
            supabase.from('absences').select('*'),
            supabase.from('incidents_comportement').select('*'),
            profile.role === 'superAdmin' ? supabase.from('establishments').select('*').eq('sup_admin_id', profile.id).single() : Promise.resolve({data: null})
        ]);

        setAllData({
            levels: levels.data || [],
            filieres: filieres.data || [],
            groups: groups.data || [],
            trainees: trainees.data?.map(t => ({...t, firstName: t.prenom, lastName: t.nom, birthDate: t.date_naissance, groupId: t.groupe_id, dropoutDate: t.date_deperdition })) || [],
            absences: absences.data || [],
            incidents: incidents.data || []
        });
        
        if (establishment.data) {
            setEstablishmentInfo({ name: establishment.data.name, logo: establishment.data.logo_url });
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
  }, [profile]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // --- MEMOIZED DERIVED STATE ---
  const trainingYears = useMemo(() => {
    const years = new Set([currentTrainingYear, ...Object.keys(archivedData)]);
    allData.groups.forEach((group: Group) => years.add(group.trainingYear));
    
    // FIX: Filter out non-string values from the set before sorting to prevent runtime errors
    // with data loaded from localStorage that might not match the expected types.
    const validYears = Array.from(years).filter(y => typeof y === 'string');
    return validYears.sort((a, b) => b.localeCompare(a));
  }, [currentTrainingYear, archivedData, allData.groups]);

  const currentYearData = useMemo(() => {
    const currentGroups = allData.groups.filter((g: Group) => g.trainingYear === currentTrainingYear);
    const currentGroupIds = new Set(currentGroups.map(g => g.id));
    return {
      levels: allData.levels,
      filieres: allData.filieres,
      groups: currentGroups,
      trainees: allData.trainees.filter((t: Trainee) => currentGroupIds.has(t.groupId)),
      absences: allData.absences.filter(a => currentGroupIds.has(allData.trainees.find(t => t.id === a.stagiaire_id)?.groupId ?? '')),
      incidents: allData.incidents.filter(i => currentGroupIds.has(allData.trainees.find(t => t.id === i.stagiaire_id)?.groupId ?? '')),
    };
  }, [allData, currentTrainingYear]);
    
  const allYearsData = useMemo(() => ({...archivedData, [currentTrainingYear]: currentYearData}), [archivedData, currentTrainingYear, currentYearData]);

  // --- "REAL-TIME" SYNC EFFECT ---
  useEffect(() => {
    const syncState = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        const newValue = JSON.parse(e.newValue);
        switch (e.key) {
          // LocalStorage sync is only kept for these two for simplicity.
          case 'app_archived_data':
            setArchivedData(newValue);
            break;
          case 'app_current_training_year':
            setCurrentTrainingYear(newValue);
            break;
        }
      } catch (error) {
        console.error("Failed to parse storage update:", error);
      }
    };

    window.addEventListener('storage', syncState);
    return () => window.removeEventListener('storage', syncState);
  }, []); // Dependencies are stable setters from useState, so this runs once.

  // --- HANDLERS ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  // --- RENDER LOGIC ---
  if (!session || !profile) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        establishmentInfo={establishmentInfo}
        user={profile}
        onLogout={handleLogout}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {activeTab === 'dashboard' && <DashboardView allYearsData={allYearsData} allData={allData} />}
        {activeTab === 'saisie' && <AbsenceSaisieView data={currentYearData} setAllData={setAllData} availableYears={trainingYears} currentYear={currentTrainingYear} setCurrentYear={setCurrentTrainingYear} refreshData={fetchData} />}
        {activeTab === 'assiduite' && <AssiduiteView allYearsData={allYearsData} allData={allData} />}
        {activeTab === 'comportement' && <ComportementView allYearsData={allYearsData} setAllData={setAllData} setArchivedData={setArchivedData} currentTrainingYear={currentTrainingYear} allData={allData} refreshData={fetchData} />}
        {activeTab === 'donnees_personnelles' && <DonneesPersonnellesView allYearsData={allYearsData} allData={allData} establishmentInfo={establishmentInfo} />}
        {activeTab === 'historique' && <HistoryView allYearsData={allYearsData} establishmentInfo={establishmentInfo} setAllData={setAllData} setArchivedData={setArchivedData} setCurrentTrainingYear={setCurrentTrainingYear} currentTrainingYear={currentTrainingYear} />}
        {activeTab === 'donnees' && <DataView allData={allData} setAllData={setAllData} trainingYears={trainingYears} archived={archivedData} setArchived={setArchivedData} currentYear={currentTrainingYear} setCurrentTrainingYear={setCurrentTrainingYear} establishmentInfo={establishmentInfo} setEstablishmentInfo={setEstablishmentInfo} currentUser={profile} refreshData={fetchData} />}
        {activeTab === 'admin' && profile.role === 'superAdmin' && <AdminView users={[]} setUsers={() => {}} />}
      </main>
    </div>
  );
}

// Custom hook for localStorage (kept for archiving and current year)
const useStateWithLocalStorage = (storageKey: string, defaultValue: any) => {
    const [value, setValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${storageKey}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key “${storageKey}”:`, error);
        }
    }, [storageKey, value]);

    return [value, setValue];
};


// --- HEADER & NAVIGATION ---
const Header = ({ activeTab, setActiveTab, establishmentInfo, user, onLogout }: {
    activeTab: string; 
    setActiveTab: (tab: string) => void;
    establishmentInfo: { name: string, logo: string | null };
    user: Profile;
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
            <h1 className="text-2xl sm:text-3xl font-bold">E-Presence - Solution Digitale</h1>
            <div className="flex items-center gap-2 mt-1">
                {establishmentInfo.logo && <img src={establishmentInfo.logo} alt="Logo de l'établissement" className="h-8 w-auto rounded" />}
                <h2 className="text-base sm:text-lg font-semibold text-blue-200">{establishmentInfo.name}</h2>
            </div>
        </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="font-semibold">{user.nom_complet}</div>
                <div className="text-xs text-blue-300">{user.email}</div>
            </div>
             {user.avatar_url ? (
                <img src={user.avatar_url} alt="User" className="h-10 w-10 rounded-full" />
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
const AbsenceSaisieView = ({ data, setAllData, availableYears, currentYear, setCurrentYear, refreshData }: {
    data: TrainingData, 
    setAllData: React.Dispatch<React.SetStateAction<any>>, // Simplified for prop-drilling
    availableYears: string[], 
    currentYear: string, 
    setCurrentYear: (year: string) => void,
    refreshData: () => void
}) => {
    const [saisieFilters, setSaisieFilters] = useState({ groupId: '', month: '', week: ''});
    const [saveStatus, setSaveStatus] = useState('');
    const { groupId: selectedGroupId, month: selectedMonth, week: selectedWeek } = saisieFilters;

    const [isDropoutModalOpen, setIsDropoutModalOpen] = useState(false);
    const [dropoutCandidate, setDropoutCandidate] = useState<{traineeId: string; date: string; sessionId: string;} | null>(null);

    const academicMonths = useMemo(() => getAcademicYearMonths(currentYear), [currentYear]);
    const weeks = useMemo(() => getWeeksForMonth(selectedMonth), [selectedMonth]);
    const sortedGroups = useMemo(() => [...data.groups].sort((a, b) => a.name.localeCompare(b.name)), [data.groups]);
    
    // Initialize filters on first load or when data/year changes
    useEffect(() => {
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
    
     useEffect(() => {
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
    
    useEffect(() => {
        const currentWeeks = getWeeksForMonth(selectedMonth);
        const weekIsValid = currentWeeks.some(w => w.toISOString() === selectedWeek);

        if (selectedMonth && !weekIsValid && currentWeeks.length > 0) {
            setSaisieFilters(prev => ({ ...prev, week: currentWeeks[0].toISOString() }));
        } else if (currentWeeks.length === 0) {
            setSaisieFilters(prev => ({...prev, week: ''}));
        }

    }, [selectedGroupId, selectedMonth, selectedWeek]);


    const handleCancelDropout = () => {
        setIsDropoutModalOpen(false);
        setDropoutCandidate(null);
    };

    const handleConfirmDropout = async () => {
        if (!dropoutCandidate) return;

        const { traineeId, date } = dropoutCandidate;
        const { error } = await supabase.from('stagiaires').update({ date_deperdition: date }).eq('id', traineeId);
        
        if(error) {
            console.error("Error setting dropout date:", error);
            alert("Erreur lors de la mise à jour.");
        } else {
            // Also add 'D' absences
            const trainee = data.trainees.find(t => t.id === traineeId);
            const yearEndStr = currentYear.split('-')[1];
            const yearEnd = new Date(parseInt(yearEndStr), 6, 31); // July 31st
            let currentDate = new Date(date);
            const absencesToInsert = [];

            while(currentDate <= yearEnd) {
                const currentDateStr = formatDate(currentDate);
                SESSIONS.forEach(session => {
                    absencesToInsert.push({
                        stagiaire_id: traineeId,
                        date_absence: currentDateStr,
                        session_id: session.id,
                        type: 'D'
                    });
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            await supabase.from('absences').upsert(absencesToInsert, { onConflict: 'stagiaire_id,date_absence,session_id' });
            
            refreshData(); // Refresh all data
        }

        setIsDropoutModalOpen(false);
        setDropoutCandidate(null);
    };

    const handleAbsenceClick = async (traineeId: string, date: string, sessionId: string) => {
        const trainee = data.trainees.find(t => t.id === traineeId);
        if (!trainee || trainee.dropoutDate) return;

        const existingAbsence = data.absences.find(a => a.stagiaire_id === traineeId && a.date_absence === date && a.session_id === sessionId);
        const currentStatus = existingAbsence?.type;
        const currentIndex = currentStatus ? ABSENCE_TYPES.indexOf(currentStatus) : -1;
        const nextIndex = (currentIndex + 1) % (ABSENCE_TYPES.length + 1);
        let nextStatus: AbsenceType | undefined = undefined;
        if (nextIndex < ABSENCE_TYPES.length) {
            nextStatus = ABSENCE_TYPES[nextIndex];
        }

        if (nextStatus === 'D') {
            setDropoutCandidate({ traineeId, date, sessionId });
            setIsDropoutModalOpen(true);
            return;
        }

        if (nextStatus) {
            // Upsert (insert or update)
            await supabase.from('absences').upsert({
                id: existingAbsence?.id, // will be ignored on insert
                stagiaire_id: traineeId,
                date_absence: date,
                session_id: sessionId,
                type: nextStatus,
            }, { onConflict: 'stagiaire_id,date_absence,session_id' });
        } else if (existingAbsence) {
            // Delete
            await supabase.from('absences').delete().eq('id', existingAbsence.id);
        }
        
        refreshData();
    };
    
    const filteredTrainees = useMemo(() => 
        selectedGroupId ? [...data.trainees]
            .filter(t => t.groupId === selectedGroupId)
            .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)) : [],
        [data.trainees, selectedGroupId]
    );

    const weekDates = useMemo(() => {
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
        setSaveStatus('Données synchronisées avec la base de données !');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const dropoutCandidateTrainee = useMemo(() => {
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
                                            const statusToShow = data.absences.find(a => a.stagiaire_id === trainee.id && a.date_absence === dateString && a.session_id === session.id)?.type;
                                                                                        
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
const DashboardView = ({ allYearsData, allData }: { allYearsData: ArchivedData & { [key: string]: TrainingData }, allData: TrainingData }) => {
    const allYears = useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    const [selectedYear, setSelectedYear] = useState(allYears[0] || '');
    
    const yearData = useMemo(() => {
        const currentGroups = allData.groups.filter(g => g.trainingYear === selectedYear);
        const currentGroupIds = new Set(currentGroups.map(g => g.id));
        return {
          levels: allData.levels,
          filieres: allData.filieres,
          groups: currentGroups,
          trainees: allData.trainees.filter(t => currentGroupIds.has(t.groupId)),
          absences: allData.absences.filter(a => currentGroupIds.has(allData.trainees.find(t => t.id === a.stagiaire_id)?.groupId ?? '')),
          incidents: allData.incidents
        }
    }, [allData, selectedYear]);

    const academicMonths = useMemo(() => getAcademicYearMonths(selectedYear), [selectedYear]);

    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');

    const groupOptions = useMemo(() => yearData?.groups.map(g => ({id: g.id, name: g.name})).sort((a,b) => a.name.localeCompare(b.name)) || [], [yearData]);
    const monthOptions = useMemo(() => academicMonths.map(m => ({id: m.value, name: m.name})) || [], [academicMonths]);
    
    const traineesForSelectedGroups = useMemo(() => {
        if (!yearData) return [];
        if (!selectedGroupId) return yearData.trainees;
        return yearData.trainees.filter(t => t.groupId === selectedGroupId);
    }, [yearData, selectedGroupId]);

    const traineeOptions = useMemo(() => {
        return traineesForSelectedGroups
            .map(t => ({ id: t.id, name: `${t.lastName.toUpperCase()} ${t.firstName}` }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [traineesForSelectedGroups]);
    
    const filteredTrainees = useMemo(() => {
        if (!selectedTraineeId) return traineesForSelectedGroups;
        return traineesForSelectedGroups.filter(t => t.id === selectedTraineeId);
    }, [traineesForSelectedGroups, selectedTraineeId]);
    
    const dropoutTrainees = useMemo(() => filteredTrainees.filter(t => t.dropoutDate), [filteredTrainees]);

    const selectedTrainee = useMemo(() => {
        return (selectedTraineeId && filteredTrainees.length === 1) ? filteredTrainees[0] : null;
    }, [selectedTraineeId, filteredTrainees]);
    
    const dropoutMessage = useMemo(() => {
        return selectedTrainee?.dropoutDate 
            ? `Stagiaire en déperdition depuis le ${new Date(selectedTrainee.dropoutDate).toLocaleDateString('fr-FR')}`
            : undefined;
    }, [selectedTrainee]);


    const traineeStats = useMemo(() => {
        return filteredTrainees.map(trainee => {
            let totalHours = 0;
            const traineeAbsences = yearData.absences.filter(a => a.stagiaire_id === trainee.id);

            for (const absence of traineeAbsences) {
                // For stats, we ignore absences after dropout date
                if(trainee.dropoutDate && absence.date_absence >= trainee.dropoutDate) continue;

                if (!selectedMonth || absence.date_absence.substring(0, 7) === selectedMonth) {
                    const type = absence.type;
                    if (type === 'A' || type === 'AJ' || type === 'Aut') totalHours += SESSION_DURATION;
                    else if (type === 'R') totalHours += RETARD_VALUE;
                }
            }
            const sanctionInfo = calculateTraineeAbsenceStats(trainee, yearData.absences, selectedMonth);
            return { 
                id: trainee.id, 
                name: `${trainee.lastName.toUpperCase()} ${trainee.firstName}`, 
                hours: totalHours,
                sanction: sanctionInfo.sanction
            };
        }).sort((a, b) => b.hours - a.hours);
    }, [filteredTrainees, selectedMonth, yearData.absences]);

    const excludedTrainees = useMemo(() => 
        traineeStats.filter(t => t.sanction?.sanction === 'Exclusion définitive'), 
        [traineeStats]
    );

    const alertedTrainees = useMemo(() => 
        traineeStats.filter(t => t.sanction && t.sanction.minEquivalentRetards >= 20 && t.sanction.minEquivalentRetards < 41), 
        [traineeStats]
    );

    const globalStats = useMemo(() => {
        const totalAbsenceHours = traineeStats.reduce((sum, trainee) => sum + trainee.hours, 0);
        const absenceTypeCounts: { [key in AbsenceType]: number } = { A: 0, AJ: 0, R: 0, Aut: 0, D: 0 };
        const monthlyAbsenceHours: { [month: string]: number } = {};
        academicMonths.forEach(m => { monthlyAbsenceHours[m.value] = 0; });
        
        const relevantAbsences = yearData.absences.filter(absence => {
            const trainee = filteredTrainees.find(t => t.id === absence.stagiaire_id);
            if (!trainee) return false;
            if (trainee.dropoutDate && absence.date_absence >= trainee.dropoutDate) return false;
            if (selectedMonth && !absence.date_absence.startsWith(selectedMonth)) return false;
            return true;
        });
        
        relevantAbsences.forEach(absence => {
            const month = absence.date_absence.substring(0, 7);
            if (absenceTypeCounts[absence.type] !== undefined) absenceTypeCounts[absence.type]++;
            if(monthlyAbsenceHours[month] !== undefined) {
                if (absence.type === 'A' || absence.type === 'AJ' || absence.type === 'Aut') monthlyAbsenceHours[month] += SESSION_DURATION;
                else if (absence.type === 'R') monthlyAbsenceHours[month] += RETARD_VALUE;
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
        return <div className="bg-white p-6 rounded-lg shadow-lg text-center"><p className="text-gray-600">Chargement des données...</p></div>;
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
const AssiduiteView = ({ allYearsData, allData }: { allYearsData: ArchivedData & { [key: string]: TrainingData }, allData: TrainingData }) => {
    // ... This component will be adapted similarly to DashboardView, using allData.
    return <div className="text-center p-8 bg-white rounded-lg shadow">Assiduite View Placeholder - Refactoring in progress.</div>;
};

// --- BEHAVIOR MODAL ---
const BehaviorModal = ({ isOpen, onClose, onSave, trainee, incident, setIncident }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    trainee: Trainee | null;
    incident: Omit<IncidentComportement, 'id' | 'stagiaire_id' | 'created_at'>;
    setIncident: React.Dispatch<React.SetStateAction<Omit<IncidentComportement, 'id' | 'stagiaire_id' | 'created_at'>>>;
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
                                value={incident.date_incident}
                                onChange={e => setIncident(prev => ({ ...prev, date_incident: e.target.value }))}
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
const ComportementView = ({ allYearsData, setAllData, setArchivedData, currentTrainingYear, allData, refreshData }: { 
    allYearsData: ArchivedData & { [key: string]: TrainingData }, 
    setAllData: any, setArchivedData: any, currentTrainingYear: string,
    allData: TrainingData,
    refreshData: () => void
}) => {
    // ... This component needs full refactoring
    return <div className="text-center p-8 bg-white rounded-lg shadow">Comportement View Placeholder - Refactoring in progress.</div>;
};


// --- FICHE INDIVIDUELLE COMPONENT ---
const FicheIndividuelle = ({ trainee, yearData, allData, academicYear, establishmentInfo }: { 
    trainee: Trainee, 
    yearData: TrainingData, 
    allData: TrainingData,
    academicYear: string,
    establishmentInfo: { name: string, logo: string | null }
}) => {
    // ... This component needs full refactoring
    return <div>Fiche Individuelle Placeholder</div>;
}

// --- DONNEES PERSONNELLES VIEW ---
const DonneesPersonnellesView = ({ allYearsData, allData, establishmentInfo }: { 
    allYearsData: ArchivedData & { [key: string]: TrainingData },
    allData: TrainingData,
    establishmentInfo: { name: string, logo: string | null }
}) => {
    // ... This component needs full refactoring
    return <div className="text-center p-8 bg-white rounded-lg shadow">Donnees Personnelles View Placeholder - Refactoring in progress.</div>;
};


// --- DATA VIEW / PARAMETRES ---
const DataView = ({ allData, setAllData, trainingYears, archived, setArchived, currentYear, setCurrentTrainingYear, establishmentInfo, setEstablishmentInfo, currentUser, refreshData }: { 
    allData: TrainingData, 
    setAllData: any, 
    trainingYears: string[], 
    archived: ArchivedData, 
    setArchived: any, 
    currentYear: string, 
    setCurrentTrainingYear: (year: string) => void,
    establishmentInfo: { name: string, logo: string | null },
    setEstablishmentInfo: any,
    currentUser: Profile,
    refreshData: () => void
}) => {
    // ... This component needs full refactoring
    return <div className="text-center p-8 bg-white rounded-lg shadow">Data View Placeholder - Refactoring in progress.</div>;
};


// --- HISTORY VIEW ---
const HistoryView = ({ allYearsData, establishmentInfo, setAllData, setArchivedData, setCurrentTrainingYear, currentTrainingYear }: { 
    allYearsData: ArchivedData & { [key: string]: TrainingData },
    establishmentInfo: { name: string, logo: string | null },
    setAllData: any,
    setArchivedData: any,
    setCurrentTrainingYear: (year: string) => void,
    currentTrainingYear: string,
}) => {
    // ... This component needs full refactoring
    return <div className="text-center p-8 bg-white rounded-lg shadow">History View Placeholder - Refactoring in progress.</div>;
};

// --- ADMIN VIEW ---
const AdminView = ({ users, setUsers }: { users: any[], setUsers: (users: any[]) => void }) => {
    // ... This component needs full refactoring
    return <div className="text-center p-8 bg-white rounded-lg shadow">Admin View Placeholder - Refactoring in progress.</div>;
};


export default App;
