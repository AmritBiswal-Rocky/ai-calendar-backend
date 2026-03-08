// ─────────────────────────────────────────────
// src/context/AuthContext.jsx
// Firebase → authentication provider (LAZY + NON-BLOCKING)
// Supabase → database only (Bearer token via ensureAuth)
// ❌ NO supabase.auth usage
// ✅ NEVER blocks render
// ✅ NEVER throws
// ─────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';

import supabase from '../lib/supabaseClient';
import { ensureAuth } from '../lib/auth';

// 🔥 Lazy Firebase helpers (SAFE)
import { getFirebaseAuth, signInWithGoogle, logout as firebaseLogout } from '../firebase';

import { onAuthStateChanged } from 'firebase/auth';

// ─────────────────────────────────────────────
// Context (NON-NULL DEFAULT — CRITICAL)
// ─────────────────────────────────────────────
export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  try {
    return useContext(AuthContext);
  } catch (err) {
    console.error('❌ useAuth() failed:', err);
    return {
      user: null,
      profile: null,
      loading: false,
      login: async () => {},
      logout: async () => {},
    };
  }
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false); // informational only

  const initializedRef = useRef(false);

  // ─────────────────────────────────────────────
  // Firebase Auth Observer (SAFE + NON-BLOCKING)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const auth = getFirebaseAuth();

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        // Resolve initialization exactly once
        if (!initializedRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }

        // ───────── Logged out ─────────
        if (!firebaseUser) {
          setUser(null);
          setProfile(null);
          return;
        }

        // ───────── Logged in ─────────
        setUser(firebaseUser);

        // Background Supabase sync (NEVER blocks render)
        (async () => {
          try {
            await ensureAuth(firebaseUser);

            const { data, error } = await supabase
              .from('profiles')
              .select('firebase_uid, email, full_name, avatar_url, nationality')
              .eq('firebase_uid', firebaseUser.uid)
              .maybeSingle();

            // Profile missing → create once
            if (!data && error?.code === 'PGRST116') {
              await supabase.from('profiles').insert({
                firebase_uid: firebaseUser.uid,
                email: firebaseUser.email,
                full_name: firebaseUser.displayName || firebaseUser.email || 'User',
                avatar_url: firebaseUser.photoURL || null,
                nationality: 'Unknown',
              });

              const { data: fresh } = await supabase
                .from('profiles')
                .select('firebase_uid, email, full_name, avatar_url, nationality')
                .eq('firebase_uid', firebaseUser.uid)
                .single();

              setProfile(fresh || null);
            } else {
              setProfile(data || null);
            }
          } catch (err) {
            console.error('❌ AuthContext Supabase sync failed:', err);
            setProfile(null);
          }
        })();
      });
    } catch (err) {
      console.error('❌ Firebase auth initialization failed:', err);
      setLoading(false);
    }

    return () => {
      try {
        unsubscribe();
      } catch {
        /* noop */
      }
    };
  }, []);

  // ─────────────────────────────────────────────
  // Login (Firebase ONLY)
  // ─────────────────────────────────────────────
  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('❌ Google login failed:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Logout (Firebase ONLY)
  // ─────────────────────────────────────────────
  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.error('❌ Logout failed:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  // ─────────────────────────────────────────────
  // Context value (STABLE)
  // ─────────────────────────────────────────────
  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      login,
      logout,
    }),
    [user, profile, loading]
  );

  // 🔒 ABSOLUTE RULE:
  // This provider MUST ALWAYS render children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
