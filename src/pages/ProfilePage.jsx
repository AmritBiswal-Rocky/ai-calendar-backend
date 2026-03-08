// src/pages/ProfilePage.jsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import ProfileCard from '../components/ProfileCard';

export default function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="px-4 pt-0 -mt-4 pb-6">
      <ProfileCard profile={profile} />
    </div>
  );
}
