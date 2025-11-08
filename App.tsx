// FIX: Corrected the React import statement to properly import React and its hooks. This resolves all subsequent "Cannot find name" errors in the file.
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { initialLevels, initialFilieres, initialGroups, initialTrainees, DAYS, SESSIONS, SESSION_DURATION, RETARD_VALUE, ABSENCE_TYPES } from './constants';
import type { Trainee, Group, Filiere, Level, TrainingData, ArchivedData, AbsenceType, BehaviorIncident } from './types';
import { supabaseClient } from './supabaseClient';
import Auth from './Auth';

// Add Supabase types to the global scope for session management
declare global {
    interface Window {
        XLSX: any;
        html2canvas: any;
        jspdf: any;
        supabase: any;
    }
}

// Manually define the Session type as it's not available from the importmap
type Session = {
    access_token: string;
    refresh_token?: string;
    user: {
        id: string;
        email?: string;
        app_metadata: { provider?: string };
        user_metadata: { role?: 'super_admin' | 'assistant_admin' };
    };
    // other session properties
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
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5.414l7.293 7.293a1 1 0 001.414-1.414L5.414 4H15a1 1 0 100-2H4a1 1 0 00-1 1z" clipRule="evenodd" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 002.166 5.023a12.033 12.033 0 00-1.22 6.223 12.033 12.033 0 001.22 6.223A11.954 11.954 0 0010 18.056a11.954 11.954 0 007.834-2.587 12.033 12.033 0 001.22-6.223 12.033 12.033 0 00-1.22-6.223A11.954 11.954 0 0010 1.944zM9 12l-2-2 1.41-1.41L9 9.17l4.59-4.59L15 6l-6 6z" clipRule="evenodd" /></svg>;


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
    
    for (const rule of [...BEHAVIOR_SANCTION_THRESHOLDS].sort((a,b) => b.minIncidents - a.minIncidents)) {
        if (incidentCount >= rule.minIncidents) {
            return { incidentCount, sanction: rule };
        }
    }

    return { incidentCount, sanction: null };
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

// --- ALERT MODAL COMPONENT ---
type AlertModalType = 'success' | 'error' | 'confirm' | 'info';
type AlertModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    type: AlertModalType;
    children: React.ReactNode;
};

