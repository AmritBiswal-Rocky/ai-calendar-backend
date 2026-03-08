// src/components/AddNote.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '@/utils/api';

const AddNote = ({ onNoteAdded }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    try {
      setLoading(true);

      // Send to Flask backend with Supabase JWT automatically attached
      const res = await fetchWithAuth('/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res && (res.status === 200 || res.status === 201)) {
        toast.success('Note added successfully!');
        setTitle('');
        setContent('');
        if (onNoteAdded) {
          const data = await res.json();
          onNoteAdded(data); // let parent refresh list
        }
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to add note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleAddNote}
      className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-md flex flex-col gap-3"
    >
      <input
        type="text"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-800"
      />
      <textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-800 h-32"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Add Note'}
      </button>
    </form>
  );
};

export default AddNote;
