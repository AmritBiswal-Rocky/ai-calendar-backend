// ─────────────────────────────────────────────────────────────
// src/lib/gapiClient.js
// SAFE Google OAuth2 (GIS) + gapi loader
// - No storage access
// - No render-time crashes
// - Explicit guards everywhere
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// Internal State (in-memory only)
// ─────────────────────────────────────────────
let gapiLoaded = false;
let gsiLoaded = false;
let gapiInitializing = false;
let tokenClient = null;
let accessToken = null;

// ─────────────────────────────────────────────
// Discovery Docs
// ─────────────────────────────────────────────
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  'https://photoslibrary.googleapis.com/$discovery/rest?version=v1',
];

// ─────────────────────────────────────────────
// OAuth Scopes
// ─────────────────────────────────────────────
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// ─────────────────────────────────────────────
// 1️⃣ Load gapi.js (SAFE, NEVER REJECTS)
// ─────────────────────────────────────────────
export function loadGapi() {
  return new Promise((resolve) => {
    if (!isBrowser()) return resolve();
    if (gapiLoaded) return resolve();

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      gapiLoaded = true;
      resolve();
    };

    script.onerror = () => {
      console.warn('⚠️ gapi script failed to load');
      resolve(); // NEVER reject
    };

    document.head.appendChild(script);
  });
}

// ─────────────────────────────────────────────
// 2️⃣ Load Google Identity Services (SAFE)
// ─────────────────────────────────────────────
export function loadGIS() {
  return new Promise((resolve) => {
    if (!isBrowser()) return resolve();
    if (gsiLoaded) return resolve();

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      gsiLoaded = true;
      resolve();
    };

    script.onerror = () => {
      console.warn('⚠️ GIS script failed to load');
      resolve();
    };

    document.head.appendChild(script);
  });
}

// ─────────────────────────────────────────────
// 3️⃣ Initialize gapi client (NO THROW, NO BLOCK)
// ─────────────────────────────────────────────
export async function initGapiClient() {
  if (!isBrowser()) return false;
  if (gapiInitializing) return false;

  gapiInitializing = true;

  try {
    await loadGapi();

    if (!window.gapi) {
      console.warn('⚠️ gapi unavailable');
      return false;
    }

    await new Promise((resolve) => {
      window.gapi.load('client', {
        callback: resolve,
        onerror: resolve, // NEVER reject
      });
    });

    await window.gapi.client.init({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    });

    console.log('✅ gapi client initialized');
    return true;
  } catch (err) {
    console.error('❌ gapi init failed:', err);
    return false;
  } finally {
    gapiInitializing = false;
  }
}

// ─────────────────────────────────────────────
// 4️⃣ Initialize GIS Token Client (SAFE)
// ─────────────────────────────────────────────
export async function initGIS() {
  if (!isBrowser()) return null;

  await loadGIS();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    console.warn('⚠️ Google OAuth2 unavailable');
    return null;
  }

  tokenClient = oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: () => {}, // overwritten per request
  });

  return tokenClient;
}

// ─────────────────────────────────────────────
// 5️⃣ Sign In (USER-TRIGGERED ONLY)
// ─────────────────────────────────────────────
export async function signIn() {
  if (!isBrowser()) return null;

  if (!tokenClient) {
    await initGIS();
  }

  if (!tokenClient) {
    console.warn('⚠️ Token client unavailable');
    return null;
  }

  return new Promise((resolve) => {
    tokenClient.callback = (resp) => {
      if (resp?.access_token) {
        accessToken = resp.access_token;
        console.log('🔑 Google access token acquired');
      }
      resolve(resp || null);
    };

    try {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error('❌ Token request failed:', err);
      resolve(null);
    }
  });
}

// ─────────────────────────────────────────────
// 6️⃣ Sign Out (SAFE)
// ─────────────────────────────────────────────
export function signOut() {
  if (!isBrowser()) return;
  if (!accessToken) return;

  try {
    window.google?.accounts?.oauth2?.revoke(accessToken, () => {
      console.log('🚪 Google token revoked');
      accessToken = null;
    });
  } catch (err) {
    console.error('❌ Token revoke failed:', err);
    accessToken = null;
  }
}

// ─────────────────────────────────────────────
// 7️⃣ Get Access Token (IN-MEMORY ONLY)
// ─────────────────────────────────────────────
export function getAccessToken() {
  return accessToken;
}

// ─────────────────────────────────────────────
// 8️⃣ Google Photos Upload (SAFE, USER FLOW)
// ─────────────────────────────────────────────
export async function uploadPhoto(file) {
  if (!file) return null;

  if (!accessToken) {
    await signIn();
  }

  if (!accessToken) {
    console.warn('⚠️ Upload aborted — no auth');
    return null;
  }

  try {
    // Upload raw bytes
    const uploadRes = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-File-Name': file.name,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: file,
    });

    const uploadToken = await uploadRes.text();

    const createRes = await window.gapi.client.request({
      path: 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
      method: 'POST',
      body: {
        newMediaItems: [
          {
            description: 'Uploaded via Deementum',
            simpleMediaItem: { uploadToken },
          },
        ],
      },
    });

    return createRes?.result || null;
  } catch (err) {
    console.error('❌ Photo upload failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// 9️⃣ Expose gapi client (SAFE)
// ─────────────────────────────────────────────
export function getGapiClient() {
  return isBrowser() ? window.gapi?.client || null : null;
}
