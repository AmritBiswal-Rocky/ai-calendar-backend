// src/components/notion/components/BlockMenu.jsx
import React, { useState } from 'react';
import { Plus as LucidePlus } from 'lucide-react';
import { useSlate } from 'slate-react';
import { Transforms } from 'slate';

const BlockMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const editor = useSlate();

  const insertBlock = (type) => {
    if (!editor) return;

    const block = {
      type,
      children: [{ text: '' }],
    };

    Transforms.insertNodes(editor, block);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white 
                   font-medium py-2 px-4 rounded-lg shadow-md focus:outline-none 
                   focus:ring-2 focus:ring-blue-400 transition"
      >
        <LucidePlus className="h-5 w-5" />
        Add Block
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute mt-2 w-52 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1">
            <button
              onClick={() => insertBlock('heading-one')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Heading 1
            </button>
            <button
              onClick={() => insertBlock('heading-two')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Heading 2
            </button>
            <button
              onClick={() => insertBlock('heading-three')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Heading 3
            </button>
            <button
              onClick={() => insertBlock('bulleted-list')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Bulleted List
            </button>
            <button
              onClick={() => insertBlock('numbered-list')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Numbered List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockMenu;
