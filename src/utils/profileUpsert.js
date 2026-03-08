// src/utils/profileUpsert.js
// Ensures the user's profile exists in your backend and/or Supabase right after login

import { getAuth } from 'firebase/auth';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';

export async function handleLoginSuccess() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    // User fields
    const firebase_uid = user.firebase_uid;
    const email = user.email || null;
    const full_name = user.displayName || null;
    const avatar_url = user.photoURL || null;

    // Try backend first, if configured
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl) {
      try {
        const body = { id: firebase_uid, email, full_name, avatar_url };
        const res = await fetch(`${backendUrl}/profile/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) return; // Done
      } catch {
        // fall through to Supabase
      }
    }

    // Fallback: upsert directly to Supabase
    const token = await ensureAuth(user);
    if (token) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: firebase_uid,
          email,
          full_name,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error updating profile in Supabase:', error);
      }
    }
  } catch (e) {
    // non-blocking
    // eslint-disable-next-line no-console
    console.warn('handleLoginSuccess failed (non-blocking):', e);
  }
}
