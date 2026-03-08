// src/api/googleDrive.js
// Lightweight helpers to init gapi and get an access token for Drive uploads

import { loadGapiInsideDOM } from 'gapi-script';

let gapiReady = false;

export async function initGapi({
  apiKey,
  clientId,
  scope = 'https://www.googleapis.com/auth/drive.file',
} = {}) {
  try {
    if (!window.gapi) {
      await loadGapiInsideDOM();
    }
    await new Promise((resolve) => window.gapi.load('client:auth2', resolve));
    if (!window.gapi.client || !window.gapi.auth2) return false;

    if (!window.gapi.client._apiKey) {
      await window.gapi.client.init({
        apiKey,
        clientId,
        scope,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
    }
    gapiReady = true;
    return true;
  } catch (e) {
    console.warn('gapi init failed:', e);
    return false;
  }
}

export function getAccessToken() {
  try {
    const token = window.gapi?.auth?.getToken?.();
    return token?.access_token || null;
  } catch {
    return null;
  }
}

export async function ensureSignedIn() {
  try {
    if (!gapiReady) return false;
    const auth2 = window.gapi.auth2.getAuthInstance();
    if (!auth2) return false;
    const isSignedIn = auth2.isSignedIn.get();
    if (!isSignedIn) {
      await auth2.signIn();
    }
    return true;
  } catch (e) {
    console.warn('gapi sign-in failed:', e);
    return false;
  }
}
