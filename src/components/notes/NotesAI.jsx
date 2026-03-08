// src/components/notes/NotesAI.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import HoverWrapper from '../HoverWrapper';
import BoltEditor from './bolt/BoltEditor';
import supabase from '@/lib/supabaseClient';
import { useSocket } from '@/context/SocketContext';

const NotesAI = ({ notes, setNotes, user }) => {
  const [activeNote, setActiveNote] = useState(null);
  const socket = useSocket();

  // Default selection
  useEffect(() => {
    if (Array.isArray(notes) && notes.length > 0 && !activeNote) setActiveNote(notes[0]);
  }, [notes]);

  // Optional: load notes from Supabase if not already loaded upstream
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('firebase_uid', user.id)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) setNotes?.(data);
    };
    fetchNotes();
  }, [user?.id, setNotes]);

  // Real-time updates via socket (support both note:update and note_updated events)
  useEffect(() => {
    if (!socket) return;
    const handleNoteUpdate = (updatedNote) => {
      if (!updatedNote?.id) return;
      setNotes?.((prev) => (prev || []).map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      if (activeNote?.id === updatedNote.id) setActiveNote(updatedNote);
    };

    socket.on('note:update', handleNoteUpdate);
    socket.on('note_updated', handleNoteUpdate);

    return () => {
      socket.off('note:update', handleNoteUpdate);
      socket.off('note_updated', handleNoteUpdate);
    };
  }, [socket, activeNote?.id, setNotes]);

  // Persist editor changes
  const handleChange = async (updatedContent) => {
    if (!activeNote?.id) return;

    // 1) Local state
    setNotes?.((prev) =>
      (prev || []).map((n) => (n.id === activeNote.id ? { ...n, content: updatedContent } : n))
    );
    setActiveNote((prev) => ({ ...(prev || {}), content: updatedContent }));

    // 2) Save to Supabase
    const { data, error } = await supabase
      .from('notes')
      .update({ content: updatedContent, updated_at: new Date().toISOString() })
      .eq('id', activeNote.id)
      .select()
      .single();

    // 3) Emit to other clients if saved
    if (!error && data && socket) {
      socket.emit('note:update', data);
      socket.emit('note_updated', data); // compatibility
    }
  };

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 flex flex-col gap-2 overflow-y-auto max-h-[80vh]">
        {(notes || []).map((note) => (
          <HoverWrapper key={note.id}>
            <div
              className={`p-3 rounded-2xl cursor-pointer ${
                activeNote?.id === note.id ? 'bg-blue-50' : 'bg-white'
              }`}
              onClick={() => setActiveNote(note)}
            >
              <h3 className="font-semibold truncate">{note.title || 'Untitled'}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">{note.content}</p>
            </div>
          </HoverWrapper>
        ))}
      </div>

      {/* Editor */}
      <div className="hidden md:block w-2/3 bg-white rounded-2xl shadow p-4 max-h-[80vh] overflow-y-auto">
        {activeNote ? (
          <BoltEditor note={activeNote} user={user} onChange={handleChange} />
        ) : (
          <p className="text-gray-400">Select a note to edit</p>
        )}
      </div>
    </div>
  );
};

NotesAI.propTypes = {
  notes: PropTypes.array.isRequired,
  setNotes: PropTypes.func,
  user: PropTypes.any,
};

export default NotesAI;
