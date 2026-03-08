import React, { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { upsertProfile } from '../utils/api';
import { signInWithGoogle } from '../auth/firebaseSignIn';

export default function Login() {
  const user = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      handleUserRedirect();
    }
  }, [user]);

  const handleUserRedirect = async () => {
    setLoading(true);
    try {
      await upsertProfile(user);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error upserting profile:', err);
      setErrorMsg('Failed to update profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      await signInWithGoogle();

      console.log('✅ Signed in successfully!');
    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      setErrorMsg(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Welcome to Deementum</h1>
      <p className="text-gray-600 mb-8">
        Your AI-powered productivity hub for calendars, notes, and collaboration.
      </p>
      
      {errorMsg && (
        <p className="mb-4 text-red-600 font-medium text-center">
          {errorMsg}
        </p>
      )}
      
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
}
