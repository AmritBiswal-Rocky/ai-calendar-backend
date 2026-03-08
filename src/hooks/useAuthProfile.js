// src/hooks/useAuthProfile.js
// Firebase → authentication source
// Supabase → database only (Bearer token via ensureAuth)
// RLS enforced via: firebase_uid = auth.jwt()->>'sub'
// ─────────────────────────────────────────────

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

export const useAuthProfile = () => {
  const { user } = useAuth(); // Firebase user only

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // No user → reset state
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Inject Firebase JWT BEFORE any Supabase query (RLS-safe)
        await ensureAuth(user);
        if (cancelled) return;

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('firebase_uid, email, full_name, avatar_url, nationality')
          .eq('firebase_uid', user.uid)
          .single();

        // Ignore "no rows" (profile not yet created)
        if (queryError && queryError.code !== 'PGRST116') {
          throw queryError;
        }

        if (!cancelled) {
          setProfile(data || null);
        }
      } catch (err) {
        console.error('❌ useAuthProfile error:', err);
        if (!cancelled) {
          setProfile(null);
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { profile, loading, error };
};
