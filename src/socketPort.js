// ─────────────────────────────────────────────
// src/socketPort.js
// Centralized backend URL holder (HTTP + Socket.IO)
// Single source of truth for backend address
// ─────────────────────────────────────────────

let backendUrl = 'http://127.0.0.1:5000';

/**
 * Set backend base URL.
 * Must be called ONCE during app bootstrap (App.jsx).
 */
export const setBackendPort = (newUrl) => {
  if (!newUrl || typeof newUrl !== 'string') {
    console.warn('⚠️ Attempted to set invalid backend URL:', newUrl);
    return;
  }

  backendUrl = newUrl.replace(/\/$/, ''); // remove trailing slash
  console.log('🔄 Backend URL set to:', backendUrl);
};

/**
 * Get backend base URL.
 * Safe fallback ensures sockets never connect to undefined.
 */
export const getBackendPort = () => {
  if (!backendUrl) {
    console.warn('⚠️ Backend URL not set — falling back to default');
    return 'http://127.0.0.1:5000';
  }
  return backendUrl;
};
