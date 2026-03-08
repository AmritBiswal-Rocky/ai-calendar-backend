import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  // ─────────────────────────────────────────────
  // Ensure Supabase profile exists (idempotent)
  // ─────────────────────────────────────────────
  const ensureProfileRow = async (firebaseUser) => {
    if (!firebaseUser) return;

    // Inject Firebase JWT into Supabase headers
    await ensureAuth(firebaseUser);

    const firebaseUid = firebaseUser.uid;

    const { data, error } = await supabase
      .from('profiles')
      .select('firebase_uid')
      .eq('firebase_uid', firebaseUid)
      .single();

    // Create profile if missing
    if (error && error.code === 'PGRST116') {
      const { error: insertError } = await supabase.from('profiles').insert([
        {
          firebase_uid: firebaseUid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          avatar_url: firebaseUser.photoURL || null,
          nationality: 'Unknown',
        },
      ]);

      if (insertError) {
        console.error('❌ Failed to create profile:', insertError);
      }
    }
  };

  // ─────────────────────────────────────────────
  // Email / Password Login or Signup
  // ─────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const firebaseUser = userCredential.user;

      await ensureProfileRow(firebaseUser);

      toast.success(
        isSignUp ? `Welcome, ${firebaseUser.email}!` : `Welcome back, ${firebaseUser.email}!`
      );

      navigate('/app/calendar');
    } catch (error) {
      console.error(error);
      toast.error(isSignUp ? 'Sign-up failed.' : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Google Login
  // ─────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      await ensureProfileRow(firebaseUser);

      toast.success(`Welcome, ${firebaseUser.displayName || firebaseUser.email || 'there'}!`);

      navigate('/app/calendar');
    } catch (error) {
      console.error(error);
      toast.error('Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded shadow bg-white relative">
      {loading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 rounded">
          <div className="loader" />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-center">{isSignUp ? 'Sign Up' : 'Login'}</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        disabled={loading}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        disabled={loading}
      />

      <div className="flex items-center mb-4">
        <input
          id="rememberMe"
          type="checkbox"
          className="mr-2"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={loading}
        />
        <label htmlFor="rememberMe" className="text-sm">
          Remember Me
        </label>
      </div>

      <p
        className="text-sm text-blue-500 hover:underline cursor-pointer mb-4"
        onClick={handleForgotPassword}
      >
        Forgot Password?
      </p>

      <button
        onClick={handleLogin}
        disabled={loading}
        className={`w-full py-2 rounded mb-2 text-white ${
          loading
            ? 'bg-gray-400'
            : isSignUp
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
      </button>

      <p
        className="text-sm text-blue-500 hover:underline cursor-pointer mt-2 mb-2 text-center"
        onClick={() => setIsSignUp((v) => !v)}
      >
        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </p>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`w-full py-2 rounded text-white ${
          loading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {loading ? 'Please wait...' : 'Sign in with Google'}
      </button>
    </div>
  );
}
