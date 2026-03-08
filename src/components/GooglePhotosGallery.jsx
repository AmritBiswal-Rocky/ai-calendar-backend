import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const GooglePhotosGallery = () => {
  const [mediaItems, setMediaItems] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const token = localStorage.getItem('google_photos_access_token');
      if (!token) return toast.error('Missing Google Photos token');

      try {
        const res = await fetch('http://localhost:5000/google-photos/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: token }),
        });
        const data = await res.json();
        if (data.mediaItems) setMediaItems(data.mediaItems);
        else toast.error('Failed to fetch media items');
      } catch (err) {
        console.error(err);
        toast.error('Error fetching Google Photos');
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {mediaItems.map((item) => (
        <img
          key={item.id}
          src={`${item.baseUrl}=w200-h200`}
          alt={item.filename}
          className="rounded shadow"
        />
      ))}
    </div>
  );
};

export default GooglePhotosGallery;
