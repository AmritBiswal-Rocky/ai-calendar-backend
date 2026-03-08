// ─────────────────────────────────────────────
// src/lib/googleConnect.js
// Single, user-triggered Google OAuth entry point
// - NEVER auto-initializes
// - NEVER throws
// - SAFE for React render lifecycle
// ─────────────────────────────────────────────

import { safeInitGoogleClient } from '@/api/googleDriveAuth';

// Internal state (module-scoped, safe)
let googleInitialized = false;
let googleInitializing = false;

/**
 * Connect Google APIs
 * MUST be called ONLY from a user gesture (onClick)
 */
export async function connectGoogle() {
  // Already connected
  if (googleInitialized) {
    return true;
  }

  // Prevent parallel init attempts
  if (googleInitializing) {
    return false;
  }

  googleInitializing = true;

  try {
    const ok = await safeInitGoogleClient();

    if (ok) {
      googleInitialized = true;
      console.log('✅ Google connected (user-triggered)');
      return true;
    }

    console.warn('⚠️ Google initialization failed');
    return false;
  } catch (err) {
    // CRITICAL: never throw
    console.warn('⚠️ Google connect aborted:', err);
    return false;
  } finally {
    googleInitializing = false;
  }
}

/**
 * Utility: check if Google is already connected
 * (Read-only; no side effects)
 */
export function isGoogleConnected() {
  return googleInitialized;
}
