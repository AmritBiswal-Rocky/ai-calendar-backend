// ─────────────────────────────────────────────
// src/App.jsx
// App shell (SAFE + MINIMAL)
// - NO providers
// - NO auth listeners
// - NO loading gates
// - ONLY backend lock + routes
// Providers live ONLY in RootProviders.jsx
// ─────────────────────────────────────────────

import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseToken } from '@/lib/auth';
import AppRoutes from './AppRoutes';
import { setBackendPort } from './socketPort';
import ErrorBoundary from './components/ErrorBoundary';

// ─────────────────────────────────────────────
// 🔒 Backend hard-lock (LOCAL DEV ONLY)
// ─────────────────────────────────────────────
const BACKEND_URL = 'http://127.0.0.1:5000';

export default function App() {
  // Side-effect only — NEVER blocks render
  useEffect(() => {
    setBackendPort(BACKEND_URL);
    console.log('🔐 Backend locked to', BACKEND_URL);
  }, []);

  // 🔄 Firebase auth state listener – keep token fresh for Supabase
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('🔐 Firebase user detected → refreshing token');
        await getFirebaseToken();
      } else {
        console.log('🚪 User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ ALWAYS render routes (NO CONDITIONS)
  return <ErrorBoundary><AppRoutes /></ErrorBoundary>;
}
