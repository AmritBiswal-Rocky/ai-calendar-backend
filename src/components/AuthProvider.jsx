// src/components/AuthProvider.jsx
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';

export default function AuthProvider({ children }) {
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) return;

        // Ensure user is authenticated with Supabase
        await ensureAuth(user);
        
        const { firebase_uid, email, displayName, photoURL } = user;
        
        // Update user profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: firebase_uid,
            email,
            full_name: displayName,
            avatar_url: photoURL,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('AuthProvider profile upsert failed:', e);
      }
    });

    return () => unsubscribe();
  }, []);

  return children;
}
