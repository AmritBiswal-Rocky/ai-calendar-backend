// src/components/GooglePhotosUpload.jsx
/* global gapi */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const GooglePhotosUpload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  // ─── New: Direct Google Photos upload support via gapi ───
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  // ─────────────────────────────────────────────
  // Google Photos (client-side) via gapi
  // ─────────────────────────────────────────────
  useEffect(() => {
    // Load gapi script once
    const existing = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    if (existing) {
      existing.addEventListener('load', initGapi);
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = initGapi;
      document.body.appendChild(script);
    }
    return () => existing && existing.removeEventListener('load', initGapi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initGapi = () => {
    if (!window.gapi) return;
    window.gapi.load('client:auth2', async () => {
      try {
        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          discoveryDocs: [
            'https://photoslibrary.googleapis.com/$discovery/rest?version=v1',
          ],
          scope: [
            'https://www.googleapis.com/auth/photoslibrary.appendonly',
            'https://www.googleapis.com/auth/photoslibrary.readonly',
          ].join(' '),
        });
        setGapiLoaded(true);
        const authInstance = window.gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen((status) => setIsSignedIn(status));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('GAPI init failed:', err);
      }
    });
  };

  const handleSignIn = () => window.gapi?.auth2?.getAuthInstance()?.signIn();
  const handleSignOut = () => window.gapi?.auth2?.getAuthInstance()?.signOut();

  // Auto sign-in once gapi is loaded, then albums will be fetched by isSignedIn effect
  useEffect(() => {
    if (gapiLoaded && !isSignedIn) {
      handleSignIn();
    }
  }, [gapiLoaded, isSignedIn]);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || []);
    if (dropped.length) {
      setFiles((prev) => [...prev, ...dropped]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFileToPhotos = async (photoFile) => {
    // First verify user is authenticated with our app
    const token = await ensureAuth(user);
    if (!token) throw new Error('Not authenticated');
    
    if (!isGapiReady()) throw new Error('GAPI not initialized or signed in');
    const accessToken = window.gapi?.auth?.getToken?.()?.access_token;
    if (!accessToken) throw new Error('No Google access token');

    // 1) Upload bytes to obtain an uploadToken
    const uploadResponse = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-File-Name': photoFile.name,
        'X-Goog-Upload-Protocol': 'raw',
        Authorization: `Bearer ${accessToken}`,
      },
      body: photoFile,
    });
    const uploadToken = await uploadResponse.text();

    // 2) Create the media item
    const createResponse = await window.gapi.client.photoslibrary.mediaItems.batchCreate({
      resource: {
        newMediaItems: [
          {
            description: photoFile.name,
            simpleMediaItem: { uploadToken },
          },
        ],
      },
    });
    return createResponse?.result;
  };

  const handleBatchUpload = async () => {
    if (!files.length) {
      toast.error('Please add files first');
      return;
    }
    
    try {
      // Verify authentication
      const token = await ensureAuth();
      if (!token) throw new Error('Not authenticated');
      
      setUploading(true);
      const uploadPromises = files.map((f) => uploadFileToPhotos(f));
      const results = await Promise.allSettled(uploadPromises);
      
      // Log successful uploads to our database
      const successfulUploads = results
        .filter((result, index) => result.status === 'fulfilled')
        .map((result, index) => ({
          firebase_uid: user.firebase_uid,
          service: 'google_photos',
          file_name: files[index].name,
          file_type: files[index].type,
          file_size: files[index].size,
          external_id: result.value?.id || `photo-${Date.now()}-${index}`,
          metadata: result.value || {}
        }));
      
      if (successfulUploads.length) {
        try {
          const token = await ensureAuth(user);
          if (!token) throw new Error('Not authenticated');
          
          const { error } = await supabase
            .from('file_uploads')
            .insert(successfulUploads)
            .select()
            .single();
            
          if (error) throw error;
        } catch (dbError) {
          console.error('Error logging uploads:', dbError);
          // Don't fail the upload if logging fails
        }
      }

      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        toast.error(`${failedCount} of ${files.length} files failed to upload`);
      } else {
        toast.success('All files uploaded to Google Photos');
      }
      
      setFiles([]);
    } catch (error) {
      console.error('Batch upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    toast('🗑️ File removed');
  };

  // Safe check for gapi readiness
  const isGapiReady = () => !!(window.gapi && window.gapi.auth2?.getAuthInstance?.());

  // Single-file drag & drop (Photos quick path)
  const handleDropSingle = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  };

  const handleUpload = async () => {
    const access_token = localStorage.getItem('google_access_token');

    if (!access_token) {
      toast.error('❌ Please connect Google first');
      return;
    }

    if (!file) {
      toast.error('❌ Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch('http://localhost:5000/google-photos/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`✅ Photo uploaded: ${data.filename || 'Success'}`);
        setFile(null);
      } else {
        console.error(data);
        toast.error(data?.error || '❌ Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const listAlbums = async () => {
    try {
      const resp = await window.gapi.client.photoslibrary.albums.list({ pageSize: 10 });
      const list = resp.result.albums || [];
      // eslint-disable-next-line no-console
      console.log('Albums:', list);
      setAlbums(list);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch albums:', err);
    }
  };

  return (
    <motion.div
      className="p-4 border rounded shadow bg-white dark:bg-gray-800 max-w-md"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">📸 Upload to Google Photos</h2>
      {/* Single-file Drag & Drop with preview (direct Google Photos) */}
      <motion.div
        className="mb-4"
        onDrop={handleDropSingle}
        onDragOver={(e) => e.preventDefault()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{
          border: '2px dashed #9ca3af',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => (document.getElementById('fileInput')?.click() || document.getElementById('photo-upload')?.click())}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop a photo here, or click to select</p>
        )}
        {/* Hidden input (compat id: photo-upload) */}
        <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        {/* Additional hidden input for compatibility with examples */}
        <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </motion.div>

      {file && (
        <div className="flex items-center gap-2 mb-4">
          <button onClick={handleRemove} className="px-3 py-1 text-sm bg-gray-600 text-white rounded">Remove</button>
          <button
            onClick={async () => file && (await uploadPhoto(file))}
            disabled={!file || uploading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload to Google Photos'}
          </button>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-3 block text-sm text-gray-700 dark:text-gray-100"
      />

      {file && (
        <div className="flex items-center justify-between mb-3 p-2 border rounded bg-gray-50 dark:bg-gray-700">
          <span className="text-sm text-gray-700 dark:text-gray-200">{file.name}</span>
          <motion.button
            onClick={handleRemove}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Remove
          </motion.button>
        </div>
      )}

      <motion.button
        onClick={handleUpload}
        disabled={uploading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </motion.button>

      {/* Divider */}
      <div className="my-6 h-px bg-gray-200 dark:bg-gray-700" />

      {/* New: Direct Google Photos upload via gapi */}
      {!gapiLoaded && <p className="text-sm text-gray-500">Loading Google API...</p>}
      {gapiLoaded && !isSignedIn && (
        <button onClick={handleSignIn} className="mt-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Sign in with Google
        </button>
      )}
      {isSignedIn && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-200">Signed in to Google</span>
            <button onClick={handleSignOut} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">Sign Out</button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <p className="text-gray-600 dark:text-gray-300">Drag & Drop photos here</p>
            <p className="text-sm text-gray-400">or click below</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e)}
              className="mt-2"
            />
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-10 h-10 object-cover rounded" />
                    <span className="text-sm text-gray-800 dark:text-gray-100">{f.name}</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
              <button
                onClick={handleUploadAll}
                disabled={uploading}
                className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload All to Photos'}
              </button>
            </div>
          )}

          {/* Simple single-file upload input (direct to Photos) */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">Quick Upload</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
              className="block text-sm"
            />
          </div>

          {/* Albums list */}
          {albums.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Albums</h3>
              <ul className="list-disc pl-5 text-sm">
                {albums.map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default GooglePhotosUpload;
