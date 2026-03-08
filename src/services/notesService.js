// ─────────────────────────────────────────────
// src/services/notesService.js
// Notes CRUD via Backend API (Firebase Auth enforced)
// Firebase Auth = source of truth for firebase_uid
// ─────────────────────────────────────────────

import { getFirebaseToken } from '../lib/auth';

// ─────────────────────────────────────────────
// CREATE NOTE
// ─────────────────────────────────────────────
export async function createNote({ title, content }) {
  const token = await getFirebaseToken();
  if (!token) {
    return { data: null, error: new Error('Not authenticated') };
  }

  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      return { data: null, error: new Error(`Failed to create note (status ${res.status})`) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// ─────────────────────────────────────────────
// GET NOTES (current user only via backend auth)
// ─────────────────────────────────────────────
export async function getNotes() {
  const token = await getFirebaseToken();
  if (!token) {
    return { data: [], error: new Error('Not authenticated') };
  }

  try {
    const res = await fetch('/api/notes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { data: [], error: new Error(`Failed to fetch notes (status ${res.status})`) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
}

// ─────────────────────────────────────────────
// UPDATE NOTE
// ─────────────────────────────────────────────
export async function updateNote(id, updates) {
  const token = await getFirebaseToken();
  if (!token || !id) {
    return { data: null, error: new Error('Invalid request') };
  }

  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      return { data: null, error: new Error(`Failed to update note (status ${res.status})`) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// ─────────────────────────────────────────────
// DELETE NOTE
// ─────────────────────────────────────────────
export async function deleteNote(id) {
  const token = await getFirebaseToken();
  if (!token || !id) {
    return { error: new Error('Invalid request') };
  }

  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { error: new Error(`Failed to delete note (status ${res.status})`) };
    }

    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

// ─────────────────────────────────────────────
// Default service object (for convenient imports)
// ─────────────────────────────────────────────

const notesService = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};

export default notesService;
