// src/components/ScopeTest.jsx
import React, { useEffect } from 'react';
import { gapi } from 'gapi-script';

const ScopeTest = () => {
  useEffect(() => {
    const initGAPI = async () => {
      try {
        await gapi.load('client:auth2', async () => {
          await gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              'https://photoslibrary.googleapis.com/$discovery/rest?version=v1',
            ],
            scope: import.meta.env.VITE_GOOGLE_SCOPES,
          });

          const authInstance = gapi.auth2.getAuthInstance();
          const user = await authInstance.signIn();

          // Granted scopes
          console.log('Granted scopes:', user.getGrantedScopes());

          // Test Drive API
          try {
            const driveResp = await gapi.client.drive.files.list({
              pageSize: 5,
              fields: 'files(id, name)',
            });
            console.log('Drive files:', driveResp.result.files);
          } catch (err) {
            console.error('Drive API error:', err);
          }

          // Test Photos API
          try {
            const photosResp = await gapi.client.photoslibrary.mediaItems.list({
              pageSize: 5,
            });
            console.log('Photos library items:', photosResp.result.mediaItems);
          } catch (err) {
            console.error('Photos API error:', err);
          }
        });
      } catch (e) {
        console.error('GAPI init error:', e);
      }
    };

    initGAPI();
  }, []);

  return <div>Check console for Drive & Photos API test results</div>;
};

export default ScopeTest;
