// src/components/UploadDashboard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import GoogleDriveUpload from './GoogleDriveUpload';
import GooglePhotosUpload from './GooglePhotosUpload';
import GoogleDocsUpload from './GoogleDocsUpload';

const UploadDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Upload Dashboard</h1>
      <p className="text-center text-gray-600">
        Manage your uploads to Google Drive & Google Photos from one place
      </p>

      <motion.div
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Google Drive */}
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
          <GoogleDriveUpload />
        </motion.div>

        {/* Google Photos */}
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
          <GooglePhotosUpload />
        </motion.div>

        {/* Google Docs */}
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
          <GoogleDocsUpload />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UploadDashboard;
