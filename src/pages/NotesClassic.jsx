// src/pages/NotesClassic.jsx
import React, { useState } from 'react';
import { useNotes } from '@/context/NoteContext';

export default function NotesClassic() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', content: '' });

  // ➕ Add new note
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addNote(newTitle, newContent);
    setNewTitle('');
    setNewContent('');
  };

  // Start editing with a local draft
  const startEdit = (note) => {
    setEditingId(note.id);
    setEditDraft({ title: note.title || '', content: note.content || '' });
  };

  // ✏️ Save updated note
  const handleUpdate = async (id) => {
    await updateNote(id, { title: editDraft.title, content: editDraft.content });
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📝 My Notes</h1>

      {/* Add Note Form */}
      <form onSubmit={handleAdd} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Title"
          className="w-full border rounded px-3 py-2"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          className="w-full border rounded px-3 py-2"
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Note
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {(notes || []).map((note) => (
          <div key={note.id} className="p-4 border rounded shadow-sm bg-white">
            {editingId === note.id ? (
              <>
                {/* Editing Mode */}
                <input
                  type="text"
                  value={editDraft.title}
                  className="w-full border rounded px-2 py-1 mb-2"
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                />
                <textarea
                  value={editDraft.content}
                  className="w-full border rounded px-2 py-1 mb-2"
                  rows={3}
                  onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))}
                />
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded mr-2"
                  onClick={() => handleUpdate(note.id)}
                >
                  Save
                </button>
                <button
                  className="px-3 py-1 bg-gray-400 text-white rounded"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {/* Display Mode */}
                <h2 className="text-lg font-semibold">{note.title}</h2>
                <p className="text-gray-700 whitespace-pre-line">{note.content}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => startEdit(note)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {(!notes || notes.length === 0) && (
          <p className="text-gray-500">No notes yet. Add one above!</p>
        )}
      </div>
    </div>
  );
}
