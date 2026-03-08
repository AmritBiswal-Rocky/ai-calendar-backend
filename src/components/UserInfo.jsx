// src/components/UserInfo.jsx
// Firebase → auth only
// Supabase → database only (Bearer token via ensureAuth)
// NO supabase.auth usage
// ─────────────────────────────────────────────

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

const UserInfo = () => {
  const { user } = useAuth(); // Firebase user only

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────
  // Fetch profile from Supabase (RLS-safe)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        // ✅ Inject Firebase JWT BEFORE querying Supabase
        await ensureAuth(user);
        if (cancelled) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('firebase_uid, email, full_name, avatar_url')
          .eq('firebase_uid', user.uid)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!cancelled) {
          setProfile(data || null);
        }
      } catch (err) {
        console.error('❌ Failed to load user profile:', err);
        if (!cancelled) setError('Failed to load user information');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ─────────────────────────────────────────────
  // Logout (Firebase only)
  // ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('❌ Logout failed:', err);
    }
  };

  // ─────────────────────────────────────────────
  // UI States
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-600">Loading user information…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-700">No user is currently logged in</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">User Information</h2>

      <div className="space-y-2">
        <div className="flex items-center">
          <span className="font-medium w-28">Firebase UID:</span>
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.uid}</span>
        </div>

        {user.email && (
          <div className="flex items-center">
            <span className="font-medium w-28">Email:</span>
            <span>{user.email}</span>
          </div>
        )}

        {user.displayName && (
          <div className="flex items-center">
            <span className="font-medium w-28">Name:</span>
            <span>{user.displayName}</span>
          </div>
        )}

        <div className="flex items-center">
          <span className="font-medium w-28">Provider:</span>
          <span>{user.providerData?.map((p) => p?.providerId).join(', ') || 'Email/Password'}</span>
        </div>

        {profile && (
          <div className="mt-3 pt-3 border-t">
            <h3 className="font-medium mb-1">Profile (Supabase)</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}

        <div className="pt-3 mt-3 border-t">
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
