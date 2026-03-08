// ─────────────────────────────────────────────
// src/auth/firebaseSignIn.js
// Firebase Google Sign-in ONLY
// ❌ No Supabase token sync
// ✅ Firebase = authentication provider only
// ─────────────────────────────────────────────

import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseToken } from '@/lib/auth';

export async function signInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log('🔥 Firebase Google Login Success:', user.email);

    // 🔄 Immediately refresh Firebase ID token so Supabase RLS sees latest JWT
    try {
      await getFirebaseToken();
    } catch (e) {
      console.warn('getFirebaseToken() after Google sign-in failed', e);
    }

    // ✅ RETURN FIREBASE USER ONLY
    return user;
  } catch (err) {
    console.error('❌ Google Sign-in Error:', err);
    throw err;
  }
}
