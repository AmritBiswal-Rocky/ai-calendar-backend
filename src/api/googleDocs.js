import axios from 'axios';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const PROJECT_ID = import.meta.env.VITE_GOOGLE_PROJECT_ID; // Kept for future use if project-scoped operations are needed.

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

export async function createGoogleDoc(title, content, providedAccessToken) {
  if (!title) {
    throw new Error('Title is required to create a Google Doc.');
  }

  const accessToken = providedAccessToken || getAccessToken();

  try {
    const createRes = await fetch(`https://docs.googleapis.com/v1/documents?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const doc = await createRes.json();

    if (!createRes.ok || !doc.documentId) {
      throw new Error(doc.error?.message || 'Failed to create Google Doc');
    }

    if (content) {
      const batchRes = await fetch(
        `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: content,
                  endOfSegmentLocation: {},
                },
              },
            ],
          }),
        }
      );

      if (!batchRes.ok) {
        const errorBody = await batchRes.text();
        throw new Error(`Failed to update Google Doc: ${errorBody}`);
      }
    }

    return doc.documentId;
  } catch (err) {
    console.error('Google Docs API error:', err);
    throw err;
  }
}
