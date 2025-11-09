// FIX: Implement the main App component to handle authentication state.
// This resolves the error "File 'file:///App.tsx' is not a module." in index.tsx
// by providing a default export.

import React, { useState, useEffect } from 'react';
import { supabaseClient } from './supabaseClient';
import Auth from './Auth';
import { Session } from '@supabase/supabase-js';
import Dashboard from './Dashboard';

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
      {/* FIX: Removed the key prop to match the component's prop types and resolve the assignment error. */}
      {!session ? <Auth /> : <Dashboard session={session} />}
    </div>
  );
};

export default App;