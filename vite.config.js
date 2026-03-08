/* ─────────────────────────────────────────────
   vite.config.js — CLEAN + ERROR-FREE VERSION
   FIXED:
   ✔ Port locked to 5174 (Google OAuth compatible)
   ✔ No silent fallback (strictPort)
   ✔ React + HMR stable
   ✔ Socket.IO + Supabase safe
   ───────────────────────────────────────────── */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5174, // ✅ REQUIRED: must match Google OAuth
    strictPort: true, // ❗ fail immediately if port is busy
    open: true,

    hmr: {
      overlay: true, // show runtime errors clearly
    },

    // ❌ DO NOT add CSP headers here
    // ❌ They break Google Identity Services, Firebase Auth, and HMR
  },

  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['axios', 'firebase', 'socket.io-client'],
        },
      },
    },
  },

  preview: {
    port: 5174,
    open: true,
  },
});
