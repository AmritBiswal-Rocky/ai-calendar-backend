import React from 'react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';

const GooglePhotosConnect = () => {
  const login = useGoogleLogin({
    scope: [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.appendonly',
    ].join(' '),
    onSuccess: (tokenResponse) => {
      const access_token = tokenResponse.access_token;
      localStorage.setItem('google_photos_access_token', access_token); // Save token
      toast.success('✅ Successfully connected to Google Photos');
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      toast.error('❌ Failed to connect to Google Photos');
    },
  });

  return (
    <div className="mt-4">
      <button
        onClick={() => login()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        📷 Connect Google Photos
      </button>
    </div>
  );
};

export default GooglePhotosConnect;
