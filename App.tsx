// FIX: Implement the main App component to handle authentication state.
// This resolves the error "File 'file:///App.tsx' is not a module." in index.tsx
// by providing a default export.

import React, { useState, useEffect } from 'react';
import { supabaseClient } from './supabaseClient';
import Auth from './Auth';
import { Session } from '@supabase/supabase-js';

// A placeholder for the main application component
const Dashboard = ({ session }: { session: Session }) => {
    const handleSignOut = async () => {
        await supabaseClient.auth.signOut();
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Welcome, {session.user.email}</h1>
                <button
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign Out
                </button>
            </div>
            <p>Your application content goes here.</p>
            {/* Here you would build out the main UI for managing absences */}
        </div>
    );
};


const App = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      {!session ? <Auth /> : <Dashboard session={session} key={session.user.id} />}
    </div>
  );
};

export default App;
