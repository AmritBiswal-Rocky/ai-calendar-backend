// src/utils/api.js
// Unified API utilities
// Firebase Auth → Backend / Supabase (ANON + RLS)
// CATEGORY C FIXED
// ─────────────────────────────────────────────

import axios from 'axios';
import supabase from '@/lib/supabaseClient';
import { getAuth } from 'firebase/auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ─────────────────────────────────────────────
// Axios instance for backend
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────
// Attach Firebase ID token automatically
// ─────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const fbUser = auth.currentUser;

      if (fbUser) {
        const token = await fbUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Error attaching auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Global response error handler
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      console.error('API Error:', err.response.data);
    } else {
      console.error('Network Error:', err.message);
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────
// Supabase REST wrapper (ANON + Firebase JWT)
// ─────────────────────────────────────────────
export async function fetchFromSupabase(table, method = 'GET', body = null, query = '') {
  const auth = getAuth();
  const fbUser = auth.currentUser;
  const token = fbUser ? await fbUser.getIdToken() : null;

  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[Supabase ${method}] ${table} error:`, err);
    throw err;
  }

  return res.json();
}

// ─────────────────────────────────────────────
// Backend wrapper
// ─────────────────────────────────────────────
export async function fetchFromBackend(path, method = 'GET', body = null) {
  const res = await api.request({
    url: path,
    method,
    data: body,
  });
  return res.data;
}

// ─────────────────────────────────────────────
// Backend: Tasks
// ─────────────────────────────────────────────
export async function createTask(task) {
  // task must already include firebase_uid
  const res = await api.post('/tasks', task);
  return res.data;
}

// ─────────────────────────────────────────────
// Generic fetch with Firebase auth
// ─────────────────────────────────────────────
export async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const fbUser = auth.currentUser;
  const token = fbUser ? await fbUser.getIdToken() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────
// Profile upsert (Firebase → Backend)
// ─────────────────────────────────────────────
export async function upsertProfile(firebaseUser) {
  if (!firebaseUser?.uid || !firebaseUser?.email) return;

  const body = {
    firebase_uid: firebaseUser.uid,
    full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
    email: firebaseUser.email,
    avatar_url: firebaseUser.photoURL || null,
  };

  const res = await api.post('/profile/upsert', body);
  return res.data;
}

// ─────────────────────────────────────────────
// Backend: Notes (legacy compatibility)
// ─────────────────────────────────────────────
export async function createNoteBackend(note) {
  // note must include firebase_uid
  const res = await api.post('/note/create', note);
  return res.data;
}

export async function updateNoteBackend(noteId, updates) {
  const res = await api.put(`/note/update/${noteId}`, updates);
  return res.data;
}

export async function deleteNoteBackend(noteId) {
  const res = await api.delete(`/note/delete/${noteId}`);
  return res.data;
}

export default api;
