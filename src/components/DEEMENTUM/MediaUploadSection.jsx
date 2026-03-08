import React from 'react';
import GooglePhotosPicker from './GooglePhotosPicker';

function MediaUploadSection() {
  const handlePhotoSelect = (files) => {
    console.log('📸 Selected photos:', files);
    // TODO: Upload to Drive, Photos, or show preview gallery here
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Upload from Google Photos</h2>
      <GooglePhotosPicker onSelect={handlePhotoSelect} />
    </div>
  );
}

export default MediaUploadSection;
