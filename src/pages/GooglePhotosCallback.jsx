// src/pages/GooglePhotosCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { safeLocalStorage } from '@/utils/storage';

const GooglePhotosCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    safeLocalStorage.setItem('google_photos_access_token', accessToken);

    if (!accessToken) {
      toast.error('❌ Failed to retrieve access token');
      navigate('/');
      return;
    }

    // ✅ Save token locally if needed
    safeLocalStorage.setItem('google_photos_access_token', accessToken);

    // ✅ Call your Flask backend
    fetch('http://localhost:5000/google-photos/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(`❌ Google Photos error: ${data.error}`);
        } else {
          const count = data.mediaItems?.length ?? 0;
          toast.success(`📸 Connected! Found ${count} media items.`);
        }
        navigate('/profile'); // or any appropriate page
      })
      .catch((err) => {
        console.error('Backend error:', err);
        toast.error('❌ Could not fetch Google Photos');
        navigate('/');
      });
  }, [navigate]);

  return (
    <div className="p-4 text-center text-gray-700 dark:text-white">
      Connecting to Google Photos...
    </div>
  );
};

export default GooglePhotosCallback;
