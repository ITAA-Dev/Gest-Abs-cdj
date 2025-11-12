import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rixlblpzyoygpzbktdsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGxibHB6eW95Z3B6Ymt0ZHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTE0NTksImV4cCI6MjA3NzkyNzQ1OX0.zNHLbPjU55Db0CFi30SBJgVDI4vPvYzyo5vTZUwsXyk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Optimized Google sign-in function
export const signInWithGoogle = () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // Redirect back to the app
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'email profile',
    },
  });
};

// Sign-out function
export const signOut = () => {
  return supabase.auth.signOut();
};

// Get current session
export const getCurrentSession = () => {
  return supabase.auth.getSession();
};

// Get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};
