import { createClient } from '@supabase/supabase-js';
import type { TrainingData, ArchivedData, Trainee, Group, Filiere, Level, User } from './types';
import { initialLevels, initialFilieres, initialGroups, initialTrainees } from './constants';

const supabaseUrl = 'https://rixlblpzyoygpzbktdsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGxibHB6eW95Z3B6Ymt0ZHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTE0NTksImV4cCI6MjA3NzkyNzQ1OX0.zNHLbPjU55Db0CFi30SBJgVDI4vPvYzyo5vTZUwsXyk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- AUTH & USER MANAGEMENT ---

export const getEstablishmentInfoForUser = async (userId: string) => {
    const { data, error } = await supabase.from('establishments').select('*').eq('owner_id', userId).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching establishment:', error);
    }
    return data;
};

export const createEstablishmentForNewUser = async (userId: string, name: string) => {
    const { data, error } = await supabase.from('establishments').insert({ owner_id: userId, name: name }).select().single();
    if (error) console.error('Error creating establishment:', error);
    return data;
};

export const updateEstablishmentInfo = async (userId: string, info: { name: string, logo_url: string | null }) => {
    const { error } = await supabase.from('establishments').update(info).eq('owner_id', userId);
    if (error) console.error('Error updating establishment:', error);
};

export const getAssistants = async (establishmentId: string) => {
    if (!establishmentId) return [];
    const { data, error } = await supabase.from('assistants').select('*').eq('establishment_id', establishmentId);
    if (error) console.error('Error fetching assistants:', error);
    return data || [];
};

export const addAssistant = async (establishmentId: string, name: string, email: string) => {
    const { data, error } = await supabase.from('assistants').insert({ establishment_id: establishmentId, name, email }).select().single();
    if (error) console.error('Error adding assistant:', error);
    return data;
};

export const deleteAssistant = async (email: string) => {
    const { error } = await supabase.from('assistants').delete().eq('email', email);
    if (error) console.error('Error deleting assistant:', error);
};

// --- DATA MIGRATION & FETCHING ---

const migrateInitialData = async (establishmentId: string) => {
    console.log("No data found in Supabase. Migrating initial local data...");
    
    const dataToInsert = {
      levels: initialLevels.map(l => ({ ...l, establishment_id: establishmentId })),
      filieres: initialFilieres.map(f => ({ ...f, establishment_id: establishmentId })),
      groups: initialGroups.map(g => ({ ...g, establishment_id: establishmentId })),
      trainees: initialTrainees.map(t => ({ ...t, establishment_id: establishmentId })),
    };

    const { error: levelsError } = await supabase.from('levels').insert(dataToInsert.levels);
    if (levelsError) throw levelsError;

    const { error: filieresError } = await supabase.from('filieres').insert(dataToInsert.filieres);
    if (filieresError) throw filieresError;

    const { error: groupsError } = await supabase.from('groups').insert(dataToInsert.groups);
    if (groupsError) throw groupsError;

    const { error: traineesError } = await supabase.from('trainees').insert(dataToInsert.trainees);
    if (traineesError) throw traineesError;
    
    console.log("Initial data migration successful.");
    return { levels: initialLevels, filieres: initialFilieres, groups: initialGroups, trainees: initialTrainees };
};

export const fetchAllData = async (establishmentId: string) => {
    const [levelsRes, filieresRes, groupsRes, traineesRes, archivedRes] = await Promise.all([
        supabase.from('levels').select('*').eq('establishment_id', establishmentId),
        supabase.from('filieres').select('*').eq('establishment_id', establishmentId),
        supabase.from('groups').select('*').eq('establishment_id', establishmentId),
        supabase.from('trainees').select('*').eq('establishment_id', establishmentId),
        supabase.from('archived_data').select('*').eq('establishment_id', establishmentId)
    ]);
    
    if (levelsRes.error || filieresRes.error || groupsRes.error || traineesRes.error || archivedRes.error) {
        console.error("Error fetching data:", levelsRes.error || filieresRes.error || groupsRes.error || traineesRes.error || archivedRes.error);
        return { allData: { levels: [], filieres: [], groups: [], trainees: [] }, archivedData: {} };
    }

    let allData: TrainingData = {
        levels: levelsRes.data || [],
        filieres: filieresRes.data || [],
        groups: groupsRes.data || [],
        trainees: traineesRes.data || []
    };

    if (allData.levels.length === 0) { // First time setup, migrate initial data
        allData = await migrateInitialData(establishmentId);
    }
    
    const archivedData: ArchivedData = (archivedRes.data || []).reduce((acc, item) => {
        acc[item.year] = item.data;
        return acc;
    }, {} as ArchivedData);

    return { allData, archivedData };
};

// --- DATA UPSERTING/UPDATING ---

export const upsertAllData = async (establishmentId: string, data: TrainingData) => {
    // This is a powerful function, use with care. Good for bulk import.
    const promises = [
        supabase.from('levels').upsert(data.levels.map(o => ({...o, establishment_id: establishmentId}))),
        supabase.from('filieres').upsert(data.filieres.map(o => ({...o, establishment_id: establishmentId}))),
        supabase.from('groups').upsert(data.groups.map(o => ({...o, establishment_id: establishmentId}))),
        supabase.from('trainees').upsert(data.trainees.map(o => ({...o, establishment_id: establishmentId})))
    ];
    await Promise.all(promises).catch(console.error);
};

export const upsertTrainee = async (trainee: Trainee) => {
    const { error } = await supabase.from('trainees').upsert(trainee, { onConflict: 'id' });
    if (error) console.error('Error upserting trainee:', error);
};

export const upsertGroups = async (groups: Group[]) => {
    const { error } = await supabase.from('groups').upsert(groups, { onConflict: 'id' });
    if (error) console.error('Error upserting groups:', error);
};

export const deleteGroupsByFiliereAndYear = async (filiereId: string, trainingYear: string) => {
    const { data: groupsToDelete, error: selectError } = await supabase
        .from('groups')
        .select('id')
        .eq('filiereId', filiereId)
        .eq('trainingYear', trainingYear);

    if (selectError || !groupsToDelete) {
        console.error('Error finding groups to delete:', selectError);
        return;
    }
    
    const groupIds = groupsToDelete.map(g => g.id);
    if (groupIds.length === 0) return;

    await deleteTraineesByGroupIds(groupIds);

    const { error: deleteError } = await supabase.from('groups').delete().in('id', groupIds);
    if (deleteError) console.error('Error deleting groups:', deleteError);
};

export const deleteTraineesByGroupIds = async (groupIds: string[]) => {
    const { error } = await supabase.from('trainees').delete().in('groupId', groupIds);
    if (error) console.error('Error deleting trainees by group:', error);
};

export const deleteTraineeById = async (traineeId: string) => {
     const { error } = await supabase.from('trainees').delete().eq('id', traineeId);
     if (error) console.error('Error deleting trainee by id:', error);
}

// --- ARCHIVE MANAGEMENT ---

export const upsertArchivedYear = async (establishmentId: string, year: string, data: TrainingData) => {
    const { error } = await supabase.from('archived_data').upsert({
        establishment_id: establishmentId,
        year: year,
        data: data
    }, { onConflict: 'establishment_id, year' });

    if (error) console.error(`Error upserting archive for year ${year}:`, error);
};

export const deleteArchivedYear = async (establishmentId: string, year: string) => {
    const { error } = await supabase.from('archived_data').delete()
        .eq('establishment_id', establishmentId)
        .eq('year', year);

    if (error) console.error(`Error deleting archive for year ${year}:`, error);
};
