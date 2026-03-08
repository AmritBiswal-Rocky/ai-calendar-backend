// src/components/AnimatedModal.jsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTrap from 'focus-trap-react';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const AnimatedModal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      // Focus modal container
      modalRef.current?.focus();
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
            aria-labelledby="modal-title"
            tabIndex={-1}
            ref={modalRef}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          >
            <section
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-lg w-full"
              role="document"
            >
              <h2 id="modal-title" className="sr-only">
                Modal Dialog
              </h2>

              {children}

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Close
              </button>
            </section>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
