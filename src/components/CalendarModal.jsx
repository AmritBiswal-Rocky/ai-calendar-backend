// src/components/CalendarModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTrap from 'focus-trap-react';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const CalendarModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [eventTitle, setEventTitle] = useState(initialData?.title || '');
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Set initial focus to the first input field when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave({ title: eventTitle });
    onClose();
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
            ref={modalRef}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-lg w-full">
              <h2 className="text-lg font-semibold mb-4">Add/Edit Event</h2>
              <input
                type="text"
                placeholder="Event Title"
                className="border rounded p-2 w-full"
                ref={inputRef} // Replaces autoFocus
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};

export default CalendarModal;
