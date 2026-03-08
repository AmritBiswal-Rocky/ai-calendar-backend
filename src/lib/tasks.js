// src/lib/tasks.js
// Task CRUD helpers using Supabase with RLS via Firebase-auth-backed session

import supabase, { getSupabaseClient } from './supabaseClient';

export async function fetchTasks(firebase_uid) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tasks?firebase_uid=eq.${firebase_uid}`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    console.error('Supabase REST error:', await res.text());
    throw new Error('Failed to fetch tasks');
  }

  return await res.json();
}

// Fetch all tasks for current authenticated user
export async function getTasks(user) {
  if (user?.firebase_uid) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('firebase_uid', user.firebase_uid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  const client = await getSupabaseClient();
  if (!client) throw new Error('Not authenticated: no Firebase user found');

  const { data, error } = await client
    .from('tasks')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Create a new task (RLS will set firebase_uid via auth.firebase_uid())
export async function createTask({
  title,
  description = '',
  priority = 'low',
  category = 'general',
  date = new Date(),
}) {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Not authenticated: no Firebase user found');

  const { data, error } = await client
    .from('tasks')
    .insert([{ title, description, priority, category, date }])
    .select();

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

// Update an existing task by id
export async function updateTask(id, updates) {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Not authenticated: no Firebase user found');

  const { data, error } = await client
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

// Delete a task by id
export async function deleteTask(id) {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Not authenticated: no Firebase user found');

  const { data, error } = await client
    .from('tasks')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
