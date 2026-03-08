// ─────────────────────────────────────────────
// src/context/SocketContext.jsx
// Socket.IO Provider (CRASH-SAFE, NON-BLOCKING)
// - NO aliases (@/)
// - NEVER throws
// - NEVER blocks rendering
// - Socket is optional (app still loads if backend is down)
// ─────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { useAuth } from './AuthContext';

import {
  connectSocket,
  disconnectSocket,
  updateSocketToken,
  emitSocketEvent,
  getSocket,
  joinPersonalRoom,
} from '../socket';

import { getBackendPort } from '../socketPort';

// ─────────────────────────────────────────────
// Context (SAFE DEFAULT)
// ─────────────────────────────────────────────
export const SocketContext = createContext({
  socket: null,
  isConnected: false,
  emit: () => {},
  on: () => () => {},
  off: () => {},
});

export const useSocket = () => {
  // ❗ NEVER throw — throwing here = white screen
  return useContext(SocketContext);
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function SocketProvider({ children }) {
  const { user } = useAuth() || {};

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const initializedRef = useRef(false);
  const tokenRef = useRef(null);
  const joinedRoomRef = useRef(false);
  const cancelledRef = useRef(false);

  // ─────────────────────────────────────────────
  // Backend health check (NON-BLOCKING)
  // ─────────────────────────────────────────────
  const waitForBackend = async (timeout = 8000) => {
    const backendUrl = getBackendPort();
    if (!backendUrl) return false;

    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const res = await fetch(`${backendUrl}/health`, {
          cache: 'no-store',
        });
        if (res.ok) return true;
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  };

  // ─────────────────────────────────────────────
  // Socket lifecycle (PER LOGIN)
  // ─────────────────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false;

    // ───────── Logout → teardown ─────────
    if (!user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);

      initializedRef.current = false;
      tokenRef.current = null;
      joinedRoomRef.current = false;
      return;
    }

    // Prevent double init
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const token = await user.getIdToken(true);
        if (!token || cancelledRef.current) return;

        tokenRef.current = token;

        const backendReady = await waitForBackend();
        if (!backendReady || cancelledRef.current) {
          console.warn('⚠️ Backend not reachable — socket skipped');
          return;
        }

        const s = connectSocket(token);
        if (!s || cancelledRef.current) return;

        s.on('connect', () => {
          setIsConnected(true);

          if (!joinedRoomRef.current && user?.uid) {
            joinPersonalRoom(user.uid);
            joinedRoomRef.current = true;
          }
        });

        s.on('disconnect', () => {
          setIsConnected(false);
          joinedRoomRef.current = false;
        });

        s.on('connect_error', (err) => {
          console.warn('⚠️ Socket error:', err?.message || err);
        });

        setSocket(s);
      } catch (err) {
        console.error('❌ Socket init failed:', err);
      }
    })();

    return () => {
      cancelledRef.current = true;
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);

      initializedRef.current = false;
      tokenRef.current = null;
      joinedRoomRef.current = false;
    };
  }, [user]);

  // ─────────────────────────────────────────────
  // Token refresh (SAFE)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const refresh = async () => {
      try {
        const freshToken = await user.getIdToken(true);
        if (freshToken && freshToken !== tokenRef.current && !cancelled) {
          tokenRef.current = freshToken;
          updateSocketToken(freshToken);
        }
      } catch (err) {
        console.warn('⚠️ Socket token refresh failed');
      }
    };

    refresh();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ─────────────────────────────────────────────
  // Utilities (SAFE WRAPPERS)
  // ─────────────────────────────────────────────
  const emit = useMemo(() => emitSocketEvent, []);

  const on = useMemo(
    () => (event, handler) => {
      const s = getSocket();
      if (!s) return () => {};
      s.on(event, handler);
      return () => s.off(event, handler);
    },
    []
  );

  const off = useMemo(
    () => (event, handler) => {
      const s = getSocket();
      if (s) s.off(event, handler);
    },
    []
  );

  // ─────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────
  const value = useMemo(
    () => ({
      socket,
      isConnected,
      emit,
      on,
      off,
    }),
    [socket, isConnected, emit, on, off]
  );

  // ❗ NEVER gate children
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SocketProvider;
