import React from 'react';

const LoadingSpinner = () => (
  <div className="min-h-[200px] flex items-center justify-center p-6">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default LoadingSpinner;
