// src/pages/NotesPage.jsx
import React, { useState } from 'react';
import { useNotes } from '../context/NoteContext';

const NotesPage = () => {
  const { notes, addNote, updateNote, deleteNote, loading } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addNote(title, content);
    setTitle('');
    setContent('');
  };

  if (loading) return <div>Loading nourse...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Nourse</h2>

      <div className="mb-4 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nourse title"
          className="border p-2 rounded w-full"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nourse content"
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Nourse
        </button>
      </div>

      <ul>
        {notes.map((note) => (
          <li key={note.id} className="border p-3 mb-2 rounded bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{note.title}</h3>
              <div className="flex gap-2">
                <button className="text-red-500" onClick={() => deleteNote(note.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-1">{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesPage;
