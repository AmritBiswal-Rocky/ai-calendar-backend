// src/utils/uploadToDrive.js

const DEFAULT_UPLOAD_URL = (import.meta?.env?.VITE_BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, '') + '/upload_to_drive';

export async function uploadToDrive(file, { endpoint = DEFAULT_UPLOAD_URL } = {}) {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let message = `Drive upload failed with status ${res.status}`;
    try {
      const payload = await res.json();
      if (payload?.error) message = payload.error;
    } catch (err) {
      // Ignore JSON parse errors, fall back to default message
    }
    throw new Error(message);
  }

  return res.json();
}

export default uploadToDrive;
