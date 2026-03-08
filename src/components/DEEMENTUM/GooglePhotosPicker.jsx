// ─────────────────────────────────────────────
// Google Photos Picker component
// Allows user to select images/videos from their Google Photos
// using OAuth token from useAuth()
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

function GooglePhotosPicker({ onSelect }) {
  const { googleAccessToken, gapiReady } = useAuth();
  const [pickerLoaded, setPickerLoaded] = useState(false);

  // Load Google Picker API
  useEffect(() => {
    if (!gapiReady || !googleAccessToken) return;

    const loadPicker = async () => {
      try {
        await new Promise((resolve) => window.gapi.load('picker', resolve));
        setPickerLoaded(true);
        console.log('✅ Google Photos Picker API loaded');
      } catch (err) {
        console.error('❌ Failed to load Google Picker:', err);
      }
    };

    loadPicker();
  }, [gapiReady, googleAccessToken]);

  const openPicker = () => {
    if (!pickerLoaded) return alert('Picker is still loading...');

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.PHOTOS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes('image/jpeg,image/png,video/mp4');

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(googleAccessToken)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .addView(view)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const files = data.docs.map((d) => ({
            name: d.name,
            url: d.url,
            mimeType: d.mimeType,
            id: d.id,
          }));
          console.log('📸 Selected from Google Photos:', files);
          if (onSelect) onSelect(files);
        }
      })
      .build();

    picker.setVisible(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <button
        onClick={openPicker}
        disabled={!pickerLoaded}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
      >
        {pickerLoaded ? '📷 Pick from Google Photos' : 'Loading Google Photos...'}
      </button>
    </div>
  );
}

export default GooglePhotosPicker;
