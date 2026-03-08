// src/components/ProfileCard.jsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ProfileCard = ({ onRefresh, profile = null, loading: loadingProp = undefined }) => {
  const { user, login, logout, loading: authLoading } = useAuth();
  const loading = typeof loadingProp === 'boolean' ? loadingProp : authLoading;
  const [hovered, setHovered] = React.useState(false);

  /* ──────────────── Handlers ──────────────── */
  const handleLogin = async () => {
    try {
      await login();
      toast.success('✅ Logged in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('❌ Login failed');
    }
  };

  const handleRefresh = async () => {
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
      } else {
        // No onRefresh supplied; throw to hit error toast so caller can wire it later
        throw new Error('No refresh handler');
      }
      toast.success('Profile refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Error refreshing profile.');
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

  /* ──────────────── Loading Skeleton ──────────────── */
  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded shadow animate-pulse max-w-sm mx-auto mt-6">
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

  /* ──────────────── Not Logged In ──────────────── */
  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded shadow text-center max-w-sm mx-auto mt-6">
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

  /* ──────────────── Logged In ──────────────── */
  return (
    <motion.div
      className="p-6 bg-white dark:bg-gray-800 rounded shadow text-center inline-block relative cursor-pointer select-none max-w-sm mx-auto mt-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ scale: 1 }}
      animate={{ scale: hovered ? 0.95 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <img
        src={
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            profile?.full_name || user.displayName || 'User'
          )}`
        }
        alt="User avatar"
        className="w-20 h-20 rounded-full shadow border border-gray-300 dark:border-gray-600 mx-auto"
      />
      <h2 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">
        {profile?.full_name || user.displayName || 'Anonymous'}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 break-all">
        {profile?.email || user.email || 'No email'}
      </p>

      {/* ── Tooltip popup on hover ── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 p-3 bg-gray-100 dark:bg-gray-900 rounded shadow-lg text-sm text-gray-700 dark:text-gray-300 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p>
              <strong>{profile?.full_name || user.displayName || 'Anonymous'}</strong>
            </p>
            <p>{profile?.email || user.email || 'No email'}</p>
            <p>Welcome back!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extra details */}
      <div className="mt-4 text-left space-y-2">
        <p>
          <span className="font-semibold">Phone:</span> {profile?.phone || 'Not set'}
        </p>
        <p>
          <span className="font-semibold">Bio:</span> {profile?.bio || 'No bio available'}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        🚪 Logout
      </button>
      <button
        onClick={handleRefresh}
        className="mt-3 ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        🔄 Refresh
      </button>
    </motion.div>
  );
};

export default ProfileCard;
