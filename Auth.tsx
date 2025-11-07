import React, { useState } from 'react';
import { supabaseClient } from './supabaseClient';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
      s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
      s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
      C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
      c-5.222,0-9.519-3.317-11.277-7.962l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
      l6.19,5.238C42.02,35.62,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      let response;
      if (isLogin) {
        response = await supabaseClient.auth.signInWithPassword({ email, password });
      } else {
        response = await supabaseClient.auth.signUp({ email, password });
        if (!response.error) {
            setMessage('Compte créé ! Veuillez vérifier votre e-mail pour activer votre compte.');
        }
      }
      if (response.error) throw response.error;
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-blue-800 p-6">
            <h1 className="text-3xl font-bold text-white text-center">Gestion des Absences</h1>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            {isLogin ? 'Se Connecter' : 'Créer un Compte'}
          </h2>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">{error}</div>}
          {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4" role="alert">{message}</div>}

          <form onSubmit={handleAuthAction}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Adresse Email
              </label>
              <input
                id="email"
                className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="password"
                placeholder="******************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition-transform transform hover:scale-105 disabled:bg-blue-400"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Chargement...' : (isLogin ? 'Se Connecter' : "S'inscrire")}
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400">OU</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full flex items-center justify-center transition-colors disabled:bg-gray-200"
          >
            <GoogleIcon />
            <span className="ml-3">Continuer avec Google</span>
          </button>

          <p className="text-center text-gray-500 text-sm mt-8">
            {isLogin ? "Vous n'avez pas de compte ?" : 'Vous avez déjà un compte ?'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-bold text-blue-600 hover:text-blue-800 ml-2"
            >
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
