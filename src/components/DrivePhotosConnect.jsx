// src/components/DrivePhotosConnect.jsx
import React, { useState } from 'react';
import { initGapi, signIn, getGapiClient, uploadPhoto } from '@/lib/gapiClient';
import supabase from '@/lib/supabaseClient'; // Supabase instance

export default function DrivePhotosConnect({ noteId }) {
  const [connected, setConnected] = useState(false);
  const [file, setFile] = useState(null);
  const [driveFiles, setDriveFiles] = useState([]);
  const [photoAlbums, setPhotoAlbums] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Connect & authorize Google APIs
  const handleConnect = async () => {
    try {
      await initGapi();
      await signIn();
      setConnected(true);
      console.log('✅ GAPI initialized with Drive + Photos!');
    } catch (err) {
      console.error('❌ GAPI init/sign-in error:', err);
    }
  };

  // List Google Drive files
  const listDriveFiles = async () => {
    try {
      const gclient = getGapiClient();
      const res = await gclient.drive.files.list({
        pageSize: 10,
        fields: 'files(id, name)',
      });
      setDriveFiles(res.result.files || []);
      console.log('Drive files:', res.result.files);
    } catch (err) {
      console.error('Error listing Drive files:', err);
    }
  };

  // List Google Photos albums
  const listPhotosAlbums = async () => {
    try {
      const gclient = getGapiClient();
      const res = await gclient.photoslibrary.albums.list({ pageSize: 10 });
      setPhotoAlbums(res.result.albums || []);
      console.log('Photos albums:', res.result.albums);
    } catch (err) {
      console.error('Error listing Photos albums:', err);
    }
  };

  // Upload file to Google Drive
  const uploadToDrive = async () => {
    if (!file) return alert('Select a file first!');
    setUploading(true);
    try {
      const gclient = getGapiClient();
      const metadata = { name: file.name, mimeType: file.type };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const token = gclient?.getToken?.() || gclient?.auth?.getToken?.();
      const accessToken = token?.access_token;

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form }
      );

      const result = await res.json();
      setUploadResult((prev) => ({ ...prev, drive: result }));
      console.log('Drive upload result:', result);

      // Attach Drive file link to note content if noteId is provided
      if (noteId && result.id) {
        const fileLink = `https://drive.google.com/file/d/${result.id}/view`;
        await supabase
          .from('notes')
          .update({ content: supabase.raw(`content || '\n[Drive](${fileLink})'`) })
          .eq('id', noteId);
      }
    } catch (err) {
      console.error('Drive upload error:', err);
    }
    setUploading(false);
  };

  // Upload file to Google Photos
  const uploadToPhotos = async () => {
    if (!file) return alert('Select a file first!');
    setUploading(true);
    try {
      const result = await uploadPhoto(file);
      setUploadResult((prev) => ({ ...prev, photos: result }));
      console.log('Photos upload result:', result);

      // Attach Photos file link to note content if noteId is provided
      if (noteId) {
        const photoUrl = result.newMediaItemResults?.[0]?.mediaItem?.productUrl;
        if (photoUrl) {
          await supabase
            .from('notes')
            .update({ content: supabase.raw(`content || '\n[Photo](${photoUrl})'`) })
            .eq('id', noteId);
        }
      }
    } catch (err) {
      console.error('Photos upload error:', err);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded shadow-md max-w-xl mx-auto">
      <button
        onClick={handleConnect}
        className={`px-4 py-2 rounded text-white ${connected ? 'bg-green-600' : 'bg-blue-600'}`}
      >
        {connected ? 'Connected ✅' : 'Connect Google'}
      </button>

      {connected && (
        <>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="border p-1" />

          <div className="flex space-x-2 mt-2">
            <button
              onClick={uploadToDrive}
              className="px-3 py-1 bg-blue-500 text-white rounded"
              disabled={uploading}
            >
              Upload to Drive
            </button>
            <button
              onClick={uploadToPhotos}
              className="px-3 py-1 bg-pink-500 text-white rounded"
              disabled={uploading}
            >
              Upload to Photos
            </button>
          </div>

          {uploading && <p>Uploading...</p>}

          {uploadResult?.drive && (
            <p className="text-green-600 mt-2">
              Uploaded to Drive: {uploadResult.drive.name || 'Success'}
            </p>
          )}
          {uploadResult?.photos && (
            <p className="text-pink-600 mt-2">
              Uploaded to Photos:{' '}
              {uploadResult.photos.newMediaItemResults?.[0]?.mediaItem?.filename || 'Success'}
            </p>
          )}

          <div className="flex space-x-2 mt-4">
            <button onClick={listDriveFiles} className="px-3 py-1 bg-gray-200 rounded">
              List Drive Files
            </button>
            <button onClick={listPhotosAlbums} className="px-3 py-1 bg-gray-200 rounded">
              List Photos Albums
            </button>
          </div>

          {driveFiles.length > 0 && (
            <div>
              <h4 className="font-semibold mt-2">Drive Files:</h4>
              <ul className="list-disc pl-5">
                {driveFiles.map((file) => (
                  <li key={file.id}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {photoAlbums.length > 0 && (
            <div>
              <h4 className="font-semibold mt-2">Photos Albums:</h4>
              <ul className="list-disc pl-5">
                {photoAlbums.map((album) => (
                  <li key={album.id}>{album.title}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
