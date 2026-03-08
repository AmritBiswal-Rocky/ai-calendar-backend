// src/pages/Profile.jsx
// Firebase Auth → Supabase Profile (RLS-safe)
// Uses AuthContext as single auth source
// Framer Motion enabled
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil } from 'lucide-react';

import { getFirebaseToken } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

import EditProfileForm from '@/components/EditProfileForm';
import AvatarModal from './Avatar';

export default function Profile() {
  const { user, loading: authLoading } = useAuth(); // Firebase user from context

  const [profile, setProfile] = useState(null); // Supabase profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // ─────────────────────────────────────────────
  // Load / ensure profile (RLS-safe)
  // ─────────────────────────────────────────────
  async function loadProfile() {
    try {
      const token = await getFirebaseToken();

      if (!token) return;

      const res = await fetch('http://127.0.0.1:5000/api/profile', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Profile API failed');
      }

      const data = await res.json();
      setProfile(data?.[0] || null);
    } catch (err) {
      console.error('Profile load failed:', err);
      setError('Failed to load profile');
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!cancelled) {
          await loadProfile();
        }
      } catch (err) {
        console.error('❌ Profile page load error:', err);
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // ─────────────────────────────────────────────
  // Update profile
  // ─────────────────────────────────────────────
  const handleUpdateProfile = async (updatedData) => {
    if (!user?.uid) return;

    try {
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
        body: JSON.stringify({
          full_name: updatedData.full_name ?? null,
          nationality: updatedData.nationality ?? null,
          about: updatedData.about ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Profile update failed (status ${res.status})`);
      }

      const data = await res.json();

      setProfile(data);
      setEditing(false);
    } catch (err) {
      console.error('❌ Profile update failed:', err);
      setError('Profile update failed');
    }
  };

  // ─────────────────────────────────────────────
  // UI states
  // ─────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Please log in to view your profile.
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Profile UI (Advanced Layout)
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-6 pb-20">
      {/* COVER SECTION */}
      <motion.div
        className="relative w-full max-w-6xl mx-auto mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Cover Image */}
        <div className="relative h-64 rounded-2xl overflow-hidden">
          <img
            src={profile?.cover_url || '/default-cover.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
          />

          <button className="absolute top-4 right-4 bg-black/60 hover:bg-black px-4 py-2 rounded-lg text-sm">
            Upload Cover
          </button>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-16 left-10">
          <div className="relative">
            <img
              src={profile?.avatar_url || '/default-avatar.png'}
              alt="Avatar"
              className="w-36 h-36 rounded-2xl border-4 border-[#0b1220] object-cover shadow-xl"
            />

            <button onClick={() => setShowAvatarModal(true)} className="absolute bottom-2 right-2 bg-black/70 p-2 rounded-lg">
              <Pencil size={16} />
            </button>
          </div>
        </div>

        {/* Name + Location */}
        <div className="mt-20 ml-56">
          <h1 className="text-3xl font-semibold">{profile?.full_name || 'Your Name'}</h1>

          <p className="text-gray-400 mt-1">{profile?.location || 'Add your location'}</p>
        </div>

        {/* Edit Profile Button */}
        <button className="absolute right-6 bottom-6 bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
          <Pencil size={16} />
          Edit Profile
        </button>
      </motion.div>

      {/* PERSONAL DETAILS CARD */}
      <div className="max-w-6xl mx-auto mt-24 bg-[#111827] rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Personal details</h2>
          <button className="bg-gray-700 px-4 py-1 rounded-md text-sm">Edit</button>
        </div>

        <div className="space-y-5 text-gray-300">
          <DetailRow label="Full name" value={profile?.full_name} />
          <DetailRow label="Date of Birth" value={profile?.dob} />
          <DetailRow label="Gender" value={profile?.gender} />
          <DetailRow label="Nationality" value={profile?.nationality} />
          <DetailRow label="Address" value={profile?.address} />
          <DetailRow label="Phone Number" value={profile?.phone} />
          <DetailRow label="Email" value={profile?.email} />
        </div>
      </div>

      {/* Avatar Modal */}
      <AnimatePresence>
        {showAvatarModal && <AvatarModal onClose={() => setShowAvatarModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-700 pb-3">
      <span className="text-gray-400">{label}:</span>
      <span>{value || '—'}</span>
    </div>
  );
}