const AlertModal = ({ isOpen, onClose, onConfirm, title, type, children }: AlertModalProps) => {
    if (!isOpen) return null;

    const theme = {
        success: { iconColor: 'text-green-500', buttonBg: 'bg-green-600', buttonHoverBg: 'hover:bg-green-700' },
        error: { iconColor: 'text-red-500', buttonBg: 'bg-red-600', buttonHoverBg: 'hover:bg-red-700' },
        confirm: { iconColor: 'text-yellow-500', buttonBg: 'bg-red-600', buttonHoverBg: 'hover:bg-red-700' },
        info: { iconColor: 'text-blue-500', buttonBg: 'bg-blue-600', buttonHoverBg: 'hover:bg-blue-700' },
    };

    const currentTheme = theme[type];

    const Icon = () => {
        switch(type) {
            case 'success': return <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${currentTheme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'error': return <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${currentTheme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'confirm': return <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${currentTheme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
            default: return <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${currentTheme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
                <div className="flex flex-col items-center text-center">
                    <Icon />
                    <h3 className="text-xl font-bold text-gray-900 mt-4">{title}</h3>
                    <div className="mt-2 text-sm text-gray-600">
                        {children}
                    </div>
                </div>
                <div className={`mt-6 flex ${type === 'confirm' ? 'justify-between' : 'justify-center'} space-x-3`}>
                    {type === 'confirm' && (
                        <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold transition-colors">
                            Annuler
                        </button>
                    )}
                    <button 
                        onClick={onConfirm || onClose} 
                        className={`w-full px-4 py-2 text-white rounded-md font-semibold transition-colors ${currentTheme.buttonBg} ${currentTheme.buttonHoverBg}`}
                    >
                        {type === 'confirm' ? 'Confirmer' : 'OK'}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
            `}</style>
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

const Loader = () => (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-gray-700">Chargement de l'application...</p>
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (session && session.user.app_metadata.provider === 'google' && !session.user.user_metadata.role) {
            // New Google sign-in, automatically promote to super_admin if no role is set
            const { data, error } = await supabaseClient.auth.updateUser({
                data: { role: 'super_admin' }
            });
            if (error) console.error("Error setting super_admin role:", error);
            // Use the updated user from the response to update the session state
            setSession(data.user ? { ...session, user: data.user } : session);
        } else {
            setSession(session);
        }
        setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (!session) {
    return <Auth />;
  }

  return <MainApplication session={session} />;
}

type GlobalFilters = {
    year: string;
    groupId: string;
    month: string;
    week: string;
    traineeId: string;
};

type AlertState = {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type: AlertModalType;
    onConfirm?: () => void;
};

const MainApplication = ({ session }: { session: Session }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [allData, setAllData] = useState<TrainingData>({
    levels: initialLevels,
    filieres: initialFilieres,
    groups: initialGroups,
    trainees: initialTrainees,
  });

  const [archivedData, setArchivedData] = useState<ArchivedData>({});
  
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({
      year: '2023-2024',
      groupId: '',
      month: '',
      week: '',
      traineeId: ''
  });

  const [establishmentInfo, setEstablishmentInfo] = useState({
    name: 'Mon Établissement de Formation',
    logo: null as string | null, // Store as base64
  });
  
  const [alertState, setAlertState] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });

  const userRole = session.user.user_metadata.role || 'assistant_admin';
  const [tutorEmail, setTutorEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchContextData = async () => {
        const userId = session.user.id;
        
        // Logic to fetch tutor email for assistants
        if (userRole === 'assistant_admin') {
             const { data, error } = await supabaseClient
                .from('assistants')
                // This special syntax fetches the email from the related `auth.users` table
                .select('super_admin:created_by ( email )')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error("Error fetching tutor email:", error);
            } else if (data && data.super_admin) {
                setTutorEmail((data.super_admin as any).email);
            }
        }

        // Logic to fetch establishment info, which is needed by both roles
        let establishmentData: { name: string; logo_base64: string } | null = null;
        let establishmentUserId: string | null = null;

        if (userRole === 'super_admin') {
            establishmentUserId = userId;
        } else { // assistant_admin
            const { data: assistantData, error: assistantError } = await supabaseClient
                .from('assistants')
                .select('created_by')
                .eq('user_id', userId)
                .single();
            if (assistantError && assistantError.code !== 'PGRST116') console.error("Error fetching assistant info:", assistantError);
            else if(assistantData?.created_by) establishmentUserId = assistantData.created_by;
        }

        if(establishmentUserId){
             const { data, error } = await supabaseClient
                    .from('establishments')
                    .select('name, logo_base64')
                    .eq('user_id', establishmentUserId)
                    .single();
            if (error && error.code !== 'PGRST116') console.error("Error fetching establishment info:", error);
            else establishmentData = data;
        }
        
        if (establishmentData) {
            setEstablishmentInfo({
                name: establishmentData.name || 'Mon Établissement de Formation',
                logo: establishmentData.logo_base64 || null,
            });
        }
    };

    fetchContextData();
  }, [session.user.id, userRole]);


  const trainingYears = useMemo(() => {
    const years = new Set([globalFilters.year, ...Object.keys(archivedData)]);
    allData.groups.forEach(group => years.add(group.trainingYear));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [globalFilters.year, archivedData, allData.groups]);

  const currentYearData = useMemo(() => {
    const currentGroups = allData.groups.filter(g => g.trainingYear === globalFilters.year);
    const currentGroupIds = new Set(currentGroups.map(g => g.id));
    return {
      levels: allData.levels,
      filieres: allData.filieres,
      groups: currentGroups,
      trainees: allData.trainees.filter(t => currentGroupIds.has(t.groupId)),
    };
  }, [allData, globalFilters.year]);
    
  const allYearsData = useMemo(() => ({...archivedData, [globalFilters.year]: currentYearData}), [archivedData, globalFilters.year, currentYearData]);

  // Effect to manage filter consistency
  useEffect(() => {
    const currentGroupsForYear = allData.groups.filter(g => g.trainingYear === globalFilters.year);
    const groupExists = currentGroupsForYear.some(g => g.id === globalFilters.groupId);

    if (currentGroupsForYear.length > 0 && !groupExists) {
        setGlobalFilters(f => ({ ...f, groupId: currentGroupsForYear[0].id, traineeId: '' }));
    } else if (currentGroupsForYear.length === 0 && globalFilters.groupId) {
        setGlobalFilters(f => ({ ...f, groupId: '', traineeId: '' }));
    }
  }, [globalFilters.year, allData.groups]);


  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} establishmentInfo={establishmentInfo} session={session} tutorEmail={tutorEmail} />
      <main className="p-4 sm:p-6 md:p-8">
        {activeTab === 'dashboard' && <DashboardView allYearsData={allYearsData} globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} allData={allData} />}
        {activeTab === 'saisie' && <AbsenceSaisieView data={currentYearData} setAllData={setAllData} globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} trainingYears={trainingYears} />}
        {activeTab === 'assiduite' && <AssiduiteView currentYearData={currentYearData} globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} trainingYears={trainingYears} />}
        {activeTab === 'comportement' && <ComportementView currentYearData={currentYearData} setAllData={setAllData} globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} trainingYears={trainingYears} setAlertState={setAlertState} />}
        {activeTab === 'donnees_personnelles' && <DonneesPersonnellesView allYearsData={allYearsData} establishmentInfo={establishmentInfo} globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} currentYearData={currentYearData} trainingYears={trainingYears} />}
        {activeTab === 'historique' && <HistoryView />}
        {activeTab === 'donnees' && <DataView allData={allData} setAllData={setAllData} setAlertState={setAlertState} establishmentInfo={establishmentInfo} setEstablishmentInfo={setEstablishmentInfo} session={session}/>}
        {activeTab === 'admin' && userRole === 'super_admin' && <AdminView session={session} />}
      </main>
       <AlertModal
            isOpen={alertState.isOpen}
            onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            onConfirm={alertState.onConfirm}
            title={alertState.title}
            type={alertState.type}
        >
            {alertState.message}
        </AlertModal>
    </div>
  );
}

// --- HEADER & NAVIGATION ---
const Header = ({ activeTab, setActiveTab, establishmentInfo, session, tutorEmail }: { activeTab: string; setActiveTab: (tab: string) => void, establishmentInfo: { name: string, logo: string | null }, session: Session, tutorEmail: string | null }) => {
  
  const userRole = session.user.user_metadata.role;
  const isAssistant = userRole === 'assistant_admin';

  const tabs = [
    { id: 'dashboard', label: 'Tableau de Bord' },
    { id: 'saisie', label: 'Saisie' },
    { id: 'assiduite', label: 'Assiduité' },
    { id: 'comportement', label: 'Comportement'},
    { id: 'donnees_personnelles', label: 'Données Personnelles' },
    { id: 'historique', label: 'Historique' },
    { id: 'donnees', label: 'Paramètres' },
  ];

  if (userRole === 'super_admin') {
      tabs.push({ id: 'admin', label: 'Admin' });
  }
  
  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
  };

  return (
    <header className="bg-blue-800 text-white shadow-md sticky top-0 z-30 print:hidden">
       <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Gestion des Absences</h1>
            <div className="flex items-center gap-2 mt-1">
                {establishmentInfo.logo && <img src={establishmentInfo.logo} alt="Logo de l'établissement" className="h-8 w-auto rounded" />}
                <h2 className="text-base sm:text-lg font-semibold text-blue-200 truncate">{establishmentInfo.name}</h2>
            </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="text-right">
                <p className="text-sm text-blue-300">
                    {isAssistant && tutorEmail ? "Compte assistant pour" : "Connecté en tant que"}
                </p>
                <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-[250px]">
                    {isAssistant && tutorEmail ? tutorEmail : session.user.email}
                </p>
                 {userRole && <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${userRole === 'super_admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-blue-200 text-blue-900'}`}>{userRole === 'super_admin' ? 'Super Admin' : 'Assistant'}</span>}
            </div>
            <button onClick={handleLogout} title="Se déconnecter" className="p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors shrink-0">
                <LogoutIcon />
            </button>
        </div>
      </div>
      <nav className="bg-blue-700">
        <div className="px-4 sm:px-6 lg:px-8">
           <div className="flex space-x-2 sm:space-x-4 whitespace-nowrap overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
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
const AbsenceSaisieView = ({ data, setAllData, globalFilters, setGlobalFilters, trainingYears }: {data: TrainingData, setAllData: React.Dispatch<React.SetStateAction<TrainingData>>, globalFilters: GlobalFilters, setGlobalFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>, trainingYears: string[]}) => {
    const [saveStatus, setSaveStatus] = useState('');
    const { year: currentYear, groupId: selectedGroupId, month: selectedMonth, week: selectedWeek } = globalFilters;

    const [isDropoutModalOpen, setIsDropoutModalOpen] = useState(false);
    const [dropoutCandidate, setDropoutCandidate] = useState<{traineeId: string; date: string; sessionId: string;} | null>(null);

    const academicMonths = useMemo(() => getAcademicYearMonths(currentYear), [currentYear]);
    const weeks = useMemo(() => getWeeksForMonth(selectedMonth), [selectedMonth]);
    const sortedGroups = useMemo(() => [...data.groups].sort((a, b) => a.name.localeCompare(b.name)), [data.groups]);
    
    // Initialize filters on first load or when data/year changes
    useEffect(() => {
        let needsUpdate = false;
        const newFilters = { ...globalFilters };

        // Default to a valid month if none is selected
        if (!newFilters.month && academicMonths.length > 0) {
            const today = new Date();
            const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            const monthExists = academicMonths.some(m => m.value === currentMonthValue);
            newFilters.month = monthExists ? currentMonthValue : academicMonths[0].value;
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            setGlobalFilters(newFilters);
        }
    }, [data.groups, currentYear, academicMonths]);
    
     useEffect(() => {
        if (selectedMonth) {
            const newWeeks = getWeeksForMonth(selectedMonth);
            if (newWeeks.length > 0) {
                 const currentWeekStart = getWeekStartDate(new Date()).toISOString();
                 const weekExists = newWeeks.some(w => w.toISOString() === selectedWeek);
                 const currentWeekExists = newWeeks.some(w => w.toISOString() === currentWeekStart);

                 if (!weekExists || !selectedWeek) {
                     const weekToSet = currentWeekExists ? currentWeekStart : newWeeks[0].toISOString();
                     setGlobalFilters(prev => ({...prev, week: weekToSet}));
                 }
            } else {
                 setGlobalFilters(prev => ({...prev, week: ''}));
            }
        }
    }, [selectedMonth]);
    
    useEffect(() => {
        const currentWeeks = getWeeksForMonth(selectedMonth);
        const weekIsValid = currentWeeks.some(w => w.toISOString() === selectedWeek);

        if (selectedMonth && !weekIsValid && currentWeeks.length > 0) {
            setGlobalFilters(prev => ({ ...prev, week: currentWeeks[0].toISOString() }));
        } else if (currentWeeks.length === 0) {
            setGlobalFilters(prev => ({...prev, week: ''}));
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
        setSaveStatus('Données sauvegardées avec succès !');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const dropoutCandidateTrainee = useMemo(() => {
        return dropoutCandidate ? data.trainees.find(t => t.id === dropoutCandidate.traineeId) : null;
    }, [dropoutCandidate, data.trainees]);
    

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-inner border">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Filtres de Saisie</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="training-year" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation</label>
                        <select id="training-year" value={currentYear} onChange={(e) => setGlobalFilters(f => ({...f, year: e.target.value, groupId: '', month: '', week: '', traineeId: ''}))} className={inputStyle}>
                            {useMemo(() => trainingYears.map(year => <option key={year} value={year}>{year}</option>), [trainingYears])}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select id="group" value={selectedGroupId} onChange={e => setGlobalFilters(prev => ({...prev, groupId: e.target.value}))} className={inputStyle} disabled={!data.groups.length}>
                            {sortedGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                        <select id="month" value={selectedMonth} onChange={e => setGlobalFilters(prev => ({...prev, month: e.target.value, week: ''}))} className={inputStyle}>
                            {academicMonths.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-1">Semaine</label>
                         <select id="week" value={selectedWeek} onChange={e => setGlobalFilters(prev => ({...prev, week: e.target.value}))} className={inputStyle} disabled={!weeks.length}>
                           {weeks.map(weekStart => (
                               <option key={weekStart.toISOString()} value={weekStart.toISOString()}>
                                   Du {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au {new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                               </option>
                           ))}
                        </select>
                    </div>
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
const DashboardView = ({ allYearsData, globalFilters, setGlobalFilters, allData }: { allYearsData: ArchivedData & { [key: string]: TrainingData }, globalFilters: GlobalFilters, setGlobalFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>, allData: TrainingData }) => {
    const { year: selectedYear, groupId: selectedGroupId, month: selectedMonth, traineeId: selectedTraineeId } = globalFilters;
    const allTrainingYears = useMemo(() => Object.keys(allYearsData).sort((a, b) => b.localeCompare(a)), [allYearsData]);
    
    const yearData = useMemo(() => allYearsData[selectedYear], [allYearsData, selectedYear]);
    const academicMonths = useMemo(() => getAcademicYearMonths(selectedYear), [selectedYear]);

    const groupOptions = useMemo(() => yearData?.groups.map(g => ({id: g.id, name: g.name})).sort((a,b) => a.name.localeCompare(b.name)) || [], [yearData]);
    
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
            for (const date in trainee.absences) {
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
                name: `${trainee.lastName.toUpperCase()} ${trainee.firstName}`, 
                hours: totalHours,
                sanction: sanctionInfo.sanction
            };
        }).sort((a, b) => b.hours - a.hours);
    }, [filteredTrainees, selectedMonth]);

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
            const group = allData.groups.find(g => g.id === trainee.groupId);
            return acc + (group ? group.annualHours : 0);
        }, 0);
        
        const absenteeismRate = totalExpectedHours > 0 ? (totalAbsenceHours / totalExpectedHours) * 100 : 0;
        
        const dropoutCount = dropoutTrainees.length;
        const totalTrainees = filteredTrainees.length;
        const dropoutRate = totalTrainees > 0 ? (dropoutCount / totalTrainees) * 100 : 0;


        return { totalAbsenceHours, absenceTypeCounts, monthlyAbsenceHours, absenteeismRate, totalExpectedHours, dropoutCount, dropoutRate };
    }, [filteredTrainees, dropoutTrainees, selectedMonth, academicMonths, traineeStats, allData]);

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
        return <div className="bg-white p-6 rounded-lg shadow-lg text-center"><p className="text-gray-600">Aucune donnée disponible pour l'année sélectionnée.</p></div>;
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
                        <select value={selectedYear} onChange={e => setGlobalFilters({year: e.target.value, groupId: '', month: '', week: '', traineeId: ''})} className={inputStyle}>
                            {allTrainingYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select value={selectedGroupId} onChange={e => setGlobalFilters(f => ({...f, groupId: e.target.value, traineeId: ''}))} className={inputStyle}>
                            <option value="">Tous les groupes</option>
                            {groupOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                        <select value={selectedMonth} onChange={e => setGlobalFilters(f => ({...f, month: e.target.value}))} className={inputStyle}>
                            <option value="">Tous les mois</option>
                            {academicMonths.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stagiaire</label>
                        <select value={selectedTraineeId} onChange={e => setGlobalFilters(f => ({...f, traineeId: e.target.value}))} className={inputStyle}>
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
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

// --- ASSIDUITE VIEW ---
const AssiduiteView = ({ currentYearData, globalFilters, setGlobalFilters, trainingYears }: { currentYearData: TrainingData; globalFilters: GlobalFilters; setGlobalFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>; trainingYears: string[]; }) => {
    const { year: currentYear, groupId: selectedGroupId } = globalFilters;
    
    const filteredTrainees = useMemo(() => {
        return currentYearData.trainees
            .filter(t => !selectedGroupId || t.groupId === selectedGroupId)
            .sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [currentYearData.trainees, selectedGroupId]);

    const traineeStats = useMemo(() => {
        return filteredTrainees.map(trainee => {
            const stats = calculateTraineeAbsenceStats(trainee, ''); // all time
            return {
                ...trainee,
                stats: stats
            };
        });
    }, [filteredTrainees]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Suivi de l'Assiduité</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="training-year-assiduite" className="block text-sm font-medium text-gray-700 mb-1">Année de Formation</label>
                        <select id="training-year-assiduite" value={currentYear} onChange={(e) => setGlobalFilters(f => ({...f, year: e.target.value, groupId: '', traineeId: ''}))} className={inputStyle}>
                            {trainingYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="group-assiduite" className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                        <select id="group-assiduite" value={selectedGroupId} onChange={e => setGlobalFilters(f => ({...f, groupId: e.target.value, traineeId: ''}))} className={inputStyle} disabled={!currentYearData.groups.length}>
                            <option value="">Tous les groupes</option>
                            {currentYearData.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Barème des Sanctions (Assiduité)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-xs uppercase">
                            <tr>
                                <th className="p-2">Cumul Retards</th>
                                <th className="p-2">Équiv. Journées</th>
                                <th className="p-2">Points</th>
                                <th className="p-2">Sanction Proposée</th>
                                <th className="p-2">Autorité</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {SANCTION_RULES_FOR_DISPLAY.map((rule, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="p-2 font-medium">{rule.retards}</td>
                                    <td className="p-2">{rule.days}</td>
                                    <td className="p-2 font-bold">{rule.points}</td>
                                    <td className="p-2 font-semibold text-blue-800">{rule.sanction}</td>
                                    <td className="p-2 text-gray-600">{rule.authority}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Situation des Stagiaires</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-xs uppercase">
                            <tr>
                                <th className="p-2">Stagiaire</th>
                                <th className="p-2 text-center">Nombre de Retards</th>
                                <th className="p-2 text-center">Jours d'Absence (A)</th>
                                <th className="p-2">Sanction Atteinte</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {traineeStats.map(trainee => (
                                <tr key={trainee.id} className="hover:bg-gray-50">
                                    <td className="p-2 font-medium">{`${trainee.lastName.toUpperCase()} ${trainee.firstName}`}</td>
                                    <td className="p-2 text-center font-bold">{trainee.stats.retardCount}</td>
                                    <td className="p-2 text-center font-bold text-red-600">{trainee.stats.totalAbsenceDays}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getSanctionStyle(trainee.stats.sanction)}`}>
                                            {trainee.stats.sanction?.sanction || 'Aucune'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                             {traineeStats.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-gray-500">Aucun stagiaire à afficher pour les filtres sélectionnés.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- COMPORTEMENT VIEW ---
const ComportementView = ({ currentYearData, setAllData, globalFilters, setGlobalFilters, trainingYears, setAlertState }: { currentYearData: TrainingData; setAllData: React.Dispatch<React.SetStateAction<TrainingData>>; globalFilters: GlobalFilters; setGlobalFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>; trainingYears: string[]; setAlertState: React.Dispatch<React.SetStateAction<AlertState>> }) => {
    const { year: currentYear, groupId: selectedGroupId, traineeId: selectedTraineeId } = globalFilters;
    
    const [incidentForm, setIncidentForm] = useState({ date: formatDate(new Date()), motif: '', sanction: BEHAVIOR_SANCTION_THRESHOLDS[BEHAVIOR_SANCTION_THRESHOLDS.length - 1].sanction });
    
    const traineesForGroup = useMemo(() => 
        currentYearData.trainees
            .filter(t => !selectedGroupId || t.groupId === selectedGroupId)
            .sort((a,b) => a.lastName.localeCompare(b.lastName)), 
        [currentYearData.trainees, selectedGroupId]
    );

    const selectedTrainee = useMemo(() => 
        traineesForGroup.find(t => t.id === selectedTraineeId),
        [traineesForGroup, selectedTraineeId]
    );

    const handleAddIncident = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTraineeId || !incidentForm.motif) {
            setAlertState({ isOpen: true, type: 'error', title: 'Erreur', message: 'Veuillez sélectionner un stagiaire et saisir un motif.'});
            return;
        }

        setAllData(prev => ({
            ...prev,
            trainees: prev.trainees.map(t => {
                if (t.id === selectedTraineeId) {
                    const newBehavior = [...(t.behavior || []), incidentForm];
                    return { ...t, behavior: newBehavior };
                }
                return t;
            })
        }));

        setAlertState({ isOpen: true, type: 'success', title: 'Succès', message: 'Incident ajouté avec succès.'});
        setIncidentForm({ date: formatDate(new Date()), motif: '', sanction: BEHAVIOR_SANCTION_THRESHOLDS[BEHAVIOR_SANCTION_THRESHOLDS.length - 1].sanction });
    };

    const handleDeleteIncident = (traineeId: string, incidentIndex: number) => {
         setAllData(prev => ({
            ...prev,
            trainees: prev.trainees.map(t => {
                if (t.id === traineeId) {
                    const newBehavior = [...(t.behavior || [])];
                    newBehavior.splice(incidentIndex, 1);
                    return { ...t, behavior: newBehavior };
                }
                return t;
            })
        }));
        setAlertState({ isOpen: true, type: 'success', title: 'Succès', message: 'Incident supprimé.'});
    };

    const traineeBehaviorStats = useMemo(() => selectedTrainee ? calculateTraineeBehaviorStats(selectedTrainee) : null, [selectedTrainee]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion du Comportement</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={currentYear} onChange={(e) => setGlobalFilters(f => ({...f, year: e.target.value, groupId: '', traineeId: ''}))} className={inputStyle}>
                        {trainingYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <select value={selectedGroupId} onChange={e => setGlobalFilters(f => ({...f, groupId: e.target.value, traineeId: ''}))} className={inputStyle} >
                        <option value="">Tous les groupes</option>
                        {currentYearData.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select value={selectedTraineeId} onChange={e => setGlobalFilters(f => ({...f, traineeId: e.target.value}))} className={inputStyle}>
                        <option value="">-- Sélectionner un stagiaire --</option>
                        {traineesForGroup.map(t => <option key={t.id} value={t.id}>{`${t.lastName.toUpperCase()} ${t.firstName}`}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Ajouter un Incident</h3>
                        {selectedTraineeId ? (
                            <form onSubmit={handleAddIncident} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Date</label>
                                    <input type="date" value={incidentForm.date} onChange={e => setIncidentForm({...incidentForm, date: e.target.value})} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Motif</label>
                                    <textarea value={incidentForm.motif} onChange={e => setIncidentForm({...incidentForm, motif: e.target.value})} className={inputStyle} rows={3}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Sanction Appliquée</label>
                                    <select value={incidentForm.sanction} onChange={e => setIncidentForm({...incidentForm, sanction: e.target.value})} className={inputStyle}>
                                       {BEHAVIOR_SANCTION_THRESHOLDS.map(s => <option key={s.sanction} value={s.sanction}>{s.sanction}</option>).reverse()}
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Ajouter l'incident</button>
                            </form>
                        ) : <p className="text-gray-500 text-center py-8">Veuillez sélectionner un stagiaire.</p>}
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Barème (Comportement)</h3>
                        <ul className="space-y-2">
                           {BEHAVIOR_SANCTION_RULES_FOR_DISPLAY.map(rule => (
                               <li key={rule.motif} className="text-sm p-2 bg-gray-50 rounded-md">
                                   <p><span className="font-bold">{rule.motif}:</span> <span className="font-semibold text-blue-800">{rule.sanction}</span> ({rule.points} pts)</p>
                                   <p className="text-xs text-gray-500">Autorité: {rule.authority}</p>
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                       {selectedTrainee ? `Historique de ${selectedTrainee.firstName} ${selectedTrainee.lastName}` : "Historique du Stagiaire"}
                    </h3>
                    {selectedTrainee ? (
                        <>
                            <div className={`p-3 rounded-lg mb-4 text-center ${getBehaviorSanctionStyle(traineeBehaviorStats?.sanction || null)}`}>
                                <div className="text-lg font-bold">{traineeBehaviorStats?.sanction?.sanction || 'Aucune sanction'}</div>
                                <div className="text-sm">({traineeBehaviorStats?.incidentCount || 0} incident(s) enregistré(s))</div>
                            </div>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {(selectedTrainee.behavior || []).map((incident, index) => (
                                     <div key={index} className="p-3 bg-gray-50 border rounded-md relative group">
                                         <p className="font-semibold">Le {new Date(incident.date).toLocaleDateString('fr-FR')}: <span className="font-bold text-orange-600">{incident.sanction}</span></p>
                                         <p className="text-sm text-gray-600 mt-1">Motif: {incident.motif}</p>
                                         <button onClick={() => handleDeleteIncident(selectedTrainee.id, index)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                             <DeleteIcon />
                                         </button>
                                     </div>
                                ))}
                                {(selectedTrainee.behavior || []).length === 0 && <p className="text-gray-500 text-center py-8">Aucun incident enregistré.</p>}
                            </div>
                        </>
                    ) : <p className="text-gray-500 text-center py-16">Veuillez sélectionner un stagiaire pour voir son historique.</p>}
                </div>
            </div>
        </div>
    );
};


const DonneesPersonnellesView = ({ allYearsData, establishmentInfo, globalFilters, setGlobalFilters, currentYearData, trainingYears }: { allYearsData: ArchivedData & { [key: string]: TrainingData }, establishmentInfo: { name: string, logo: string | null }, globalFilters: GlobalFilters, setGlobalFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>, currentYearData: TrainingData, trainingYears: string[] }) => {
    const { year: currentTrainingYear, groupId: selectedGroupId, traineeId: selectedTraineeId } = globalFilters;
    
    const traineesForFilter = useMemo(() => {
        return currentYearData.trainees
            .filter(t => !selectedGroupId || t.groupId === selectedGroupId)
            .sort((a,b) => a.lastName.localeCompare(b.lastName));
    }, [currentYearData, selectedGroupId]);

    const selectedTrainee = useMemo(() => {
        return currentYearData.trainees.find(t => t.id === selectedTraineeId);
    }, [currentYearData.trainees, selectedTraineeId]);

    const getTraineeGroupAndFiliere = useCallback((trainee: Trainee | undefined) => {
        if (!trainee) return { groupName: 'N/A', filiereName: 'N/A' };
        const group = currentYearData.groups.find(g => g.id === trainee.groupId);
        if (group) {
            const filiere = currentYearData.filieres.find(f => f.id === group.filiereId);
            return {
                groupName: group.name,
                filiereName: filiere?.name || 'N/A'
            };
        }
        return { groupName: 'N/A', filiereName: 'N/A' };
    }, [currentYearData]);
    
    const { groupName, filiereName } = getTraineeGroupAndFiliere(selectedTrainee);
    
    const traineeAbsenceStats = useMemo(() => {
        if (!selectedTrainee) return null;
        return calculateTraineeAbsenceStats(selectedTrainee, ''); // all time stats
    }, [selectedTrainee]);

    const traineeBehaviorStats = useMemo(() => selectedTrainee ? calculateTraineeBehaviorStats(selectedTrainee) : null, [selectedTrainee]);

    const handlePrint = () => window.print();

    const handleDownloadPdf = async () => {
        const input = document.getElementById('printable-area');
        if (!input) return;

        const canvas = await window.html2canvas(input, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgHeight = (pdfWidth / ratio);
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`fiche-${selectedTrainee?.lastName || 'stagiaire'}.pdf`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800">Fiche Individuelle Stagiaire</h2>
                 <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
                    <select value={currentTrainingYear} onChange={e => setGlobalFilters(f => ({...f, year: e.target.value, groupId: '', traineeId: ''}))} className={`${inputStyle} w-full sm:w-auto`}>
                        {trainingYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                     <select value={selectedGroupId} onChange={e => setGlobalFilters(f => ({...f, groupId: e.target.value, traineeId: ''}))} className={`${inputStyle} w-full sm:w-auto`}>
                        <option value="">Tous les groupes</option>
                        {currentYearData.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select value={selectedTraineeId} onChange={e => setGlobalFilters(f => ({...f, traineeId: e.target.value}))} className={`${inputStyle} w-full sm:w-72`}>
                        <option value="">-- Sélectionner un stagiaire --</option>
                        {traineesForFilter.map(t => <option key={t.id} value={t.id}>{t.lastName.toUpperCase()} {t.firstName}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 mb-4 print:hidden">
                 <button onClick={handlePrint} disabled={!selectedTraineeId} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"><PrinterIcon /> Imprimer</button>
                 <button onClick={handleDownloadPdf} disabled={!selectedTraineeId} className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"><DownloadIcon /> PDF</button>
            </div>

            {selectedTrainee ? (
                <div id="printable-area">
                    <div id="fiche-individuelle" className="p-4 sm:p-6 border rounded-lg shadow-md bg-white">
                        <ExportHeader 
                            establishmentInfo={establishmentInfo} 
                            trainingYear={currentTrainingYear} 
                            title="Fiche Individuelle d'Assiduité et de Comportement"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg text-gray-700">{selectedTrainee.lastName.toUpperCase()} {selectedTrainee.firstName}</h3>
                                <p><span className="font-semibold">CEF:</span> {selectedTrainee.cef}</p>
                                <p><span className="font-semibold">Date de naissance:</span> {new Date(selectedTrainee.birthDate).toLocaleDateString('fr-FR')}</p>
                                <p><span className="font-semibold">Âge:</span> {calculateAge(selectedTrainee.birthDate)} ans</p>
                            </div>
                             <div className="space-y-2">
                                <h3 className="font-bold text-lg text-gray-700">&nbsp;</h3>
                                <p><span className="font-semibold">Filière:</span> {filiereName}</p>
                                <p><span className="font-semibold">Groupe:</span> {groupName}</p>
                                {selectedTrainee.dropoutDate && <p className="p-2 bg-red-100 text-red-700 font-bold rounded-md">Déperdition le: {new Date(selectedTrainee.dropoutDate).toLocaleDateString('fr-FR')}</p>}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-xl mb-3 pb-2 border-b-2 border-blue-200 text-blue-800">Bilan d'Assiduité</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-red-50 rounded-lg"><div className="text-2xl font-bold text-red-600">{(traineeAbsenceStats?.totalAbsenceDays || 0) * 2 * SESSION_DURATION}</div><div className="text-sm text-gray-600">Heures d'Absence (A)</div></div>
                                    <div className="p-3 bg-yellow-50 rounded-lg"><div className="text-2xl font-bold text-yellow-700">{traineeAbsenceStats?.retardCount || 0}</div><div className="text-sm text-gray-600">Retards</div></div>
                                    <div className={`p-3 rounded-lg col-span-2 sm:col-span-1 ${getSanctionStyle(traineeAbsenceStats?.sanction || null)}`}><div className="text-xl font-bold ">{traineeAbsenceStats?.sanction?.sanction || 'Aucune'}</div><div className="text-sm">Sanction d'assiduité</div></div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-xl mb-3 pb-2 border-b-2 border-blue-200 text-blue-800">Bilan Comportemental</h4>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-orange-50 rounded-lg"><div className="text-2xl font-bold text-orange-700">{traineeBehaviorStats?.incidentCount || 0}</div><div className="text-sm text-gray-600">Incidents</div></div>
                                    <div className={`p-3 rounded-lg col-span-2 ${getBehaviorSanctionStyle(traineeBehaviorStats?.sanction || null)}`}><div className="text-xl font-bold ">{traineeBehaviorStats?.sanction?.sanction || 'Aucune'}</div><div className="text-sm">Sanction comportementale</div></div>
                                </div>
                            </div>
                             <div>
                                <h4 className="font-bold text-xl mb-3 pb-2 border-b-2 border-blue-200 text-blue-800">Historique des Incidents</h4>
                                {selectedTrainee.behavior && selectedTrainee.behavior.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedTrainee.behavior.map((incident, index) => (
                                            <li key={index} className="p-3 bg-gray-50 border rounded-md">
                                                <p className="font-semibold">Le {new Date(incident.date).toLocaleDateString('fr-FR')}: <span className="font-bold text-orange-600">{incident.sanction}</span></p>
                                                <p className="text-sm text-gray-600">Motif: {incident.motif}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-gray-500">Aucun incident de comportement enregistré.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            ) : <p className="text-center text-gray-500 py-10">Veuillez sélectionner un stagiaire pour afficher sa fiche.</p>}
        </div>
    );
};

const HistoryView = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-8">
             <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Archivage</h2>
                <div className="border p-4 rounded-lg bg-gray-50">
                    <p className="text-gray-600 mb-4">La fonctionnalité d'archivage des années de formation sera disponible dans une future mise à jour.</p>
                    <button disabled className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                        Archiver l'année en cours (Bientôt disponible)
                    </button>
                </div>
            </div>
        </div>
    );
};

const DataView = ({ allData, setAllData, setAlertState, establishmentInfo, setEstablishmentInfo, session }: { allData: TrainingData, setAllData: React.Dispatch<React.SetStateAction<TrainingData>>, setAlertState: React.Dispatch<React.SetStateAction<AlertState>>, establishmentInfo: { name: string, logo: string | null }, setEstablishmentInfo: React.Dispatch<React.SetStateAction<{ name: string, logo: string | null }>>, session: Session }) => {
    const [editingFiliereId, setEditingFiliereId] = useState<string | null>(null);
    const [tempAnnualHours, setTempAnnualHours] = useState<number>(0);
    const [localEstablishmentInfo, setLocalEstablishmentInfo] = useState(establishmentInfo);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setLocalEstablishmentInfo(establishmentInfo);
    }, [establishmentInfo]);

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = window.XLSX.read(data, { type: 'array' });

                const traineesSheet = workbook.Sheets['Stagiaires'];
                const groupsSheet = workbook.Sheets['Groupes'];
                const filieresSheet = workbook.Sheets['Filieres'];
                const levelsSheet = workbook.Sheets['Niveaux'];
                
                if (!traineesSheet || !groupsSheet || !filieresSheet || !levelsSheet) {
                    throw new Error("Le fichier Excel doit contenir les feuilles: 'Stagiaires', 'Groupes', 'Filieres', 'Niveaux'.");
                }

                const trainees: Trainee[] = window.XLSX.utils.sheet_to_json(traineesSheet).map((row: any) => ({
                    id: String(row.id),
                    cef: String(row.cef),
                    firstName: row.firstName,
                    lastName: row.lastName,
                    birthDate: row.birthDate.includes('/') ? parseDateDDMMYYYY(row.birthDate) : convertExcelDate(row.birthDate),
                    groupId: String(row.groupId),
                    absences: {},
                    behavior: [],
                }));

                const groups: Group[] = window.XLSX.utils.sheet_to_json(groupsSheet).map((row: any) => ({
                    id: String(row.id),
                    name: row.name,
                    filiereId: String(row.filiereId),
                    trainingYear: row.trainingYear,
                    annualHours: Number(row.annualHours),
                }));
                
                const filieres: Filiere[] = window.XLSX.utils.sheet_to_json(filieresSheet).map((row: any) => ({
                     id: String(row.id), name: row.name, levelId: String(row.levelId)
                }));

                const levels: Level[] = window.XLSX.utils.sheet_to_json(levelsSheet).map((row: any) => ({
                     id: String(row.id), name: row.name 
                }));
                
                setAllData({ levels, filieres, groups, trainees });
                setAlertState({ isOpen: true, type: 'success', title: 'Importation Réussie', message: 'Les données ont été importées avec succès.' });

            } catch (error: any) {
                console.error(error);
                setAlertState({ isOpen: true, type: 'error', title: "Erreur d'Importation", message: error.message });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleEditHours = (filiere: Filiere) => {
        setEditingFiliereId(filiere.id);
        // Find the annual hours from the first group of that filiere to pre-fill the input
        const firstGroupOfFiliere = allData.groups.find(g => g.filiereId === filiere.id);
        setTempAnnualHours(firstGroupOfFiliere ? firstGroupOfFiliere.annualHours : 0);
    };

    const handleSaveHours = (filiereId: string) => {
        setAllData(prev => ({
            ...prev,
            // Update the annualHours for all groups belonging to the edited filiere
            groups: prev.groups.map(g => 
                g.filiereId === filiereId 
                ? { ...g, annualHours: tempAnnualHours } 
                : g
            )
        }));
        setEditingFiliereId(null);
        setAlertState({ isOpen: true, type: 'success', title: 'Succès', message: 'La masse horaire a été mise à jour pour tous les groupes de la filière.' });
    };

    const handleDeleteFiliere = (filiereId: string, filiereName: string) => {
        const groupsToDelete = allData.groups.filter(g => g.filiereId === filiereId);
        const groupCount = groupsToDelete.length;
        const traineeCount = allData.trainees.filter(t => groupsToDelete.some(g => g.id === t.groupId)).length;

        setAlertState({
            isOpen: true,
            type: 'confirm',
            title: `Supprimer la filière "${filiereName}" ?`,
            message: (
                <div className="text-left">
                    <p>Cette action est irréversible et entraînera la suppression de :</p>
                    <ul className="list-disc list-inside mt-2 font-semibold">
                        <li>La filière "{filiereName}"</li>
                        <li>{groupCount} groupe(s) associé(s)</li>
                        <li>{traineeCount} stagiaire(s) inscrit(s)</li>
                    </ul>
                </div>
            ),
            onConfirm: () => {
                const groupsToDeleteIds = new Set(groupsToDelete.map(g => g.id));
                const updatedFilieres = allData.filieres.filter(f => f.id !== filiereId);
                const updatedGroups = allData.groups.filter(g => g.filiereId !== filiereId);
                const updatedTrainees = allData.trainees.filter(t => !groupsToDeleteIds.has(t.groupId));

                setAllData({
                    ...allData,
                    filieres: updatedFilieres,
                    groups: updatedGroups,
                    trainees: updatedTrainees,
                });

                setAlertState({ isOpen: true, type: 'success', title: 'Suppression réussie', message: `La filière "${filiereName}" et toutes ses données associées ont été supprimées.` });
            }
        });
    };
    
    const handleDeleteTrainee = (traineeId: string, traineeName: string) => {
        setAlertState({
            isOpen: true,
            type: 'confirm',
            title: 'Confirmer la suppression',
            message: `Êtes-vous sûr de vouloir supprimer le stagiaire ${traineeName} ? Cette action est irréversible.`,
            onConfirm: () => {
                setAllData(prev => ({
                    ...prev,
                    trainees: prev.trainees.filter(t => t.id !== traineeId)
                }));
                 setAlertState({ isOpen: true, type: 'success', title: 'Succès', message: 'Le stagiaire a été supprimé.' });
            }
        })
    };

    const filieresByLevel = useMemo(() => {
        return allData.levels.map(level => ({
            ...level,
            filieres: allData.filieres.filter(f => f.levelId === level.id)
        }));
    }, [allData.levels, allData.filieres]);
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalEstablishmentInfo(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
     const handleSaveEstablishmentInfo = async () => {
        const { error } = await supabaseClient
            .from('establishments')
            .upsert({ 
                user_id: session.user.id, 
                name: localEstablishmentInfo.name, 
                logo_base64: localEstablishmentInfo.logo 
            }, { onConflict: 'user_id' });

        if (error) {
            setAlertState({ isOpen: true, type: 'error', title: 'Erreur', message: "Impossible de sauvegarder les informations : " + error.message });
        } else {
            setEstablishmentInfo(localEstablishmentInfo);
            setAlertState({ isOpen: true, type: 'success', title: 'Succès', message: 'Les informations de l\'établissement ont été mises à jour.' });
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Informations de l'Établissement</h2>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'établissement</label>
                        <input 
                            type="text" 
                            value={localEstablishmentInfo.name} 
                            onChange={e => setLocalEstablishmentInfo(prev => ({ ...prev, name: e.target.value }))}
                            className={inputStyle}
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                         <div className="flex items-center gap-4">
                             {localEstablishmentInfo.logo ? <img src={localEstablishmentInfo.logo} alt="Logo" className="h-16 w-auto border p-1 rounded-md" /> : <div className="h-16 w-24 border flex items-center justify-center text-xs text-gray-500 bg-gray-50 rounded-md">Aucun logo</div>}
                             <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" ref={logoInputRef} />
                             <button onClick={() => logoInputRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md">Changer le logo</button>
                         </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSaveEstablishmentInfo} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Sauvegarder les informations</button>
                    </div>
                </div>
            </div>
             <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Importer des Données</h2>
                <div className="border p-4 rounded-lg bg-gray-50">
                    <p className="text-gray-600 mb-4">Importez des stagiaires, groupes, et filières depuis un fichier Excel (.xlsx). Le fichier doit contenir 4 feuilles nommées "Niveaux", "Filieres", "Groupes", et "Stagiaires" avec les colonnes correspondantes.</p>
                    <input type="file" accept=".xlsx" onChange={handleFileImport} className="hidden" ref={fileInputRef} />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                        <UploadIcon /> Choisir un fichier
                    </button>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Filières et Masse Horaire</h2>
                <div className="space-y-4">
                    {filieresByLevel.map(level => (
                        <div key={level.id}>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">{level.name}</h3>
                            <ul className="space-y-2">
                                {level.filieres.map(filiere => {
                                    const filiereHours = allData.groups.find(g => g.filiereId === filiere.id)?.annualHours || 0;
                                    return (
                                        <li key={filiere.id} className="flex flex-wrap justify-between items-center bg-gray-50 p-3 rounded-md gap-2">
                                            <div className="font-medium">{filiere.name}</div>
                                            <div className="flex items-center gap-2">
                                                {editingFiliereId === filiere.id ? (
                                                    <input 
                                                        type="number" 
                                                        value={tempAnnualHours} 
                                                        onChange={e => setTempAnnualHours(Number(e.target.value))}
                                                        className="p-1 border rounded w-28 text-center"
                                                    />
                                                ) : (
                                                    <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md">{filiereHours} heures/an</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingFiliereId === filiere.id ? (
                                                    <>
                                                        <button onClick={() => handleSaveHours(filiere.id)} className="p-1 text-green-600 hover:bg-green-100 rounded-full"><SaveIcon /></button>
                                                        <button onClick={() => setEditingFiliereId(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full"><CancelIcon /></button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleEditHours(filiere)} className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"><EditIcon /></button>
                                                )}
                                                <button onClick={() => handleDeleteFiliere(filiere.id, filiere.name)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><DeleteIcon /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des Stagiaires</h2>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="p-3 font-semibold">Nom & Prénom</th>
                                <th className="p-3 font-semibold">Groupe</th>
                                <th className="p-3 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {allData.trainees.map(trainee => (
                                <tr key={trainee.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium">{trainee.lastName.toUpperCase()} {trainee.firstName}</td>
                                    <td className="p-3">{allData.groups.find(g => g.id === trainee.groupId)?.name}</td>
                                    <td className="p-3 text-center">
                                         <button onClick={() => handleDeleteTrainee(trainee.id, `${trainee.lastName} ${trainee.firstName}`)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- ADMIN VIEW (for super_admin) ---
const AdminView = ({ session }: { session: Session }) => {
  const [assistants, setAssistants] = useState<{ id: string; email: string; user_id: string }[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; assistantId: string | null; assistantEmail: string | null }>({ isOpen: false, assistantId: null, assistantEmail: null });

  const fetchAssistants = useCallback(async () => {
    setLoadingAssistants(true);
    const { data, error } = await supabaseClient
      .from('assistants')
      .select('id, email, user_id')
      .eq('created_by', session.user.id);

    if (error) {
      console.error('Error fetching assistants:', error);
      setError('Impossible de charger la liste des assistants.');
    } else {
      setAssistants(data || []);
    }
    setLoadingAssistants(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    // 1. Sign up the new user - This will implicitly change the session
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: formState.email,
      password: formState.password,
      options: {
          data: {
              role: 'assistant_admin'
          }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (!signUpData.user) {
        setError("La création du compte a échoué, l'utilisateur n'a pas été retourné.");
        setIsSubmitting(false);
        return;
    }
    
    // 2. Attempt to link the new user in the `assistants` table.
    // This will fail because the RLS policy requires the user to be the super_admin,
    // but the session has been switched to the newly created assistant.
    const { error: insertError } = await supabaseClient
      .from('assistants')
      .insert({
        user_id: signUpData.user.id,
        email: signUpData.user.email,
        created_by: session.user.id,
      });

    if (insertError) {
      setError("Le compte a été créé mais n'a pas pu être lié. Veuillez contacter le support.");
      
      // Restore the super_admin session so they can continue using the app
      await supabaseClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token!,
      });
      setIsSubmitting(false);
      return;
    }

    // This code will not be reached due to the bug above.
    setSuccessMessage(`Le compte pour ${formState.email} a été créé avec succès.`);
    setFormState({ email: '', password: '' });
    fetchAssistants(); // Refresh the list
    setIsSubmitting(false);
    setTimeout(() => setSuccessMessage(''), 4000);
  };


  const openDeleteModal = (assistantId: string, assistantEmail: string) => {
    setModalState({ isOpen: true, assistantId, assistantEmail });
  };
  
  const closeDeleteModal = () => {
    setModalState({ isOpen: false, assistantId: null, assistantEmail: null });
  };

  const handleDeleteAssistant = async () => {
    if (!modalState.assistantId) return;
    
    const { error: deleteError } = await supabaseClient
      .from('assistants')
      .delete()
      .eq('id', modalState.assistantId);

    if (deleteError) {
        setError(`Erreur lors de la suppression de l'assistant : ${deleteError.message}`);
    } else {
        setSuccessMessage("L'assistant a été supprimé.");
        fetchAssistants(); // Refresh list
    }
    
    closeDeleteModal();
    setTimeout(() => setSuccessMessage(''), 4000);
  };


  return (
    <>
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAssistant}
        title="Confirmer la suppression"
        type="confirm"
      >
        <p>Êtes-vous sûr de vouloir supprimer l'assistant <span className="font-bold">{modalState.assistantEmail}</span> ?</p>
        <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
          Cette action est irréversible et supprimera le lien avec votre compte.
        </p>
      </AlertModal>

      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheckIcon />
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Administrateurs</h2>
        </div>
        <p className="text-gray-600 mb-6">Créez et gérez les comptes pour les administrateurs assistants.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Assistant Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Ajouter un Assistant</h3>
            <form onSubmit={handleCreateAssistant} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className={inputStyle}
                  placeholder="assistant@exemple.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formState.password}
                  onChange={handleInputChange}
                  className={inputStyle}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
              {successMessage && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{successMessage}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
              >
                {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {isSubmitting ? 'Création...' : 'Créer le Compte Assistant'}
              </button>
            </form>
          </div>

          {/* Current Assistants List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Assistants Actuels</h3>
            {loadingAssistants ? (
              <p className="text-gray-500">Chargement des assistants...</p>
            ) : assistants.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {assistants.map(assistant => (
                  <li key={assistant.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                    <span className="text-gray-800 truncate">{assistant.email}</span>
                    <button
                        onClick={() => openDeleteModal(assistant.id, assistant.email)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        title="Supprimer l'assistant"
                    >
                      <DeleteIcon />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun assistant trouvé.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
