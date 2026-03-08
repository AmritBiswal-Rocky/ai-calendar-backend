// src/components/GoogleDocsUpload.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { safeLocalStorage } from '@/utils/storage';

const GoogleDocsUpload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRemove = () => {
    setFile(null);
    toast('🗑️ File removed');
  };

  const handleUpload = async () => {
    try {
      // First verify user is authenticated with our app
      const token = await ensureAuth();
      if (!token) throw new Error('Not authenticated');
      
      // Then check Google OAuth token
      const access_token = safeLocalStorage.getItem('google_access_token');
      if (!access_token) {
        toast.error('❌ Please connect Google first');
        return;
      }

      if (!file) {
        toast.error('❌ Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('firebase_uid', user.firebase_uid); // Include user ID for server-side validation

      setUploading(true);
      const res = await fetch('http://localhost:5000/google-docs/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-User-ID': user.firebase_uid, // Pass user ID in header for additional security
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Log the upload in our database
        try {
          await supabase
            .from('file_uploads')
            .insert([{
              firebase_uid: user.firebase_uid,
              service: 'google_docs',
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              external_id: data.documentId || data.id,
              metadata: data
            }]);
        } catch (dbError) {
          console.error('Error logging upload:', dbError);
          // Don't fail the upload if logging fails
        }

        toast.success(`✅ Document uploaded: ${data.title || 'Success'}`);
        setFile(null);
      } else {
        console.error('Upload failed:', data);
        toast.error(data?.error || '❌ Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="p-4 border rounded shadow bg-white dark:bg-gray-800 max-w-md"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        📄 Upload to Google Docs
      </h2>

      <input
        type="file"
        accept=".txt,.doc,.docx,.odt,.rtf,.md"
        onChange={handleFileChange}
        className="mb-3 block text-sm text-gray-700 dark:text-gray-100"
      />

      {file && (
        <div className="flex items-center justify-between mb-3 p-2 border rounded bg-gray-50 dark:bg-gray-700">
          <span className="text-sm text-gray-700 dark:text-gray-200">{file.name}</span>
          <motion.button
            onClick={handleRemove}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Remove
          </motion.button>
        </div>
      )}

      <motion.button
        onClick={handleUpload}
        disabled={uploading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </motion.button>
    </motion.div>
  );
};

export default GoogleDocsUpload;
