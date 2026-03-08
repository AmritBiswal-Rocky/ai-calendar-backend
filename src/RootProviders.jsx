// ─────────────────────────────────────────────
// src/RootProviders.jsx
// Single-source Providers (CRASH-SAFE)
// - No duplicate providers
// - Root error boundary prevents white screen
// - Deterministic provider order
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseToken } from '@/lib/auth';

import { UIProvider } from './context/UIContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { TaskProvider } from './context/TaskContext';
import { NoteProvider } from './context/NoteContext';
import { EventProvider } from './context/EventContext';

// ─────────────────────────────────────────────
// Global Error Boundary (ROOT LEVEL)
// ─────────────────────────────────────────────
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    // 🚨 If ANY provider crashes, this WILL log
    console.error('❌ RootProviders crash:', error);
    console.error('📍 Component stack:', info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fee2e2',
            color: '#7f1d1d',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                marginBottom: 16,
              }}
            >
              ❌ Application crashed during initialization
            </div>

            <pre
              style={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                background: '#ffffff',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #fecaca',
              }}
            >
              {this.state.error?.message || 'Unknown error'}
            </pre>

            <div style={{ marginTop: 16, opacity: 0.85 }}>
              Open DevTools → Console for the full stack trace.
            </div>
          </div>
        </div>
      );
    }

    // 🚨 MUST ALWAYS render children
    return this.props.children;
  }
}

// ─────────────────────────────────────────────
// Provider Tree (ORDER MATTERS)
// Router → UI → Auth → Socket → App Data
// ─────────────────────────────────────────────
export default function RootProviders({ children }) {
  // 🔄 Firebase auth state listener – refresh token for Supabase on auth changes
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await getFirebaseToken(); // refresh token so Supabase RLS sees latest JWT
          console.log('🔐 Firebase token refreshed for Supabase');
        } catch (e) {
          console.warn('⚠️ Failed to refresh Firebase token after auth change:', e);
        }
      }
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  return (
    <RootErrorBoundary>
      <UIProvider>
        <AuthProvider>
          <SocketProvider>
            <TaskProvider>
              <NoteProvider>
                <EventProvider>{children}</EventProvider>
              </NoteProvider>
            </TaskProvider>
          </SocketProvider>
        </AuthProvider>
      </UIProvider>
    </RootErrorBoundary>
  );
}
