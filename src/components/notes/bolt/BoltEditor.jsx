// src/components/notes/bolt/BoltEditor.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

// Block-based editor scaffold for Bolt integration
// Persists blocks as JSON via onChange(JSON.stringify(blocks))
const BoltEditor = ({ note, user, onChange }) => {
  const [blocks, setBlocks] = useState([]);

  // Initialize blocks from note.content (JSON or plain text)
  useEffect(() => {
    if (!note) return;
    if (note?.content) {
      try {
        const parsed = JSON.parse(note.content);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
          return;
        }
      } catch (_) {
        // fall through to plain text
      }
      setBlocks([{ id: Date.now(), type: 'paragraph', text: String(note.content || '') }]);
    } else {
      setBlocks([{ id: Date.now(), type: 'paragraph', text: '' }]);
    }
  }, [note?.id]);

  // Helper to persist
  const persist = (nextBlocks) => {
    setBlocks(nextBlocks);
    onChange?.(JSON.stringify(nextBlocks));
  };

  // Update a block's text
  const updateBlock = (id, newText) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, text: newText } : b));
    persist(updated);
  };

  // Add a new block
  const addBlock = (type = 'paragraph') => {
    const newBlock = { id: Date.now(), type, text: '' };
    persist([...(blocks || []), newBlock]);
  };

  // AI Suggestion via backend proxy (Google Generative AI)
  const generateAISuggestion = async (block) => {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: block?.text || '' }),
      });
      const data = await res.json();
      const aiText = data?.output || block?.text || '';
      updateBlock(block.id, aiText);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('AI generation error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-500">
        Editing: <span className="font-medium">{note?.title || 'Untitled'}</span>
      </div>

      {(blocks || []).map((block) => (
        <motion.div
          key={block.id}
          whileHover={{ scale: 1.01 }}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all"
        >
          <textarea
            className="w-full bg-transparent resize-none outline-none"
            value={block.text}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder={block.type === 'heading' ? 'Heading…' : 'Write here…'}
          />
          <button
            type="button"
            className="mt-1 text-sm text-blue-600 hover:underline"
            onClick={() => generateAISuggestion(block)}
          >
            AI Suggest
          </button>
        </motion.div>
      ))}

      <div>
        <button
          type="button"
          className="mt-2 p-2 bg-blue-100 rounded-lg text-blue-700 font-semibold hover:bg-blue-200 transition"
          onClick={() => addBlock('paragraph')}
        >
          + Add Block
        </button>
      </div>
    </div>
  );
};

BoltEditor.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    content: PropTypes.string,
  }),
  user: PropTypes.any,
  onChange: PropTypes.func,
};

export default BoltEditor;
