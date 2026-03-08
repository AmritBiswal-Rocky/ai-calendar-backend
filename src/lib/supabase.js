// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';
import { auth } from '../firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Public Supabase client (anon key only)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Do NOT export service role keys here — anon key only.

/**
 * Fetch profiles for the currently logged-in Firebase user
 * using Firebase JWT → Supabase RLS
 */
export const fetchProfiles = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not logged in');
  }

  const token = await user.getIdToken();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', user.uid)
    .setAuth(token);

  if (error) {
    console.error('Supabase profile fetch error:', error);
    throw error;
  }

  return data;
};

export default supabase;
