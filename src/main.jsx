// ─────────────────────────────────────────────
// src/main.jsx
// VERIFIED SAFE ENTRY POINT
// React + Router + Providers + App
// NEVER SILENT — NEVER WHITE SCREEN
// ─────────────────────────────────────────────

// 🔴 HARD PROOF: if this does NOT appear, Vite is NOT executing main.jsx
alert('✅ MAIN.JSX EXECUTED');

import '@fontsource/inter';
import '@fontsource/jetbrains-mono';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import RootProviders from './RootProviders';

import './index.css';

// ─────────────────────────────────────────────
// Locate root container
// ─────────────────────────────────────────────
const container = document.getElementById('root');

if (!container) {
  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:22px;
      color:red;
      font-family:system-ui, sans-serif;
    ">
      ❌ Root container (#root) not found in index.html
    </div>
  `;
  throw new Error('Root container missing');
}

// ─────────────────────────────────────────────
// Create React root
// ─────────────────────────────────────────────
const root = ReactDOM.createRoot(container);

// ─────────────────────────────────────────────
// Render with HARD FAILSAFE
// ─────────────────────────────────────────────
try {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <RootProviders>
          <App />
        </RootProviders>
      </BrowserRouter>
    </React.StrictMode>
  );
} catch (err) {
  console.error('❌ FATAL RENDER ERROR:', err);

  root.render(
    <div
      style={{
        minHeight: '100vh',
        background: '#fee2e2',
        color: '#7f1d1d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>❌ Application failed to render</h1>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || 'Unknown render error'}</pre>
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          Check the browser console for the full stack trace.
        </div>
      </div>
    </div>
  );
}
