import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadelesProfilePopup({
  open,
  onClose,
  user,
  stats = {},
  onLogout,
  onPersonalize,
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopyEmail = async () => {
    if (!user?.email) return;
    await navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-end bg-black/30"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="mt-20 mr-6 w-[320px] rounded-2xl bg-white shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative h-24 bg-gradient-to-r from-indigo-500 to-violet-600">
            <img
              src={user?.photoURL || '/avatar.png'}
              alt="avatar"
              className="absolute -bottom-8 left-4 h-16 w-16 rounded-full border-4 border-white object-cover"
            />
          </div>

          {/* Body */}
          <div className="pt-10 px-4 pb-4">
            <div className="mb-2">
              <h3 className="text-lg font-semibold leading-tight">
                {user?.displayName || 'User'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="truncate">{user?.email}</span>
                <button
                  onClick={handleCopyEmail}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="Chats" value={stats.chats ?? 0} />
              <Stat label="Saved" value={stats.saved ?? 0} />
              <Stat label="Credits" value={stats.credits ?? 0} />
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <ActionButton onClick={onPersonalize} label="Personalize" />
              <ActionButton onClick={onLogout} label="Logout" danger />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ActionButton({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition
        ${danger
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
      `}
    >
      {label}
    </button>
  );
}
