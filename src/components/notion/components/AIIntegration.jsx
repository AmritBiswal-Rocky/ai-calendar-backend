// src/components/notion/components/AIIntegration.jsx
import React from 'react';
import { Brain as LucideBrain } from 'lucide-react';

const AIIntegration = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 
                 hover:bg-gray-300 dark:hover:bg-gray-600 
                 text-gray-800 dark:text-gray-100 
                 font-medium py-2 px-4 rounded-lg shadow-sm 
                 transition focus:outline-none focus:ring-2 
                 focus:ring-blue-400"
    >
      <LucideBrain className="h-5 w-5" />
      <span>AI</span>
    </button>
  );
};

export default AIIntegration;
