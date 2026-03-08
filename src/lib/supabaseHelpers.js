// src/lib/supabaseHelpers.js
// Lightweight helpers to insert tasks and notes via Supabase, respecting RLS

import supabase, { getSupabaseClient } from './supabaseClient';

/**
 * Create a task for the current authenticated user.
 * RLS is expected to use auth.firebase_uid() on the server; we do not pass firebase_uid here.
 */
export async function createTask({
  title,
  description,
  priority = 'low',
  category = 'general',
  date = new Date(),
}) {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Not authenticated: no Firebase user found');
  }

  const { data, error } = await client
    .from('tasks')
    .insert([
      {
        title,
        description,
        priority,
        category,
        date,
      },
    ])
    .select();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error inserting task:', error);
    throw error;
  }

  return data; // array of inserted rows
}

/**
 * Create a note for the current authenticated user.
 * RLS is expected to use auth.firebase_uid() on the server; we do not pass firebase_uid here.
 */
export async function createNote({ title, content }) {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Not authenticated: no Firebase user found');
  }

  const { data, error } = await client
    .from('notes')
    .insert([
      {
        title,
        content,
      },
    ])
    .select();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error inserting note:', error);
    throw error;
  }

  return data; // array of inserted rows
}

// Example usage (import in a React component):
// import { createTask, createNote } from '@/lib/supabaseHelpers';
// await createTask({ title: 'My Test Task', description: 'This is a test', priority: 'high' });
// await createNote({ title: 'My Test Note', content: 'This is a test note' });
