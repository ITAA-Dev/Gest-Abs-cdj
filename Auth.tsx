import React, { useState } from 'react';
import { supabase } from './supabase';

const GoogleIcon = () => <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 261.8 0 127.3 105.8 16.3 244 16.3c67.7 0 120.3 26.1 166.3 69.6l-67.8 65.7c-24.6-23.3-58.4-38-98.5-38-74.9 0-136.6 61.2-136.6 137.2 0 75.9 61.7 137.2 136.6 137.2 88.5 0 113.1-66.8 116.5-98.2H244v-75.5h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>;

const inputStyle = "w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 transition";

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // The user will be redirected to Google and then back to the app.
    // The onAuthStateChange listener in App.tsx will handle the session.
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-800">E-Presence</h1>
            <p className="text-gray-500">Solution Digitale</p>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Se Connecter
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Bienvenue !
        </p>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm text-center font-semibold p-3 rounded-md mb-4 animate-shake">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? 'Redirection...' : 'Se connecter avec Google'}
          </button>

          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="px-2 text-xs font-semibold text-gray-400">OU</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-500 mt-4">
            Pour créer un compte, connectez-vous d'abord avec Google. Le premier utilisateur devient Super Administrateur. Les autres comptes (assistants) sont créés par le Super Administrateur.
          </p>
        </div>
      </div>
    </div>
  );
};
