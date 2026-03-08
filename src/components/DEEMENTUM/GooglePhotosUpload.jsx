// ─────────────────────────────────────────────
// Upload AI-generated images to Google Photos Library
// (Optionally also backup to Drive)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

function GooglePhotosUpload({ file, onUploadComplete }) {
  const { googleAccessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const uploadToPhotos = async () => {
    if (!file || !googleAccessToken) {
      alert('Missing file or Google login.');
      return;
    }

    try {
      setUploading(true);
      setStatus('Uploading to Google Photos...');

      // Step 1: Upload bytes to Google Photos (get uploadToken)
      const uploadBytes = await fetch(file);
      const blob = await uploadBytes.blob();

      const uploadRes = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-type': 'application/octet-stream',
          'X-Goog-Upload-File-Name': file.name || 'ai_image.jpg',
          'X-Goog-Upload-Protocol': 'raw',
        },
        body: blob,
      });

      const uploadToken = await uploadRes.text();

      // Step 2: Create a new media item using that token
      const createItemRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          newMediaItems: [
            {
              description: 'Uploaded from Deementum AI',
              simpleMediaItem: { uploadToken },
            },
          ],
        }),
      });

      const result = await createItemRes.json();

      if (result?.newMediaItemResults?.[0]?.mediaItem) {
        const photoUrl = result.newMediaItemResults[0].mediaItem.productUrl;
        console.log('✅ Uploaded to Google Photos:', photoUrl);
        setStatus('✅ Uploaded to Google Photos successfully');

        if (onUploadComplete) onUploadComplete(photoUrl);
      } else {
        console.error('❌ Upload failed:', result);
        setStatus('❌ Upload failed. See console for details.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setStatus('❌ Error uploading to Google Photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
      <button
        onClick={uploadToPhotos}
        disabled={uploading}
        className={`px-5 py-2 rounded-lg text-white transition-all ${
          uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
        }`}
      >
        {uploading ? 'Uploading...' : '📤 Upload to Google Photos'}
      </button>

      {status && (
        <p className="text-sm text-gray-600 mt-2 text-center">{status}</p>
      )}
    </div>
  );
}

export default GooglePhotosUpload;
