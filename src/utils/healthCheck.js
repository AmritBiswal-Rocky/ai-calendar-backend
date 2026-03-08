// ─────────────────────────────────────────────
// src/utils/healthCheck.js
// Unified Health-Check for all APIs
// ─────────────────────────────────────────────

import { io } from 'socket.io-client';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase/auth';

/**
 * 🧪 Health Check for:
 * - Firebase Auth
 * - Socket.IO Backend
 * - Supabase Realtime
 * - Google API (gapi)
 * - Google Drive API
 * - Google Photos API
 */
export async function runHealthCheck() {
  console.log('🧪 Starting Deep System Health Check...\n');

  const results = {};

  // ─────────────────────────────────────────────
  // 1️⃣ Firebase Auth
  // ─────────────────────────────────────────────
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      results.firebase = {
        ok: true,
        firebase_uid: user.firebase_uid,
        tokenPreview: token.substring(0, 10) + '...',
      };
    } else {
      results.firebase = {
        ok: false,
        error: 'No Firebase user logged in',
      };
    }
  } catch (err) {
    results.firebase = { ok: false, error: err.message };
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Socket.IO Backend
  // ─────────────────────────────────────────────
  try {
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: false,
      timeout: 3000,
    });

    results.socket = await new Promise((resolve) => {
      let resolved = false;

      socket.on('connect', () => {
        resolved = true;
        resolve({ ok: true, socketId: socket.id });
        socket.disconnect();
      });

      socket.on('connect_error', (err) => {
        if (!resolved)
          resolve({
            ok: false,
            error: err.message,
          });
      });

      setTimeout(() => {
        if (!resolved) resolve({ ok: false, error: 'Timeout connecting' });
      }, 3000);
    });
  } catch (err) {
    results.socket = { ok: false, error: err.message };
  }

  // ─────────────────────────────────────────────
  // 3️⃣ Supabase Realtime Connection
  // ─────────────────────────────────────────────
  try {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    const channel = supabase.channel('health-check');

    results.supabase = await new Promise((resolve) => {
      let resolved = false;

      channel
        .on('presence', { event: 'sync' }, () => {
          if (!resolved) {
            resolved = true;
            resolve({ ok: true, message: 'Realtime connected' });
            channel.unsubscribe();
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && !resolved) {
            resolved = true;
            resolve({ ok: true, message: 'Realtime subscribed' });
          }
        });

      setTimeout(() => {
        if (!resolved)
          resolve({
            ok: false,
            error: 'Supabase realtime timeout',
          });
      }, 3000);
    });
  } catch (err) {
    results.supabase = { ok: false, error: err.message };
  }

  // ─────────────────────────────────────────────
  // 4️⃣ Google gapi init
  // ─────────────────────────────────────────────
  try {
    await new Promise((resolve, reject) => {
      if (window.gapi) {
        window.gapi.load('client:auth2', resolve);
      } else {
        reject(new Error('gapi not loaded'));
      }
    });

    results.gapi = { ok: true };
  } catch (err) {
    results.gapi = { ok: false, error: err.message };
  }

  // ─────────────────────────────────────────────
  // 5️⃣ Google Drive API
  // ─────────────────────────────────────────────
  try {
    if (!window.gapi?.client) throw new Error('gapi client not ready');

    await window.gapi.client.request({
      path: 'https://www.googleapis.com/drive/v3/about',
    });

    results.drive = { ok: true };
  } catch (err) {
    results.drive = { ok: false, error: err.message };
  }

  // ─────────────────────────────────────────────
  // 6️⃣ Google Photos API
  // ─────────────────────────────────────────────
  try {
    await window.gapi.client.request({
      path: 'https://photoslibrary.googleapis.com/v1/albums',
    });

    results.photos = { ok: true };
  } catch (err) {
    results.photos = { ok: false, error: err.message };
  }

  console.log('🧪 Health Check Results:\n', results);
  return results;
}
