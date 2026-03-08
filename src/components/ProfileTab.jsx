// src/components/ProfileTab.jsx
// Firebase → auth only
// Backend API → database only (Bearer token via getFirebaseToken)
// NO direct supabase usage
// ─────────────────────────────────────────────

import React, { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

import { getFirebaseToken } from '@/lib/auth';

import { useAuth } from '@/context/AuthContext';
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

import ProfileCard from './ProfileCard';
import EditProfileForm from './EditProfileForm';

import GooglePhotosConnect from './GooglePhotosConnect';
import GooglePhotosList from './GooglePhotosList';
import GoogleDriveUpload from './GoogleDriveUpload';
import GoogleDriveList from './GoogleDriveList';

import uploadToDrive from '@/utils/uploadToDrive';

const ProfileTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Firebase user only

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // ─────────────────────────────────────────────
  // Logout (Firebase ONLY)
  // ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Logged out');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  // ─────────────────────────────────────────────
  // Fetch profile (via backend API)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const token = await getFirebaseToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const res = await fetch('/api/profile', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load profile (status ${res.status})`);
        }

        const data = await res.json();

        if (!cancelled) {
          setProfile(data || null);
          setAvatarUrl(data?.avatar_url || null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setErrorMsg('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const fallbackAvatar = profile?.full_name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}`
    : 'https://ui-avatars.com/api/?name=User';

  // ─────────────────────────────────────────────
  // Avatar upload (Google Drive → Supabase metadata)
  // ─────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }

      setIsAvatarUploading(true);
      const driveData = await uploadToDrive(file);
      const driveUrl = driveData?.webViewLink || driveData?.webContentLink || driveData?.view_link;

      if (!driveUrl) throw new Error('Missing Drive URL');

      const token = await getFirebaseToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: driveUrl }),
      });

      if (!res.ok) {
        throw new Error(`Avatar update failed (status ${res.status})`);
      }

      setAvatarUrl(driveUrl);
      setProfile((p) => (p ? { ...p, avatar_url: driveUrl } : p));
      toast.success('Avatar updated');
    } catch (err) {
      console.error(err);
      toast.error('Avatar update failed');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarReset = async () => {
    if (!user?.uid) return;

    try {
      setIsAvatarUploading(true);
      const token = await getFirebaseToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: null }),
      });

      if (!res.ok) {
        throw new Error(`Avatar reset failed (status ${res.status})`);
      }

      setAvatarUrl(null);
      setProfile((p) => (p ? { ...p, avatar_url: null } : p));
      toast.success('Avatar reset');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset avatar');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Save editable profile fields
  // ─────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile || !user?.uid) return;

    try {
      const updates = {
        full_name: profile.full_name ?? null,
        bio: profile.bio ?? null,
        phone: profile.phone ?? null,
      };

      const token = await getFirebaseToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`Profile update failed (status ${res.status})`);
      }

      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error('Profile update failed');
    }
  };

  // ─────────────────────────────────────────────
  // Google Sign-in (Firebase only)
  // ─────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in');
    } catch (err) {
      console.error(err);
      toast.error('Google sign-in failed');
    }
  };

  if (!user) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold mb-4">You’re not signed in</h2>
        <button onClick={handleGoogleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6">
      <h2 className="text-2xl font-semibold text-center mb-6">Your Profile</h2>

      <ProfileCard profile={profile} loading={loading} />

      {!loading && profile && (
        <>
          <div className="flex justify-center mt-4">
            <img
              src={avatarUrl || fallbackAvatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full border object-cover"
            />
          </div>

          <div className="flex flex-col items-center mt-4">
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded">
              Change Avatar
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </label>

            {avatarUrl && (
              <button onClick={handleAvatarReset} className="mt-2 text-red-600 text-sm">
                Reset Avatar
              </button>
            )}
          </div>

          <div className="text-center mt-6 space-x-3">
            <button
              onClick={() => setShowEdit(true)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>

            <button
              onClick={handleSaveProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Profile
            </button>

            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>

          <Transition appear show={showEdit} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => setShowEdit(false)}>
              <Dialog.Panel className="bg-white p-6 rounded shadow-xl">
                <EditProfileForm profile={profile} onClose={() => setShowEdit(false)} />
              </Dialog.Panel>
            </Dialog>
          </Transition>

          <div className="mt-6">
            <GooglePhotosConnect />
            <GooglePhotosList />
            <GoogleDriveUpload />
            <GoogleDriveList />
          </div>
        </>
      )}

      {!loading && errorMsg && <p className="text-red-600 text-center mt-4">{errorMsg}</p>}
    </div>
  );
};

export default ProfileTab;
