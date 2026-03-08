// src/hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';

/**
 * Custom hook to get the current authenticated user
 * @returns {Object} { user, loading, error }
 */
const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Return the current user and loading state
  return { user, loading, error };
};

export default useCurrentUser;
