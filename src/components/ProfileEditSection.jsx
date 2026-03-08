import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getUserProfile, updateUserProfile } from '../api/profile';
import toast from 'react-hot-toast';

const ProfileEditSection = () => {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch current profile details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          toast.error('User not authenticated');
          return;
        }
        const profileData = await getUserProfile(user.firebase_uid);
        if (profileData) {
          setFullName(profileData.full_name || '');
          setBio(profileData.bio || '');
          setPhone(profileData.phone || '');
        }
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      toast.error('Full name cannot be empty');
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      await updateUserProfile(user.firebase_uid, {
        full_name: fullName,
        bio,
        phone,
      });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(`Update failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>;
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <input
        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Enter full name"
      />
      <textarea
        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Enter bio"
      />
      <input
        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter phone number"
      />
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
};

export default ProfileEditSection;
