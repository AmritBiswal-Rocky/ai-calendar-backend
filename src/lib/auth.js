// ─────────────────────────────────────────────
// src/lib/auth.js
// Firebase → auth ONLY
// Supabase → database ONLY (anon client + RLS)
// NO Supabase auth headers
// NO Supabase sessions
// ─────────────────────────────────────────────

import { getAuth } from 'firebase/auth';

/**
 * Get the current Firebase user's ID token via the global auth instance.
 * Returns null if there is no logged-in user.
 */
export async function getFirebaseToken() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return null;

  // Force refresh token to avoid using stale JWT
  return await user.getIdToken(true);
}

/**
 * Ensures Firebase authentication is ready.
 * This function DOES NOT interact with Supabase.
 *
 * @param {Object|null} firebaseUser
 * @returns {Promise<string|null>} Firebase ID token
 */
export const ensureAuth = async (firebaseUser) => {
  if (!firebaseUser) {
    console.warn('ensureAuth: No Firebase user');
    return null;
  }

  try {
    // Force-refresh Firebase ID token
    const token = await firebaseUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('ensureAuth: Failed to obtain Firebase token', error);
    return null;
  }
};

/**
 * Role checks are NOT supported on frontend
 * when using anon Supabase client.
 * Must be done on backend.
 */
export const hasRole = async () => {
  console.warn('hasRole: Role checks must be performed on backend');
  return false;
};

/**
 * Supabase does not know Firebase users in this architecture.
 */
export const getCurrentFirebaseUid = async () => {
  console.warn('getCurrentFirebaseUid: Not available on frontend');
  return null;
};
