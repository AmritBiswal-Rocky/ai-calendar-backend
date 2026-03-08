// src/components/TaskModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTrap from 'focus-trap-react';
import toast from 'react-hot-toast';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const TaskModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [taskTitle, setTaskTitle] = useState(initialData?.title || '');
  const [taskDescription, setTaskDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Reset modal fields when opening
  useEffect(() => {
    if (isOpen) {
      setTaskTitle(initialData?.title || '');
      setTaskDescription(initialData?.description || '');
      setDueDate(initialData?.dueDate || '');
      inputRef.current?.focus();
    }
  }, [isOpen, initialData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error('Task title is required.');
      return;
    }
    setLoading(true);
    try {
      await onSave({ title: taskTitle, description: taskDescription, dueDate });
      toast.success('Task saved!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save task.');
    } finally {
      setLoading(false);
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
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close modal backdrop"
              className="absolute inset-0 bg-black bg-opacity-50"
              variants={backdropVariants}
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-lg w-full z-10 overflow-y-auto max-h-[90vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="task-modal-title"
              ref={modalRef}
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
              <h2 id="task-modal-title" className="text-lg font-semibold mb-4">
                {initialData ? 'Edit Task' : 'Add Task'}
              </h2>

              <form onSubmit={handleSave}>
                <input
                  type="text"
                  placeholder="Task Title"
                  className="border rounded p-2 w-full mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
                  ref={inputRef}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <textarea
                  placeholder="Task Description"
                  className="border rounded p-2 w-full h-24 resize-none mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
                <input
                  type="date"
                  className="border rounded p-2 w-full mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;
