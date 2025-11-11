import React, { useState, useMemo } from 'react';
import type { Profile } from './types';
import { supabase, signInWithGoogle } from './supabaseClient';

const GoogleIcon = () => <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 261.8 0 127.3 105.8 16.3 244 16.3c67.7 0 120.3 26.1 166.3 69.6l-67.8 65.7c-24.6-23.3-58.4-38-98.5-38-74.9 0-136.6 61.2-136.6 137.2 0 75.9 61.7 137.2 136.6 137.2 88.5 0 113.1-66.8 116.5-98.2H244v-75.5h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>;

const AppLogo = () => (
    <svg className="h-12 w-auto text-white" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 60C13.4315 60 0 46.5685 0 30C0 13.4315 13.4315 0 30 0V60Z" fill="currentColor" opacity="0.5"/>
        <path d="M30 0C46.5685 0 60 13.4315 60 30C60 46.5685 46.5685 60 30 60V0Z" fill="currentColor"/>
    </svg>
);


const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0 w-full max-w-4xl">
            {/* Left Side */}
            <div className="relative flex-1 p-8 md:p-12 bg-blue-800 text-white rounded-t-2xl md:rounded-l-2xl md:rounded-r-none">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-4">
                           <AppLogo />
                            <div>
                                <h1 className="text-3xl font-bold">E-Presence</h1>
                                <p className="text-lg text-blue-200 font-light tracking-wide">Solution Digitale</p>
                            </div>
                        </div>
                        <p className="mt-8 text-blue-200">
                            Bienvenue. Votre outil pour une gestion simple et efficace des présences.
                        </p>
                    </div>
                    <p className="text-sm text-blue-300 mt-8">© {new Date().getFullYear()} E-Presence. Tous droits réservés.</p>
                </div>
                 {/* Decorative Circle */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-700 rounded-full hidden md:block opacity-50"></div>
            </div>

            {/* Right Side */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                 <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Connexion
                </h2>
                <p className="text-gray-500 mb-8">
                    Accédez à votre espace de gestion.
                </p>

                {error && (
                  <p className="bg-red-50 text-red-700 text-sm text-center font-semibold p-3 rounded-md mb-6 animate-shake">
                    {error}
                  </p>
                )}

                <div className="space-y-5">
                    <button
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm text-gray-700 font-semibold hover:bg-gray-50 hover:border-blue-500 transition-all disabled:opacity-50"
                    >
                        <GoogleIcon />
                        Connexion Super Admin (Google)
                    </button>

                    <div className="flex items-center">
                        <hr className="flex-grow border-t border-gray-200" />
                        <span className="px-3 text-sm font-semibold text-gray-400">OU</span>
                        <hr className="flex-grow border-t border-gray-200" />
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Assistant)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputStyle}
                                required
                                placeholder="nom.prenom@assistant.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputStyle}
                                required
                                placeholder="********"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300"
                            disabled={loading}
                        >
                            {loading ? <><SpinnerIcon /> Connexion...</> : 'Connexion Assistant'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};
