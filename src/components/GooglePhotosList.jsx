import React, { useState } from 'react';

export default function GooglePhotosList() {
  const [photos, setPhotos] = useState([]);

  const handleListPhotos = async () => {
    const access_token = localStorage.getItem('google_photos_access_token');
    if (!access_token) return alert('Please connect Google Photos first.');

    try {
      const res = await fetch('http://localhost:5000/google-photos/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`, // 👈 Used by backend
        },
        body: JSON.stringify({ access_token }), // Optional duplicate
      });

      const data = await res.json();
      if (res.ok) {
        setPhotos(data.mediaItems || []);
      } else {
        console.error(data.error);
        alert('Failed to load photos');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleListPhotos} className="bg-blue-600 text-white px-4 py-2 rounded">
        📷 Load My Google Photos
      </button>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <img
            key={photo.id}
            src={photo.baseUrl}
            alt={photo.filename}
            className="rounded shadow-md"
          />
        ))}
      </div>
    </div>
  );
}
