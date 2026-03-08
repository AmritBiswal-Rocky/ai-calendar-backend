// src/components/ComposeButton.jsx
import React from 'react';
import { Plus as LucidePlus } from 'lucide-react';

const ComposeButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      title="New Note"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 active:scale-95 
                 text-white rounded-full p-4 shadow-lg transition-transform duration-200 
                 flex items-center justify-center focus:outline-none focus:ring-2 
                 focus:ring-green-400"
    >
      <LucidePlus className="h-6 w-6" />
    </button>
  );
};

export default ComposeButton;
