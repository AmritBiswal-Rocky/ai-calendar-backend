// src/components/GoogleDriveList.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const GoogleDriveList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLoadFiles = async () => {
    const access_token = localStorage.getItem('google_access_token');

    if (!access_token) {
      toast.error('❌ Please connect Google Drive first');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/google-drive/list', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token }),
      });

      const data = await res.json();

      if (res.ok) {
        setFiles(data.files || []);
      } else {
        console.error(data);
        toast.error(data?.error || '❌ Failed to fetch files');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('❌ Error loading files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white dark:bg-gray-800 mt-6">
      <h2 className="text-lg font-semibold mb-2">� My Google Drive Files</h2>
      <button
        onClick={handleLoadFiles}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : '📂 Load Drive Files'}
      </button>

      <ul className="mt-4 space-y-2">
        {files.map((file) => (
          <li key={file.id} className="text-sm text-gray-800 dark:text-gray-200">
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {file.name}
            </a>
          </li>
        ))}
        {files.length === 0 && !loading && (
          <p className="text-gray-500 dark:text-gray-400 mt-2">No files loaded yet.</p>
        )}
      </ul>
    </div>
  );
};

export default GoogleDriveList;
