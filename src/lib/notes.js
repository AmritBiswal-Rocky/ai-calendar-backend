// Notes CRUD helpers — Supabase anon client ONLY
// Firebase is used only to supply firebase_uid
// ─────────────────────────────────────────────

import supabase from './supabaseClient';

// Timestamp helper
function nowISO() {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
// FETCH NOTES FOR USER
// ─────────────────────────────────────────────
export async function fetchNotes(firebaseUid) {
  if (!firebaseUid) return [];

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ fetchNotes error:', error);
    throw error;
  }

  return data || [];
}

// ─────────────────────────────────────────────
// CREATE NOTE
// ─────────────────────────────────────────────
export async function createNote({ title, content = '', firebase_uid }) {
  if (!firebase_uid) {
    throw new Error('firebase_uid is required to create note');
  }

  const timestamp = nowISO();

  const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        title,
        content,
        firebase_uid,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('❌ createNote error:', error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// UPDATE NOTE
// ─────────────────────────────────────────────
export async function updateNote(id, updates = {}, firebaseUid) {
  if (!id) throw new Error('Note id is required');
  if (!firebaseUid) throw new Error('firebase_uid is required for update');

  const { data, error } = await supabase
    .from('notes')
    .update({
      ...updates,
      updated_at: nowISO(),
    })
    .eq('id', id)
    .eq('firebase_uid', firebaseUid) // RLS constraint
    .select()
    .single();

  if (error) {
    console.error('❌ updateNote error:', error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// DELETE NOTE
// ─────────────────────────────────────────────
export async function deleteNote(id, firebaseUid) {
  if (!id) throw new Error('Note id is required');
  if (!firebaseUid) throw new Error('firebase_uid is required for delete');

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('firebase_uid', firebaseUid); // RLS protection

  if (error) {
    console.error('❌ deleteNote error:', error);
    throw error;
  }

  return true;
}

// ─────────────────────────────────────────────
// TOGGLE NOTE COMPLETION
// ─────────────────────────────────────────────
export async function toggleNoteCompletion(id, completed, firebaseUid) {
  if (!id) throw new Error('Note id is required');
  if (!firebaseUid) throw new Error('firebase_uid is required for toggling completion');

  const { data, error } = await supabase
    .from('notes')
    .update({
      completed: !!completed,
      updated_at: nowISO(),
    })
    .eq('id', id)
    .eq('firebase_uid', firebaseUid)
    .select()
    .single();

  if (error) {
    console.error('❌ toggleNoteCompletion error:', error);
    throw error;
  }

  return data;
}
