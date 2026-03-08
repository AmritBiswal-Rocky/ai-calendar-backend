// Chat UI (bubbles + history) + AI Output Save
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { handleSaveOutput } from '../lib/handleAIOutput';
import SaveAIImage from './DEEMENTUM/SaveAIImage';

function AIOutput({ imageUrl }) {
  if (!imageUrl) return null;

  return (
    <div className="flex flex-col gap-2 max-w-xs">
      <img src={imageUrl} alt="AI Generated" className="rounded-lg shadow" />
      <SaveAIImage imageUrl={imageUrl} />
    </div>
  );
}

function RadelesChat({ messages, activeModel, typing = false }) {
  const { googleAccessToken } = useAuth?.() ?? {};
  const lastMessageRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  // Auto-save AI outputs (text, image, video) to Google Docs or Cloud Storage
  useEffect(() => {
    if (!messages?.length || !googleAccessToken) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'ai' || lastMsg.role === 'bot') {
      const aiOutput = {};

      if (lastMsg.content?.includes('data:image') || lastMsg.type === 'image') {
        aiOutput.type = 'image';
        aiOutput.file = lastMsg.file || lastMsg.content;
      } else if (lastMsg.type === 'video') {
        aiOutput.type = 'video';
        aiOutput.file = lastMsg.file;
      } else {
        aiOutput.type = 'text';
        aiOutput.text = lastMsg.content ?? lastMsg.text;
      }

      handleSaveOutput(aiOutput, googleAccessToken);
    }
  }, [messages, googleAccessToken]);

  const renderAvatar = (role) => {
    if (role === 'user') {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
          🙂
        </div>
      );
    }

    if (role === 'bot' || role === 'ai') {
      return (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
          🤖
        </div>
      );
    }

    return null;
  };

  const renderBubble = (msg) => {
    if (msg.role === 'user') {
      return (
        <div className="px-4 py-2 rounded-2xl max-w-xs text-sm bg-indigo-600 text-white rounded-br-sm">
          {msg.content ?? msg.text}
        </div>
      );
    }

    if (msg.role === 'bot' || msg.role === 'ai') {
      const imageUrl =
        msg.type === 'image' ? msg.file || msg.content : undefined;
      const isDataImage = typeof msg.content === 'string' && msg.content.startsWith('data:image');

      if (imageUrl || isDataImage) {
        const resolvedUrl = imageUrl || msg.content;
        return <AIOutput imageUrl={resolvedUrl} />;
      }

      return (
        <div className="px-4 py-2 rounded-2xl max-w-xs text-sm bg-gray-100 text-gray-800 rounded-bl-sm">
          {msg.content ?? msg.text}
        </div>
      );
    }

    return (
      <div className="px-4 py-2 rounded-2xl max-w-xs text-sm bg-yellow-100 text-gray-700">
        {msg.content ?? msg.text}
      </div>
    );
  };

  if (!messages?.length && !typing) {
    return (
      <p className="text-gray-400 text-center my-auto">Start chatting with {activeModel}...</p>
    );
  }

  return (
    <>
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        const leftAvatar = !isUser ? renderAvatar(msg.role) : null;
        const rightAvatar = isUser ? renderAvatar(msg.role) : null;

        return (
          <div
            key={i}
            className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            ref={i === messages.length - 1 ? lastMessageRef : null}
          >
            {!isUser && leftAvatar}
            {renderBubble(msg)}
            {isUser && rightAvatar}
          </div>
        );
      })}

      {typing && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          {renderAvatar('bot')}
          <div className="px-4 py-2 rounded-2xl bg-gray-100 animate-pulse">typing...</div>
        </div>
      )}
    </>
  );
}

export default RadelesChat;
