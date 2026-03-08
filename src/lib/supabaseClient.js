// ─────────────────────────────────────────────
// src/lib/supabaseClient.js
// Supabase client — ANON ONLY
// Firebase handles authentication
// Supabase is used ONLY as a database via RLS
// NO Supabase auth sessions or persistence
// ─────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { getFirebaseToken } from './auth';

// ─────────────────────────────────────────────
// 🔧 Environment Variables (fallback allowed for dev)
// ─────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nefnwlphcsmupodvonnu.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZm53bHBoY3NtdXBvZHZvbm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzU5NjQsImV4cCI6MjA2NDExMTk2NH0.78RctmECKOEv5H4-mTFLAES1UjVHFcauVSv2uwWnAXs';

// ─────────────────────────────────────────────
// 🛑 Safety Check (fail fast in misconfig)
// ─────────────────────────────────────────────
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// ─────────────────────────────────────────────
// 🌐 Initialize Supabase Client (ANON + RLS ONLY)
//    + Inject Firebase JWT into every request via global.fetch
// ─────────────────────────────────────────────
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 🔒 disable localStorage / IndexedDB
    autoRefreshToken: false, // 🔒 no background refresh
    detectSessionInUrl: false, // 🔒 no OAuth handling
  },
  global: {
    headers: {
      'X-Client-Info': 'deementum-web',
    },
    fetch: async (url, options = {}) => {
      // Attach Firebase ID token to every Supabase request
      try {
        const token = await getFirebaseToken();
        if (token) {
          options.headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
          };
        }
      } catch (e) {
        // Never break the request pipeline on token failure
        console.warn('Supabase global.fetch: failed to get Firebase token', e);
      }

      return fetch(url, options);
    },
  },
});

// ─────────────────────────────────────────────
// 🧹 Defensive cleanup (EXTRA SAFETY)
// Ensures no leftover session survives hot reload
// ─────────────────────────────────────────────
try {
  supabase.auth?.signOut?.();
} catch {
  // Never throw — safety only
}

// ─────────────────────────────────────────────
// ✅ Debug (safe in dev only)
// ─────────────────────────────────────────────
if (import.meta.env.DEV) {
  console.log('✅ Supabase client initialized (ANON + RLS mode)');
}

// ─────────────────────────────────────────────
// 🚀 Export (DEFAULT — REQUIRED)
// ─────────────────────────────────────────────
export default supabase;
