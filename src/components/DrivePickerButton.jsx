// src/components/DrivePickerButton.jsx
import React, { useEffect } from 'react';

const CLIENT_ID = '587287629767-ctcs1k73kem8jc9jo6a8d124l5h4vne4.apps.googleusercontent.com'; // Replace with your own
const DEVELOPER_KEY = 'AIzaSyCq659GygWF-Ka1QtvGXBqS14auybTFEu8'; // Optional but useful

export default function DrivePickerButton() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => window.gapi.load('client:picker', () => {});
    document.body.appendChild(script);
  }, []);

  const openPicker = async () => {
    try {
      await window.gapi.client.init({
        apiKey: DEVELOPER_KEY,
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });

      const tokenResponse = await window.gapi.auth2.getAuthInstance().signIn();
      const oauthToken = tokenResponse.getAuthResponse().access_token;

      const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(oauthToken)
        .setDeveloperKey(DEVELOPER_KEY)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const file = data.docs[0];
            console.log('📄 File selected:', file);
            alert(`Selected file: ${file.name}`);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      console.error('❌ Picker error:', err.message);
    }
  };

  return (
    <button
      onClick={openPicker}
      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
    >
      📂 Upload to Google Drive
    </button>
  );
}
