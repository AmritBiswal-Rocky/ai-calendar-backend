// src/components/NoteModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTrap from 'focus-trap-react';
import toast from 'react-hot-toast';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -15,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const LegacyNoteModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [noteTitle, setNoteTitle] = useState(initialData?.title || '');
  const [noteContent, setNoteContent] = useState(initialData?.content || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNoteTitle(initialData?.title || '');
      setNoteContent(initialData?.content || '');
      setError('');
      if (inputRef.current) inputRef.current.focus();
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!noteTitle.trim() && !noteContent.trim()) {
      setError('Note cannot be empty.');
      toast.error('Note cannot be empty.');
      return;
    }

    try {
      onSave({ title: noteTitle.trim(), content: noteContent.trim() });
      toast.success(initialData ? 'Note updated!' : 'Note created!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save note.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap
          focusTrapOptions={{
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            initialFocus: () => modalRef.current,
          }}
        >
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close notes modal"
              className="absolute inset-0 bg-black bg-opacity-50 cursor-pointer"
              variants={backdropVariants}
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-lg w-full z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="note-modal-title"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onClose();
                }
              }}
            >
              <h2 id="note-modal-title" className="text-lg font-semibold mb-4">
                {initialData ? 'Edit Note' : 'Add Note'}
              </h2>

              <input
                type="text"
                placeholder="Note Title"
                className="border rounded p-2 w-full mb-3"
                ref={inputRef}
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />

              <textarea
                placeholder="Note Content"
                className="border rounded p-2 w-full h-32 resize-none"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};

// New simplified modal wrapper as default export
// Usage: <NoteModal isOpen={...} onClose={...}>...modal content...</NoteModal>
export default function NoteModal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { LegacyNoteModal };
