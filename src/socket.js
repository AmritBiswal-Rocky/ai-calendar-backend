// ─────────────────────────────────────────────
// src/socket.js
// Socket.IO Singleton (CRASH-SAFE, POLLING-ONLY)
// - NEVER throws
// - NEVER blocks UI
// - Backend optional
// - Token refresh safe
// ─────────────────────────────────────────────

import { io } from 'socket.io-client';
import { getBackendPort } from './socketPort';

// ─────────────────────────────────────────────
// Internal singleton state
// ─────────────────────────────────────────────
let socket = null;
let currentToken = null;
let connecting = false;
let pendingJoinRoom = null;

// Updaters (optional)
let taskUpdater = null;
let noteUpdater = null;
let eventUpdater = null;

// ─────────────────────────────────────────────
// Register updaters (SAFE)
// ─────────────────────────────────────────────
export const registerTaskUpdater = (cb) => {
  taskUpdater = typeof cb === 'function' ? cb : null;
};

export const registerNoteUpdater = (cb) => {
  noteUpdater = typeof cb === 'function' ? cb : null;
};

export const registerEventUpdater = (cb) => {
  eventUpdater = typeof cb === 'function' ? cb : null;
};

// ─────────────────────────────────────────────
// INTERNAL: Attach listeners (IDEMPOTENT)
// ─────────────────────────────────────────────
const attachListeners = (s) => {
  try {
    s.removeAllListeners();

    // ── Lifecycle
    s.on('connect', () => {
      console.log('🟢 [SOCKET] Connected:', s.id);
      connecting = false;

      if (pendingJoinRoom) {
        s.emit('join', { room: pendingJoinRoom });
        console.log('📌 Joined room:', pendingJoinRoom);
        pendingJoinRoom = null;
      }
    });

    s.on('disconnect', (reason) => {
      console.warn('🔴 [SOCKET] Disconnected:', reason);
      connecting = false;
    });

    s.on('connect_error', (err) => {
      console.warn('⚠️ [SOCKET] Connect error:', err?.message || err);
      connecting = false;
    });

    // ── Tasks
    s.on('task_created', (t) => taskUpdater?.('add', t));
    s.on('task_updated', (t) => taskUpdater?.('update', t));
    s.on('task_deleted', ({ id }) => taskUpdater?.('delete', id));

    // ── Notes
    s.on('note_created', (n) => noteUpdater?.('add', n));
    s.on('note_updated', (n) => noteUpdater?.('update', n));
    s.on('note_deleted', ({ id }) => noteUpdater?.('delete', id));

    // ── Events
    s.on('event_created', (e) => eventUpdater?.('add', e));
    s.on('event_updated', (e) => eventUpdater?.('update', e));
    s.on('event_deleted', ({ id }) => eventUpdater?.('delete', id));
  } catch (err) {
    console.error('❌ [SOCKET] Listener attach failed:', err);
  }
};

// ─────────────────────────────────────────────
// INTERNAL: Create socket instance
// ─────────────────────────────────────────────
const createSocket = (token) => {
  try {
    const backendUrl = getBackendPort();
    if (!backendUrl) {
      console.warn('⚠️ [SOCKET] No backend URL — socket skipped');
      return null;
    }

    console.log('🧩 [SOCKET] Creating socket →', backendUrl);

    currentToken = token;

    const s = io(backendUrl, {
      transports: ['polling'], // Werkzeug-safe
      upgrade: false,
      autoConnect: false,

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,

      timeout: 20000,
      auth: { token },
    });

    attachListeners(s);
    socket = s;
    return s;
  } catch (err) {
    console.error('❌ [SOCKET] Creation failed:', err);
    return null;
  }
};

// ─────────────────────────────────────────────
// PUBLIC: Connect / reuse socket
// ─────────────────────────────────────────────
export const connectSocket = (token) => {
  try {
    if (!token) {
      console.warn('⚠️ [SOCKET] connectSocket called without token');
      return null;
    }

    const backendUrl = getBackendPort();

    // First connection
    if (!socket) {
      const s = createSocket(token);
      if (!s) return null;
      connecting = true;
      s.connect();
      return s;
    }

    // Backend URL changed → rebuild
    if (socket.io?.uri !== backendUrl) {
      disconnectSocket();
      const s = createSocket(token);
      if (!s) return null;
      connecting = true;
      s.connect();
      return s;
    }

    // Token changed
    if (currentToken !== token) {
      currentToken = token;
      socket.auth = { token };
    }

    // Reconnect if needed
    if (!socket.connected && !connecting) {
      connecting = true;
      socket.connect();
    }

    return socket;
  } catch (err) {
    console.error('❌ [SOCKET] connectSocket failed:', err);
    return null;
  }
};

// ─────────────────────────────────────────────
// PUBLIC: Token refresh
// ─────────────────────────────────────────────
export const updateSocketToken = (newToken) => {
  try {
    if (!socket || !newToken || newToken === currentToken) return;

    currentToken = newToken;
    socket.auth = { token: newToken };

    if (socket.connected || connecting) {
      socket.disconnect();
      connecting = false;
    }

    setTimeout(() => {
      if (socket && !socket.connected && !connecting) {
        connecting = true;
        socket.connect();
      }
    }, 300);
  } catch (err) {
    console.warn('⚠️ [SOCKET] Token update failed');
  }
};

// ─────────────────────────────────────────────
// PUBLIC: Emit wrapper (SAFE)
// ─────────────────────────────────────────────
export const emitSocketEvent = (event, payload) => {
  try {
    if (!socket || !socket.connected) return;
    socket.emit(event, payload);
  } catch {
    /* ignore */
  }
};

// ─────────────────────────────────────────────
// PUBLIC: Join personal room
// ─────────────────────────────────────────────
export const joinPersonalRoom = (roomId) => {
  try {
    if (!roomId) return;

    if (socket?.connected) {
      socket.emit('join', { room: roomId });
    } else {
      pendingJoinRoom = roomId;
    }
  } catch {
    /* ignore */
  }
};

// ─────────────────────────────────────────────
// PUBLIC: Full disconnect
// ─────────────────────────────────────────────
export const disconnectSocket = () => {
  try {
    if (!socket) return;

    socket.removeAllListeners();
    socket.disconnect();
  } catch {
    /* ignore */
  } finally {
    socket = null;
    currentToken = null;
    connecting = false;
    pendingJoinRoom = null;
  }
};

// ─────────────────────────────────────────────
// Getter (SAFE)
// ─────────────────────────────────────────────
export const getSocket = () => socket;
