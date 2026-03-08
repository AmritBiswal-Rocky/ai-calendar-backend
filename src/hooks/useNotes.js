// src/hooks/useNotes.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchWithAuth } from '../utils/api';
import { getAuth } from 'firebase/auth';
import useNotesAuth from './useNotesAuth';
import { useAuth } from '@/context/AuthContext';

export async function getNotes(folderId) {
  const auth = getAuth();
  const user = auth.currentUser;
  const res = await fetchWithAuth(`/api/notes?folder=${encodeURIComponent(folderId ?? '')}`, {
    userId: user?.firebase_uid,
  });
  if (!res || !res.ok) return [];
  return await res.json();
}

export async function createNote(note) {
  const auth = getAuth();
  const user = auth.currentUser;
  const res = await fetchWithAuth('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
    userId: user?.firebase_uid,
  });
  if (!res || !res.ok) return null;
  return await res.json();
}

export async function deleteNote(noteId) {
  const auth = getAuth();
  const user = auth.currentUser;
  const res = await fetchWithAuth(`/api/notes/${noteId}`, {
    method: 'DELETE',
    userId: user?.firebase_uid,
  });
  if (!res || !res.ok) return false;
  return true;
}

// Simple hook variant that fetches notes directly from Flask
export const useNotesSimple = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/notes');
        setNotes(res.data || []);
      } catch (err) {
        console.error('Notes fetch failed:', err);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return { notes, loading, setNotes };
};

// Legacy auth-aware notes hook kept for backward compatibility (now named export)
export function useNotesAuthLegacy() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await axios.get('http://localhost:5000/notes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes(res.data || []);
        setError(null);
      } catch (err) {
        console.error('Notes fetch failed:', err);
        setError(err);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  return { notes, loading, error };
}

// New default export: Auth-aware hook using contexts/AuthContext per request
export default function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return; // wait for auth

    async function fetchNotes() {
      try {
        setLoading(true);
        const res = await fetch(`/api/notes?firebase_uid=${user.firebase_uid}`);
        const data = await res.json();
        setNotes(data || []);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, [user]);

  return { notes, loading, error };
}
