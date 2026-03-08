const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const PROJECT_ID = import.meta.env.VITE_GOOGLE_PROJECT_ID;

const getAccessToken = () => {
  if (typeof gapi === 'undefined' || !gapi.auth || !gapi.auth.getToken) {
    throw new Error('Google API client is not initialized. Ensure gapi is loaded and authenticated.');
  }

  const token = gapi.auth.getToken();
  if (!token || !token.access_token) {
    throw new Error('No Google OAuth access token available. Please sign in again.');
  }

  return token.access_token;
};

export async function uploadToGoogleCloud(file, folder = 'ai-outputs') {
  if (!file) {
    throw new Error('A file must be provided for upload.');
  }

  const bucketName = `${PROJECT_ID}.appspot.com`;
  const accessToken = getAccessToken();

  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${folder}/${encodeURIComponent(
      file.name
    )}&key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        Authorization: `Bearer ${accessToken}`,
      },
      body: file,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Google Cloud Storage: ${error}`);
  }

  const data = await response.json();
  return data.mediaLink || data.selfLink;
}

export async function uploadToGoogleDrive(file, accessToken) {
  try {
    if (!file) {
      throw new Error('File is required for Google Drive upload.');
    }

    const token = accessToken || getAccessToken();
    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Drive upload failed: ${errorText}`);
    }

    const data = await res.json();
    return `https://drive.google.com/file/d/${data.id}/view`;
  } catch (err) {
    console.error('Google Drive upload error:', err);
    throw err;
  }
}
