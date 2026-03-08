// ===============================
// src/lib/supabaseFirebaseTest.js
// Supabase ↔ Firebase sanity test using your existing client/session bridge
// ===============================

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import supabase, { getSupabaseClient } from './supabaseClient';

// --- Utility: fetch user profile by Firebase UID (firebase_uid column) ---
async function fetchProfile(firebase_uid, client) {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebase_uid)
    .single();

  if (error) console.error('[Profile] Fetch error:', error);
  else console.log('[Profile] Data:', data);

  return data;
}

// --- Fetch tasks and notes for current user ---
async function fetchUserData(firebase_uid, client) {
  const { data: tasks, error: tasksError } = await client
    .from('tasks')
    .select('*')
    .eq('firebase_uid', firebase_uid);

  const { data: notes, error: notesError } = await client
    .from('notes')
    .select('*')
    .eq('firebase_uid', firebase_uid);

  if (tasksError) console.error('[Tasks] Fetch error:', tasksError);
  else console.log('[Tasks] Data:', tasks);

  if (notesError) console.error('[Notes] Fetch error:', notesError);
  else console.log('[Notes] Data:', notes);

  return { tasks, notes };
}

// --- Insert a new task ---
async function insertTask(firebase_uid, client) {
  const { data, error } = await client
    .from('tasks')
    .insert({
      firebase_uid,
      title: 'Test Task from Frontend',
      description: 'Inserted via JS test script',
      priority: 'low',
      category: 'general',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    })
    .select();

  if (error) console.error('[Tasks] Insert error:', error);
  else console.log('[Tasks] Inserted:', data);
}

// --- Insert a new note ---
async function insertNote(firebase_uid, client) {
  const { data, error } = await client
    .from('notes')
    .insert({
      firebase_uid,
      title: 'Test Note from Frontend',
      content: 'Inserted via JS test script',
    })
    .select();

  if (error) console.error('[Notes] Insert error:', error);
  else console.log('[Notes] Inserted:', data);
}

// --- Main test workflow ---
export function runSupabaseFirebaseTest() {
  const auth = getAuth();

  onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      console.log('User not logged in. Please log in via Firebase.');
      return;
    }

    const firebase_uid = fbUser.uid;
    console.log('Firebase UID:', firebase_uid);

    // Ensure Supabase session is set from Firebase
    const client = await getSupabaseClient();
    if (!client) {
      console.warn('Could not initialize Supabase session from Firebase user.');
      return;
    }

    // Log Supabase user
    const {
      data: { user: sbUser },
      error: userErr,
    } = await client.auth.getUser();

    if (userErr) console.error('Supabase getUser error:', userErr);
    else console.log('Supabase user:', sbUser);

    // Step 1: Fetch profile
    await fetchProfile(firebase_uid, client);

    // Step 2: Fetch existing tasks & notes
    await fetchUserData(firebase_uid, client);

    // Step 3: Insert a new task
    await insertTask(firebase_uid, client);

    // Step 4: Insert a new note
    await insertNote(firebase_uid, client);

    // Step 5: Re-fetch to verify insertion
    await fetchUserData(firebase_uid, client);
  });
}

// Usage:
// import { runSupabaseFirebaseTest } from '@/lib/supabaseFirebaseTest';
// runSupabaseFirebaseTest();
