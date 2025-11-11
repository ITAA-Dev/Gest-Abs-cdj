import React, { useEffect } from 'react';

const AuthCallback = () => {
  useEffect(() => {
    // The Supabase client initialized in the App component will detect the session in the URL hash.
    // The onAuthStateChange listener in App.tsx will handle the session update and state changes.
    // We just need to redirect back to the root of the application for the main App component to load.
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center p-4">
        <h1 className="text-2xl font-semibold text-gray-800">Authentification en cours...</h1>
        <p className="text-gray-600 mt-2">Veuillez patienter, vous allez être redirigé.</p>
        {/* Basic spinner */}
        <div className="mt-6 border-gray-300 h-12 w-12 animate-spin rounded-full border-4 border-t-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
