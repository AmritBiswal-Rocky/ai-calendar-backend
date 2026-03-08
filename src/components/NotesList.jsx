// src/components/NotesList.jsx
import React, { useEffect, useState } from 'react';
import { getNotes, createNote, deleteNote } from '../hooks/useNotes';

export default function NotesList({ folderId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      const data = await getNotes(folderId);
      setNotes(data);
      setLoading(false);
    };
    loadNotes();
  }, [folderId]);

  const handleAdd = async () => {
    if (!newNote) return;
    const added = await createNote({ content: newNote, folder_id: folderId });
    if (added) setNewNote('');
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
  };

  if (loading) return <p>Loading notes...</p>;

  return (
    <div>
      <input
        type="text"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="New note"
      />
      <button onClick={handleAdd}>Add</button>

      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            {n.content} <button onClick={() => handleDelete(n.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
