import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContextObject';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error("Session error:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: displayName,
        }
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, resetPassword, loading }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
           جاري التحميل...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
