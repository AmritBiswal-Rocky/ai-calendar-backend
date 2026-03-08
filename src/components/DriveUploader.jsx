// src/components/DriveUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';

const DriveUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewLink, setViewLink] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setViewLink('');
  };

  const handleRemoveFile = () => {
    setFile(null);
    setViewLink('');
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    setViewLink('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://localhost:5000/upload-to-drive', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setViewLink(res.data.viewLink);
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md mx-auto mt-6 bg-white dark:bg-zinc-900">
      <h2 className="text-xl font-semibold mb-3">📁 Upload File to Google Drive</h2>

      <input type="file" onChange={handleFileChange} className="mb-2 block w-full" accept="*" />

      {file && (
        <div className="flex items-center justify-between mb-3 text-sm text-gray-700 dark:text-gray-300">
          <span>Selected: {file.name}</span>
          <button onClick={handleRemoveFile} className="text-red-600 hover:underline ml-4">
            Remove
          </button>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {viewLink && (
        <div className="mt-4">
          <p className="text-green-600">✅ Uploaded Successfully!</p>
          <a
            href={viewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View File
          </a>
        </div>
      )}
    </div>
  );
};

export default DriveUploader;
