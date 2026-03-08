// ─────────────────────────────────────────────
// Unified Google API (Drive + Photos + Docs)
// OAuth only (NO API-key-only requests)
// ─────────────────────────────────────────────

import { gapi } from 'gapi-script';

// ─────────────────────────────────────────────
// 🔧 ENV
// ─────────────────────────────────────────────
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/documents',
].join(' ');

let gapiLoaded = false;

// ─────────────────────────────────────────────
// ⭐ Legacy init (safe to keep)
// ─────────────────────────────────────────────
export async function initGapi() {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/photoslibrary/v1/rest',
            'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
          ],
        });
        resolve(true);
      } catch (err) {
        console.error('initGapi error:', err);
        reject(err);
      }
    });
  });
}

// ─────────────────────────────────────────────
// 🚀 Initialize Google API (Primary)
// ─────────────────────────────────────────────
export async function initGoogleApi() {
  if (gapiLoaded) return true;

  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/photoslibrary/v1/rest',
            'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
          ],
        });
        gapiLoaded = true;
        resolve(true);
      } catch (err) {
        console.error('❌ Google API init failed:', err);
        reject(err);
      }
    });
  });
}

// ─────────────────────────────────────────────
// 🔐 Ensure OAuth login
// ─────────────────────────────────────────────
export async function ensureGoogleAuth() {
  await initGoogleApi();

  const auth = gapi.auth2.getAuthInstance();
  if (!auth) throw new Error('Google Auth not initialized');

  if (!auth.isSignedIn.get()) {
    await auth.signIn();
  }

  return auth.currentUser.get();
}

// ─────────────────────────────────────────────
// ⭐ Sign-in helper
// ─────────────────────────────────────────────
export async function signInWithGoogle() {
  const user = await ensureGoogleAuth();
  return user.getBasicProfile();
}

// ─────────────────────────────────────────────
// 📁 UPLOAD → GOOGLE DRIVE (with progress)
// ─────────────────────────────────────────────
export async function uploadFileToDriveWithProgress(file, onProgress = () => {}) {
  await ensureGoogleAuth();
  const accessToken = gapi.auth.getToken()?.access_token;
  if (!accessToken) throw new Error('Missing Google access token');

  return new Promise((resolve, reject) => {
    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink'
    );
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          id: data.id,
          webViewLink: data.webViewLink,
          mimeType: file.type,
        });
      } else {
        console.error('❌ Drive upload failed:', xhr.responseText);
        reject(new Error('Drive upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Drive upload failed'));
    xhr.send(form);
  });
}

// ✅ Alias for CalendarEventModal
export const uploadFileToDrive = uploadFileToDriveWithProgress;

// ─────────────────────────────────────────────
// 🖼 UPLOAD → GOOGLE PHOTOS
// ─────────────────────────────────────────────
export async function uploadPhotoToGoogle(file) {
  await ensureGoogleAuth();
  const accessToken = gapi.auth.getToken()?.access_token;
  if (!accessToken) throw new Error('Missing Google access token');

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

  const createRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newMediaItems: [{ simpleMediaItem: { uploadToken } }] }),
  });

  const data = await createRes.json();
  if (!createRes.ok || data.error) {
    console.error('❌ Google Photos upload failed:', data);
    throw new Error('Google Photos upload failed');
  }

  return data;
}

// ─────────────────────────────────────────────
// 📂 LIST DRIVE FILES
// ─────────────────────────────────────────────
export async function listDriveFiles(pageSize = 50) {
  await ensureGoogleAuth();
  const accessToken = gapi.auth.getToken()?.access_token;
  if (!accessToken) throw new Error('Missing Google access token');

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,iconLink,thumbnailLink,createdTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error('❌ Drive list failed:', data);
    throw new Error('Failed to list Drive files');
  }

  return data.files || [];
}

// ─────────────────────────────────────────────
// 📝 CREATE GOOGLE DOC
// ─────────────────────────────────────────────
export async function createGoogleDoc(title = 'New Document') {
  await ensureGoogleAuth();
  const res = await gapi.client.docs.documents.create({ title });
  return res.result;
}

// ─────────────────────────────────────────────
// 🔄 LOGOUT
// ─────────────────────────────────────────────
export function googleLogout() {
  try {
    gapi.auth2.getAuthInstance()?.signOut();
  } catch (err) {
    console.error('Google logout error:', err);
  }
}

// ─────────────────────────────────────────────
// ✅ DEFAULT EXPORT
// ─────────────────────────────────────────────
export default {
  initGapi,
  initGoogleApi,
  ensureGoogleAuth,
  signInWithGoogle,
  uploadFileToDriveWithProgress,
  uploadFileToDrive,
  uploadPhotoToGoogle,
  listDriveFiles,
  createGoogleDoc,
  googleLogout,
};
