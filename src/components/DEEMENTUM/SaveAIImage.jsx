import React from 'react';
import GooglePhotosUpload from './GooglePhotosUpload';
import { useAuth } from '@/context/AuthContext';

function SaveAIImage({ imageUrl, onSaved }) {
  const { googleAccessToken, gapiReady } = useAuth();

  const handleComplete = (url) => {
    console.log('✅ Photo uploaded to:', url);
    if (onSaved) onSaved(url);
  };

  if (!imageUrl) {
    return <p className="text-sm text-gray-500">No AI image available to save yet.</p>;
  }

  if (!gapiReady || !googleAccessToken) {
    return (
      <p className="text-sm text-amber-600">
        Connect your Google account to save AI images to Google Photos.
      </p>
    );
  }

  return (
    <GooglePhotosUpload
      file={imageUrl}
      onUploadComplete={handleComplete}
    />
  );
}

export default SaveAIImage;
