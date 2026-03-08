// src/components/UserBadge.jsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function UserBadge({ className = '' }) {
  const { user, profile } = useAuth?.() || {};
  const email = user?.email || profile?.email || '';
  const avatarUrl = profile?.avatar_url || user?.photoURL || '';
  const displayName = profile?.full_name || user?.displayName || email || 'User';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 border">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-gray-600">
            {displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="text-sm font-medium text-gray-900">{displayName}</div>
    </div>
  );
}
