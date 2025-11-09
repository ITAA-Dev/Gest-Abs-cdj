import React, { useState, useEffect } from 'react';
import { supabase, fetchAllData, getEstablishmentInfoForUser, createEstablishmentForNewUser } from './supabase';
import { Auth } from './Auth';
import type { Session } from '@supabase/supabase-js';
import type { TrainingData, ArchivedData } from './types';

// A placeholder for the main application dashboard
const Dashboard = ({ session, establishment, data, archivedData, onLogout }: { session: Session, establishment: any, data: TrainingData, archivedData: ArchivedData, onLogout: () => void }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">{establishment?.name || 'E-Presence Dashboard'}</h1>
                    <div className="flex items-center">
                        <span className="text-gray-600 mr-4">Welcome, {session.user.email}</span>
                        <button 
                            onClick={onLogout} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Levels</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{data.levels.length}</dd>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Filieres</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{data.filieres.length}</dd>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Groups</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{data.groups.length}</dd>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                            <dt className="text-sm font-medium text-gray-500 truncate">Trainees</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{data.trainees.length}</dd>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                             <dt className="text-sm font-medium text-gray-500 truncate">Archived Years</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{Object.keys(archivedData).length}</dd>
                        </div>
                    </div>
                    {/* Future components for managing data will go here */}
                </div>
            </main>
        </div>
    );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<any>(null);
  const [trainingData, setTrainingData] = useState<TrainingData>({ levels: [], filieres: [], groups: [], trainees: [] });
  const [archivedData, setArchivedData] = useState<ArchivedData>({});

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserData(session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        loadUserData(session).finally(() => setLoading(false));
      } else {
        // Clear data on logout
        setEstablishment(null);
        setTrainingData({ levels: [], filieres: [], groups: [], trainees: [] });
        setArchivedData({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (currentSession: Session) => {
    let establishmentInfo = await getEstablishmentInfoForUser(currentSession.user.id);
    if (!establishmentInfo) {
        const establishmentName = currentSession.user.user_metadata?.full_name 
            ? `${currentSession.user.user_metadata.full_name}'s Establishment`
            : `${currentSession.user.email}'s Establishment`;
        establishmentInfo = await createEstablishmentForNewUser(currentSession.user.id, establishmentName);
    }
    setEstablishment(establishmentInfo);

    if (establishmentInfo) {
        const { allData, archivedData } = await fetchAllData(establishmentInfo.id);
        setTrainingData(allData);
        setArchivedData(archivedData);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if(error) console.error('Error logging out:', error);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl font-semibold">Loading...</div>
        </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <Dashboard 
      session={session} 
      establishment={establishment}
      data={trainingData} 
      archivedData={archivedData}
      onLogout={handleLogout}
    />
  );
};

export default App;
