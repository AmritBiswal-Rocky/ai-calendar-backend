// ─────────────────────────────────────────────
// src/pages/GoogleTest.jsx
// Full Google API Test Page (OAuth + Drive + Photos)
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Drive + Picker + Photos scopes
const SCOPES =
  'https://www.googleapis.com/auth/drive.file ' +
  'https://www.googleapis.com/auth/photoslibrary.appendonly ' +
  'https://www.googleapis.com/auth/photoslibrary.readonly';

function GoogleTest() {
  const [authInstance, setAuthInstance] = useState(null);
  const [token, setToken] = useState(null);

  // ─────────────────────────────────────────────
  // LOAD GAPI (Google main JS SDK)
  // ─────────────────────────────────────────────
  const loadGapi = () => {
    console.log('🔵 Loading gapi...');
    gapi.load('client:auth2', async () => {
      console.log('🟢 gapi loaded');

      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          'https://photoslibrary.googleapis.com/$discovery/rest?version=v1',
        ],
      });

      console.log('🟩 gapi client initialized');

      const auth = gapi.auth2.getAuthInstance();
      setAuthInstance(auth);

      if (auth.isSignedIn.get()) {
        const t = auth.currentUser.get().getAuthResponse().access_token;
        setToken(t);
        console.log('🔐 Already signed in:', t);
      }
    });
  };

  // ─────────────────────────────────────────────
  // HANDLE LOGIN
  // ─────────────────────────────────────────────
  const login = async () => {
    if (!authInstance) return;

    try {
      const user = await authInstance.signIn();
      const t = user.getAuthResponse().access_token;
      setToken(t);
      console.log('🔑 Login success:', t);
    } catch (err) {
      console.error('❌ Login error', err);
    }
  };

  // ─────────────────────────────────────────────
  // GOOGLE DRIVE PICKER TEST
  // ─────────────────────────────────────────────
  const openPicker = () => {
    if (!token) return alert('Please login first');

    console.log('📂 Opening Google Drive Picker...');

    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setCallback((data) => {
        console.log('📁 PICKER RESULT:', data);
      })
      .build();

    picker.setVisible(true);
  };

  // ─────────────────────────────────────────────
  // GOOGLE PHOTOS LIBRARY TEST
  // ─────────────────────────────────────────────
  const testPhotos = async () => {
    if (!token) return alert('Please login first');

    console.log('🖼 Fetching Google Photos albums...');

    try {
      const res = await gapi.client.photoslibrary.albums.list();
      console.log('🖼 PHOTOS RESULT:', res.result);
    } catch (err) {
      console.error('❌ Photos API error:', err);
    }
  };

  useEffect(() => {
    loadGapi();
  }, []);

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">🔧 Google API Test Page</h1>

      <div className="space-y-4">
        <button onClick={loadGapi} className="px-4 py-2 bg-blue-600 rounded">
          Reload gapi
        </button>

        <button onClick={login} className="px-4 py-2 bg-green-600 rounded">
          Login with Google (OAuth)
        </button>

        <button onClick={openPicker} className="px-4 py-2 bg-yellow-600 rounded">
          Open Google Drive Picker
        </button>

        <button onClick={testPhotos} className="px-4 py-2 bg-purple-600 rounded">
          Test Google Photos Library
        </button>
      </div>

      <div className="mt-10">
        <p className="opacity-80">Access Token:</p>
        <p className="text-green-400 break-all mt-2">{token || 'None'}</p>
      </div>
    </div>
  );
}

export default GoogleTest;
