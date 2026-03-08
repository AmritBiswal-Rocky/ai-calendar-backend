// src/components/LoginButton.jsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const LoginButton = () => {
  const { loginWithGoogle, loading } = useAuth();

  return (
    <button
      onClick={loginWithGoogle}
      disabled={loading}
      className="btn-primary px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Sign in with Google'}
    </button>
  );
};

export default LoginButton;
