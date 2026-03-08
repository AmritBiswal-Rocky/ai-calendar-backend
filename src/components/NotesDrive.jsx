// src/components/NotesDrive.jsx
import React, { useEffect, useState } from 'react';
import {
  initGapi,
  signInWithGoogleDrive,
  listDriveFiles,
  uploadFileToDrive,
} from '@/utils/googleDrive';

const NotesDrive = () => {
  const [files, setFiles] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initGapi();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const token = await signInWithGoogleDrive();
      setAccessToken(token);
      const driveFiles = await listDriveFiles();
      setFiles(driveFiles || []);
    } catch (e) {
      console.error('Google Drive login failed:', e);
      alert('Google Drive login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    try {
      if (!accessToken) {
        alert('Please login with Google Drive first');
        return;
      }
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      const uploadedFile = await uploadFileToDrive(file, accessToken);
      if (uploadedFile) {
        setFiles((prev) => [...prev, uploadedFile]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Nourse</h1>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleLogin}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Working…' : 'Login with Google Drive'}
        </button>
        <input type="file" onChange={handleUpload} disabled={!accessToken || loading} />
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {(files || []).map((file) => (
          <li key={file.id} className="text-sm">
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {file.name}
            </a>
            <span className="text-gray-500 ml-2">({file.mimeType})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesDrive;
