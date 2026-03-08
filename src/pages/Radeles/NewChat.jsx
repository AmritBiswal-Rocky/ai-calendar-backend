// ─────────────────────────────────────────────
// src/pages/Radeles/NewChat.jsx
// Parent page that uses the NewChatActionMenu
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import NewChatActionMenu from '../../components/NewChatActionMenu';
import DeepResearch from '../DeepResearch'; // 👈 use as embedded component

export default function NewChat() {
  const [activeView, setActiveView] = useState('new-chat');
  // can be 'new-chat' or 'deep-research'

  // 📁 Handle uploaded files
  const handleFilesSelected = (files) => {
    console.log('Files uploaded:', files);
    // You can add logic here to preview or upload files
  };

  // 🧠 Handle Thinking mode
  const handleThinkingSelected = () => {
    console.log('Thinking mode selected');
    // Show your thinking API bar or logic here
  };

  // 🔍 Handle Deep Research click
  const handleDeepResearchSelected = () => {
    console.log('Deep Research selected — swapping to embedded page');
    setActiveView('deep-research');
  };

  // ⬅️ Go back to New Chat
  const handleBackToNewChat = () => {
    console.log('Returning to New Chat view');
    setActiveView('new-chat');
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* ✅ Radeles Chat Title Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Radeles Chat</h1>
          <p className="text-sm text-gray-500">
            {activeView === 'new-chat' ? 'New Chat' : 'Deep Research'}
          </p>
        </div>

        {/* Show Back button only in Deep Research view */}
        {activeView === 'deep-research' && (
          <button onClick={handleBackToNewChat} className="text-sm text-blue-600 hover:underline">
            ← Back
          </button>
        )}
      </div>

      {/* ✅ Conditional render of Deep Research or default New Chat */}
      {activeView === 'deep-research' ? (
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-[#0b0d1a]">
          <DeepResearch embedded />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {/* ➕ Action menu for file upload / thinking / deep research */}
          <NewChatActionMenu
            onFilesSelected={handleFilesSelected}
            onThinkingSelected={handleThinkingSelected}
            onDeepResearchSelected={handleDeepResearchSelected}
          />

          {/* 💬 Chat input or placeholder UI below */}
          <div className="mt-10 text-gray-500 text-sm">
            Select an action above to begin a new conversation.
          </div>
        </div>
      )}
    </div>
  );
}
