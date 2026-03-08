// src/api.js
// Minimal fetch-based API helpers that always include the Firebase ID token

import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Helper to get Firebase ID token
export const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');
  return user.getIdToken();
};

// Create a task (primary backend route)
export const createTask = async (task) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

// Upsert profile (matches backend route: /profile/upsert)
export const upsertProfile = async (profile) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/profile/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

// Notes (compat endpoints), if you want fetch-based versions
export const createNote = async (note) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/note/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export const updateNote = async (noteId, updates) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/note/update/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export const deleteNote = async (noteId) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/note/delete/${noteId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};
