// src/components/ProfileSection.jsx
import React from 'react';
import { useAuth } from '@/context/AuthContext'; // Using your AuthContext
import toast from 'react-hot-toast';

const ProfileSection = () => {
  const { user, profile, login, logout, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      toast.success('✅ Logged in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('❌ Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('👋 Logged out!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('❌ Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded shadow animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded shadow text-center">
        <p className="mb-4 text-gray-600 dark:text-gray-400">You&apos;re not signed in.</p>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          🔐 Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded shadow text-center">
      <div className="flex flex-col items-center">
        <img
          src={
            profile?.avatar_url ||
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              profile?.full_name || user.displayName || 'User'
            )}`
          }
          alt="User avatar"
          className="w-20 h-20 rounded-full shadow border border-gray-300 dark:border-gray-600"
        />
        <h2 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
          {profile?.full_name || user.displayName || 'Anonymous'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {profile?.email || user.email || 'No email'}
        </p>
        {profile?.bio && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{profile.bio}</p>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default ProfileSection;
