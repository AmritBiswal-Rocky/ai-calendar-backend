// src/components/NoteCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabaseClient';

const NoteCard = ({ note, onEdit, onDelete }) => {
  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const token = await ensureAuth();
        if (!token) throw new Error('Not authenticated');
        
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', note.id)
          .eq('firebase_uid', user.firebase_uid);
          
        if (error) {
          console.error('Error deleting note:', error);
        } else {
          onDelete?.(note.id); // Notify parent
        }
      } catch (err) {
        console.error('Error in handleDelete:', err);
      }
    }
  };

  return (
    <motion.div
      className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25 }}
      onClick={() => onEdit?.(note)}
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent edit trigger
          handleDelete();
        }}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
      >
        Delete
      </button>

      {/* Note Title */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {note.title || 'Untitled'}
      </h3>

      {/* Note Content */}
      <p className="text-sm text-gray-600 dark:text-gray-300">{note.content || 'No content'}</p>
    </motion.div>
  );
};

export default NoteCard;
