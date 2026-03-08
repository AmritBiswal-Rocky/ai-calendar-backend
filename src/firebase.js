// ─────────────────────────────────────────────
// src/firebase.js
// Firebase v9+ — LAZY, NON-BLOCKING INITIALIZATION
// Firebase = AUTH ONLY (on-demand)
// Supabase = DATABASE ONLY
// ─────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence,
} from 'firebase/auth';

// ─────────────────────────────────────────────
// Firebase configuration (Vite env)
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─────────────────────────────────────────────
// 🔒 INTERNAL SINGLETONS (LAZY)
// ─────────────────────────────────────────────
let _app = null;
let _auth = null;
let _provider = null;

// ─────────────────────────────────────────────
// Lazy Firebase App (SAFE)
// ─────────────────────────────────────────────
function getFirebaseApp() {
  if (_app) return _app;
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return _app;
}

// ─────────────────────────────────────────────
// Lazy Auth (NO NETWORK AT BOOT)
// ─────────────────────────────────────────────
export function getFirebaseAuth() {
  if (_auth) return _auth;

  const app = getFirebaseApp();
  const auth = getAuth(app);

  // 🔒 IN-MEMORY ONLY — NEVER BLOCK RENDER
  setPersistence(auth, inMemoryPersistence).catch(() => {
    // Silent by design (prevents incognito crashes)
  });

  _auth = auth;
  return _auth;
}

// ─────────────────────────────────────────────
// ⚠️ Compatibility export (DO NOT REMOVE)
// Required by SocketContext + AuthContext
// ─────────────────────────────────────────────
export const auth = getFirebaseAuth();

// ─────────────────────────────────────────────
// Lazy Google Provider
// ─────────────────────────────────────────────
function getGoogleProvider() {
  if (_provider) return _provider;
  _provider = new GoogleAuthProvider();
  return _provider;
}

// ─────────────────────────────────────────────
// AUTH HELPERS (ON-DEMAND ONLY)
// ─────────────────────────────────────────────

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = getGoogleProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginWithEmail(email, password) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(email, password) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export async function getFirebaseIdToken() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}
