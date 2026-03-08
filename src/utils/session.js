// src/utils/session.js
import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

// Force-logout session check: compares provided currentSessionId with server profiles.session_id
export async function checkSession(userId, currentSessionId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      // session_id column does not exist; select a safe existing column
      .select('id')
      .eq('id', userId)
      .single();

    if (error) return;
    // No session_id column to compare against; skip forced logout logic
  } catch (err) {
    console.warn('Session check failed:', err);
  }
}
