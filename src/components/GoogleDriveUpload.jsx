// ─────────────────────────────────────────────
// GoogleDriveUpload.jsx
// Google Drive File Upload → Backend
// ─────────────────────────────────────────────

import React, { useState } from 'react';

const GoogleDriveUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [driveLink, setDriveLink] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // ─────────────────────────────────────────────
  // Upload File → Backend → Google Drive
  // ─────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file first');

    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://127.0.0.1:5000/upload_to_drive', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data?.view_link) {
        throw new Error('Upload failed — No Google Drive link returned');
      }

      setDriveLink(data.view_link);
      alert('✅ Uploaded to Google Drive successfully!');
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md flex flex-col items-center space-y-3">
      <h2 className="text-lg font-semibold">Upload to Google Drive</h2>

      <input type="file" onChange={handleFileChange} />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className={`px-4 py-2 rounded-md transition ${
          uploading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {driveLink && (
        <p className="text-sm text-green-500">
          ✅ File uploaded:{' '}
          <a href={driveLink} target="_blank" rel="noreferrer" className="underline">
            View in Drive
          </a>
        </p>
      )}
    </div>
  );
};

export default GoogleDriveUpload;
