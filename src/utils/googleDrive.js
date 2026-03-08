// src/utils/googleDrive.js
// Google Drive helpers using gapi-script

import { gapi } from 'gapi-script';

export const initGapi = () => {
  gapi.load('client:auth2', async () => {
    await gapi.client.init({
      apiKey: "AIzaSyAcDd7A8VBBGJaDKagd0xdJ_-NXvKp-UpI", // ✅ Your actual API key
      clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // 🔴 Replace with your OAuth client ID
      scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar",
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
      ],
    });
  });
};

export const signInWithGoogleDrive = async () => {
  const GoogleAuth = gapi.auth2.getAuthInstance();
  const user = await GoogleAuth.signIn();
  const accessToken = user.getAuthResponse().access_token;
  return accessToken; // Use this token for Drive API calls
};

export const listDriveFiles = async () => {
  const response = await gapi.client.drive.files.list({
    pageSize: 50,
    fields: 'files(id, name, mimeType, webViewLink)',
  });
  return response.result.files;
};

export const uploadFileToDrive = async (file, accessToken) => {
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
    body: form,
  });
  return res.json();
};
