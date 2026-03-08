// ─────────────────────────────────────────────
// Notes Context - Single Source of Truth
// Uses notesService + Socket.IO to keep all UIs in sync
// ─────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';

import notesService from '../services/notesService';
import { useSocket } from './SocketContext';

const NoteContext = createContext();

export const NoteProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  // ⭐ Centralized fetch
  const fetchAllNotes = async () => {
    try {
      setLoading(true);
      const res = await notesService.getNotes();

      const safeNotes = Array.isArray(res)
        ? res
        : Array.isArray(res?.notes)
        ? res.notes
        : [];

      setNotes(safeNotes);
    } catch (err) {
      console.error('Notes load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ CRUD wrappers
  const addNote = async (note) => {
    await notesService.createNote(note);
    await fetchAllNotes();
  };

  const updateNote = async (id, updates) => {
    await notesService.updateNote(id, updates);
    await fetchAllNotes();
  };

  const deleteNote = async (id) => {
    await notesService.deleteNote(id);
    await fetchAllNotes();
  };

  // Initial load
  useEffect(() => {
    fetchAllNotes();
  }, []);

  // ⭐ Socket sync (important)
  useEffect(() => {
    if (!socket) return;

    socket.on('note_created', fetchAllNotes);
    socket.on('note_updated', fetchAllNotes);
    socket.on('note_deleted', fetchAllNotes);

    return () => {
      socket.off('note_created', fetchAllNotes);
      socket.off('note_updated', fetchAllNotes);
      socket.off('note_deleted', fetchAllNotes);
    };
  }, [socket]);

  return (
    <NoteContext.Provider
      value={{
        notes,
        loading,
        addNote,
        updateNote,
        deleteNote,
        refreshNotes: fetchAllNotes,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => useContext(NoteContext);
