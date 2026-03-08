// src/lib/googleDrive.js
let gapiInited = false;

export function initGapi() {
  if (gapiInited) return;

  // Load Google API client
  window.gapi.load('client:auth2', async () => {
    await window.gapi.client.init({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: [
        import.meta.env.VITE_GOOGLE_DRIVE_SCOPES,
        import.meta.env.VITE_GOOGLE_PHOTOS_SCOPES,
      ].join(' '),
    });
    gapiInited = true;
  });
}

// 🔐 Sign in user and get token
export async function signInWithGoogleDrive() {
  const auth = window.gapi.auth2.getAuthInstance();
  const user = await auth.signIn();
  const token = user.getAuthResponse().access_token;
  return token;
}

// 📂 List files from Drive
export async function listDriveFiles(token) {
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name)',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();
  return data.files || [];
}

// ⬆️ Upload file to Drive
export async function uploadFileToDrive(file, token) {
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  return await res.json();
}
