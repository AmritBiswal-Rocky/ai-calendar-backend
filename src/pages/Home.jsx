// ─────────────────────────────────────────────
// src/pages/Home.jsx
// Public Home / Login Page (SAFE, NON-BLOCKING)
// - ALWAYS renders UI
// - NEVER throws
// - Redirects only when user exists
// ─────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../firebase';

export default function Home() {
  const navigate = useNavigate();

  let user = null;

  // 🛡️ HARD SAFETY: AuthContext access wrapped
  try {
    const auth = useAuth();
    user = auth?.user ?? null;
  } catch (err) {
    console.error('❌ useAuth crashed in Home:', err);
  }

  // ─────────────────────────────────────────────
  // Redirect when authenticated (NON-BLOCKING)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      navigate('/app/calendar', { replace: true });
    }
  }, [user, navigate]);

  // ─────────────────────────────────────────────
  // Google Sign-In (SAFE)
  // ─────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect handled by effect above
    } catch (err) {
      console.error('❌ Google Sign-in failed:', err);
      alert('Google Sign-in failed. Please try again.');
    }
  };

  // ─────────────────────────────────────────────
  // PUBLIC UI — ALWAYS RENDERS
  // ─────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        fontSize: 22,
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          color: '#16a34a',
          fontWeight: 600,
          fontSize: 26,
        }}
      >
        ✅ HOME PAGE IS RENDERING
      </div>

      <div style={{ fontSize: 16, color: '#334155' }}>Public route loaded successfully.</div>

      <button
        onClick={handleGoogleSignIn}
        style={{
          padding: '12px 20px',
          fontSize: 16,
          borderRadius: 8,
          border: '1px solid #d1d5db',
          background: '#ffffff',
          cursor: 'pointer',
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
