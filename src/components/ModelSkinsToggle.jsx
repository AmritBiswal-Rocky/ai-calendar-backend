import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeLocalStorage } from '@/utils/storage';

export default function ModelSkinsToggle() {
  const [skin, setSkin] = useState('default');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const stored = safeLocalStorage.getItem('app-skin');
    if (stored) {
      setSkin(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-skin', skin);
    }
    safeLocalStorage.setItem('app-skin', skin);

    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 700);
    return () => clearTimeout(timer);
  }, [skin]);

  const skins = [
    { id: 'default', label: 'Classic' },
    { id: 'neon', label: 'Neon' },
    { id: 'pastel', label: 'Pastel' },
  ];

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="flex gap-3 items-center justify-center">
        {skins.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSkin(id)}
            className={`px-4 py-2 rounded-lg border transition-all duration-300 font-medium shadow-sm ${
              skin === id
                ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                : 'bg-muted hover:bg-accent/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {animating && (
          <motion.div
            key={skin}
            className="fixed inset-0 pointer-events-none z-[9999]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              background:
                skin === 'neon'
                  ? 'radial-gradient(circle at center, rgba(0,255,255,0.25), transparent 70%)'
                  : skin === 'pastel'
                  ? 'radial-gradient(circle at center, rgba(255,182,193,0.25), transparent 70%)'
                  : 'radial-gradient(circle at center, rgba(173,216,230,0.25), transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
