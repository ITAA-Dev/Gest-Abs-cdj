import React, { useState } from 'react';

declare global {
    interface Window {
        supabase: any;
    }
}
const { createClient } = window.supabase;
const supabaseConfig = {
  url: "https://rixlblpzyoygpzbktdsz.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGxibHB6eW95Z3B6Ymt0ZHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTE0NTksImV4cCI6MjA3NzkyNzQ1OX0.zNHLbPjU55Db0CFi30SBJgVDI4vPvYzyo5vTZUwsXyk"
};
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

const GoogleIcon = () => <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 261.8 0 127.3 105.8 16.3 244 16.3c67.7 0 120.3 26.1 166.3 69.6l-67.8 65.7c-24.6-23.3-58.4-38-98.5-38-74.9 0-136.6 61.2-136.6 137.2 0 75.9 61.7 137.2 136.6 137.2 88.5 0 113.1-66.8 116.5-98.2H244v-75.5h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>;

type AuthProps = {
  loginError: string;
};

export const Auth = ({ loginError }: AuthProps) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
    // The redirect will happen automatically, no need to setIsLoading(false) on success
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2">
          E-Presence - Solution Digitale
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Veuillez vous authentifier pour continuer
        </p>

        {(error || loginError) && (
          <p className="bg-red-50 text-red-600 text-sm text-center font-semibold p-3 rounded-md mb-4 animate-shake">
            {error || loginError}
          </p>
        )}

        <div className="space-y-4 mt-8">
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            Se connecter avec Google
          </button>
        </div>
      </div>
    </div>
  );
};
