// ─────────────────────────────────────────────
// src/components/Chat.jsx
// Simple Socket.IO Chat Component
// Logs messages from backend
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export default function Chat() {
  const socketContext = useSocket();

  useEffect(() => {
    if (!socketContext) return;

    // Listen for 'message' events from backend
    const handleMessage = (data) => {
      console.log('📩 New message:', data);
    };

    socketContext.on('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      socketContext.off('message', handleMessage);
    };
  }, [socketContext]);

  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-2">Socket.IO Chat Component</h2>
      <p className="text-sm text-gray-500">
        Check the console to see incoming messages from the WebSocket server.
      </p>
    </div>
  );
}
