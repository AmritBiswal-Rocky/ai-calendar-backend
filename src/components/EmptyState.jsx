// src/components/EmptyState.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const EmptyState = ({ icon: Icon, title, actionLabel, onAction }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Icon */}
      {Icon && <Icon className="w-16 h-16 text-gray-400 mb-4" />}

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h2>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4 rounded-2xl px-6 py-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
