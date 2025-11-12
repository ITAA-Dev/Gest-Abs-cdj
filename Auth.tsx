import React, { useState } from 'react';
import { signInWithGoogle } from './supabase';
import type { User } from './types';

const GoogleIcon = () => <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 261.8 0 127.3 105.8 16.3 244 16.3c67.7 0 120.3 26.1 166.3 69.6l-67.8 65.7c-24.6-23.3-58.4-38-98.5-38-74.9 0-136.6 61.2-136.6 137.2 0 75.9 61.7 137.2 136.6 137.2 88.5 0 113.1-66.8 116.5-98.2H244v-75.5h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>;

export const Auth = ({ onLogin }: { onLogin: (email: string, password?: string) => string | null }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(''); // 'google', 'demo', 'form'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading('');
    }
  };

  const handleDemoLogin = () => {
    setLoading('demo');
    setError(null);
    const loginError = onLogin('demo@log2.com', 'password123');
    if (loginError) {
      setError(loginError);
      setLoading('');
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('form');
    setError(null);
    const loginError = onLogin(email, password);
    if (loginError) {
      setError(loginError);
      setLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Gestionnaire d'Absences
            </h1>
            <p className="text-gray-500 mb-8">
            Veuillez vous connecter pour continuer.
            </p>
        </div>
        
        {error && (
          <p className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-md mb-6 animate-shake">
            {error}
          </p>
        )}

        <div className="space-y-4">
            <button
              onClick={handleDemoLogin}
              disabled={!!loading}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-green-600 border border-transparent rounded-lg shadow-sm text-white font-semibold hover:bg-green-700 transition-all disabled:bg-green-400 disabled:cursor-wait"
            >
              {loading === 'demo' ? 'Connexion...' : 'Accès Démo (Admin)'}
            </button>
            <button
            onClick={handleGoogleLogin}
            disabled={!!loading}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 border border-transparent rounded-lg shadow-sm text-white font-semibold hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-wait"
            >
            <GoogleIcon />
            {loading === 'google' ? 'Redirection...' : 'Se connecter avec Google'}
            </button>
        </div>

        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-sm text-gray-500">Ou</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Adresse e-mail"
                disabled={!!loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Mot de passe"
                disabled={!!loading}
              />
            </div>
            <button
              type="submit"
              disabled={!!loading}
              className="w-full px-4 py-3 bg-gray-700 border border-transparent rounded-lg shadow-sm text-white font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-500 disabled:cursor-wait"
            >
              {loading === 'form' ? 'Connexion...' : 'Se connecter'}
            </button>
        </form>
      </div>
    </div>
  );
};
