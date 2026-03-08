// ─────────────────────────────────────────────
// src/api/googleDriveAuth.js
// SAFE Google OAuth2 (GIS) + GAPI Loader
// Drive + Docs + Photos + Calendar
// ─────────────────────────────────────────────

/* global google */

// ─────────────────────────────────────────────
// 🔧 Environment
// ─────────────────────────────────────────────
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// OAuth scopes
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// ─────────────────────────────────────────────
// In-memory state ONLY (no storage)
// ─────────────────────────────────────────────
let tokenClient = null;
let accessToken = null;
let expiresAt = 0;
let gapiReady = false;
let gisReady = false;

// ─────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────
function isBrowser() {
  return typeof window !== 'undefined';
}

// ─────────────────────────────────────────────
// Load GIS (SAFE – never throws)
// ─────────────────────────────────────────────
export async function loadGIS() {
  if (!isBrowser()) return false;
  if (gisReady || window.google?.accounts?.oauth2) {
    gisReady = true;
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      gisReady = true;
      resolve(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load GIS');
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

// ─────────────────────────────────────────────
// Load GAPI + Discovery Docs (SAFE)
// ─────────────────────────────────────────────
export async function loadGAPI() {
  if (!isBrowser()) return false;
  if (gapiReady) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;

    script.onload = async () => {
      try {
        await new Promise((r) => window.gapi.load('client', { callback: r, onerror: r }));

        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
            'https://docs.googleapis.com/$discovery/rest?version=v1',
          ],
        });

        gapiReady = true;
        resolve(true);
      } catch (err) {
        console.error('❌ GAPI init failed:', err);
        resolve(false);
      }
    };

    script.onerror = () => {
      console.error('❌ Failed to load GAPI');
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

// ─────────────────────────────────────────────
// Initialize OAuth Token Client (SAFE)
// ─────────────────────────────────────────────
export async function initOAuth() {
  if (!isBrowser()) return false;

  const ok = await loadGIS();
  if (!ok || !window.google?.accounts?.oauth2) return false;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}, // assigned dynamically
  });

  console.log('✅ GIS OAuth initialized');
  return true;
}

// ─────────────────────────────────────────────
// Popup → Request Token (USER-INITIATED)
// ─────────────────────────────────────────────
export async function requestAccessToken() {
  if (!isBrowser()) return null;

  if (!tokenClient) {
    const ok = await initOAuth();
    if (!ok) return null;
  }

  return new Promise((resolve) => {
    tokenClient.callback = (resp) => {
      if (!resp?.access_token) {
        resolve(null);
        return;
      }

      accessToken = resp.access_token;
      expiresAt = Date.now() + resp.expires_in * 1000;

      console.log('🔐 Google access token acquired');
      resolve(accessToken);
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

// ─────────────────────────────────────────────
// Auto-refresh Token Getter (SAFE)
// ─────────────────────────────────────────────
export async function getAccessToken() {
  if (!accessToken || Date.now() >= expiresAt) {
    return await requestAccessToken();
  }
  return accessToken;
}

// 🔥 REQUIRED EXPORT (do not remove)
export const getGoogleAccessToken = getAccessToken;

// ─────────────────────────────────────────────
// Combined Safe Initializer (App.jsx depends on this)
// ─────────────────────────────────────────────
export async function safeInitGoogleClient() {
  try {
    const gis = await loadGIS();
    const gapi = await loadGAPI();
    const oauth = await initOAuth();

    const ok = gis && gapi && oauth;
    if (ok) console.log('✅ safeInitGoogleClient completed');
    return ok;
  } catch (err) {
    console.error('❌ safeInitGoogleClient failed:', err);
    return false;
  }
}

// App-level init (backward compatible)
export async function initGoogleAPI() {
  return await safeInitGoogleClient();
}

// ─────────────────────────────────────────────
// Drive Upload (SAFE)
// ─────────────────────────────────────────────
export async function uploadToDrive(file, folderId = null) {
  if (!file) throw new Error('No file provided');

  const ok = await loadGAPI();
  if (!ok) throw new Error('GAPI not ready');

  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const metadata = {
    name: file.name,
    mimeType: file.type,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    })
  );
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Drive upload failed: ${await res.text()}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────
// Google Photos Upload (SAFE)
// ─────────────────────────────────────────────
export async function uploadToGooglePhotos(file) {
  if (!file) throw new Error('No file provided');

  const token = await getAccessToken();
  if (!token) throw new Error('Authentication required');

  const uploadRes = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-File-Name': file.name,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: file,
  });

  const uploadToken = await uploadRes.text();

  const createRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newMediaItems: [{ simpleMediaItem: { uploadToken } }],
    }),
  });

  return createRes.json();
}

// ─────────────────────────────────────────────
// Google Docs
// ─────────────────────────────────────────────
export async function createGoogleDoc(title = 'New Calendar Note') {
  const ok = await loadGAPI();
  if (!ok) throw new Error('GAPI not ready');

  await getAccessToken();
  const res = await window.gapi.client.docs.documents.create({ title });
  return res.result;
}

// ─────────────────────────────────────────────
// Google Calendar
// ─────────────────────────────────────────────
export async function createCalendarEvent(event) {
  const ok = await loadGAPI();
  if (!ok) throw new Error('GAPI not ready');

  await getAccessToken();
  const res = await window.gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return res.result;
}
