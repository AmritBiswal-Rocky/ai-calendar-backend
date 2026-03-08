import React, { useEffect, useState, useCallback } from 'react';
import NoteFolders from './notes/NoteFolders';
import supabase from '@/lib/supabaseClient';
import { useNotes } from '@/context/NoteContext'; // ✅ updated path

export default function NoteApp() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { notes, setNotes, addNote, updateNote, deleteNote } = useNotes();

  // ✅ useCallback ensures fetchNotes reference is stable
  const fetchNotes = useCallback(
    async (folderId) => {
      if (!folderId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch error:', error.message);
      } else {
        setNotes(data);
      }
      setLoading(false);
    },
    [setNotes]
  );

  useEffect(() => {
    if (!selectedFolder) return;
    fetchNotes(selectedFolder.id);
  }, [selectedFolder, fetchNotes]); // ✅ no ESLint warning

  const handleSaveNote = async () => {
    if (!noteText.trim() || !selectedFolder) return;

    try {
      const token = await ensureAuth();
      if (!token) throw new Error('Not authenticated');

      if (editingNoteId) {
        const { data, error } = await supabase
          .from('notes')
          .update({ 
            content: noteText,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNoteId)
          .eq('firebase_uid', user.firebase_uid)
          .select()
          .single();

        if (error) {
          console.error('❌ Update failed:', error.message);
        } else {
          updateNote(data);
        }
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ 
            folder_id: selectedFolder.id,
            content: noteText,
            firebase_uid: user.firebase_uid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('❌ Insert failed:', error.message);
        } else if (data) {
          addNote(data);
        }
      }
      
      setNoteText('');
      setEditingNoteId(null);
    } catch (error) {
      console.error('❌ Save failed:', error.message);
    }
  };

  const handleEdit = (note) => {
    setEditingNoteId(note.id);
    setNoteText(note.content);
  };

  const handleDelete = async (id) => {
    try {
      const token = await ensureAuth();
      if (!token) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('firebase_uid', user.firebase_uid);
        
      if (error) {
        console.error('❌ Delete failed:', error.message);
      } else {
        deleteNote(id);
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  const filteredNotes = notes
    .filter((note) => note.folder_id === selectedFolder?.id)
    .filter((note) => note.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📝 Notes App</h1>

      <NoteFolders selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} />

      {selectedFolder ? (
        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Notes in: {selectedFolder.name}</h2>

          <textarea
            placeholder="Write or edit note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full border rounded p-3 text-gray-800 h-28"
          />

          <button
            onClick={handleSaveNote}
            className={`px-4 py-2 rounded text-white ${
              editingNoteId
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {editingNoteId ? '✏️ Update Note' : '💾 Save Note'}
          </button>

          {/* 🔍 Search Bar */}
          <input
            type="text"
            placeholder="🔍 Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border p-2 rounded mt-4"
          />

          {/* 📄 Notes Display */}
          <div className="mt-4 space-y-3">
            <h3 className="text-lg font-medium">📄 Saved Notes</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-gray-500">No matching notes found.</p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg bg-white shadow hover:shadow-md transition p-4 relative group"
                >
                  <p className="text-gray-800">{note.content}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition space-x-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">📂 Select a folder to view or add notes.</p>
      )}
    </div>
  );
}
