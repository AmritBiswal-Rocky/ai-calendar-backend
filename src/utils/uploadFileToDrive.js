// src/utils/uploadFileToDrive.js
// Google Drive upload + Supabase metadata save
// CATEGORY C FIXED
// ─────────────────────────────────────────────

import supabase from '../lib/supabaseClient';

/**
 * Upload a file to Google Drive via backend
 * and persist metadata in Supabase
 *
 * @param {File} file
 * @param {Object} options
 * @param {Object} options.user - Firebase user (preferred)
 * @param {string} options.firebase_uid - Explicit firebase_uid fallback
 */
export async function uploadFileToDrive(file, options = {}) {
  const firebase_uid = options?.firebase_uid || options?.user?.uid;

  if (!file) {
    throw new Error('No file provided');
  }

  if (!firebase_uid) {
    throw new Error('firebase_uid is required for upload');
  }

  try {
    // ─────────────────────────────────────────────
    // 1. Upload file to backend (Google Drive)
    // ─────────────────────────────────────────────
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/uploadToDrive', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Drive upload failed');
    }

    const driveData = await res.json();

    if (!driveData?.id) {
      throw new Error('Invalid Drive response');
    }

    // ─────────────────────────────────────────────
    // 2. Save metadata in Supabase
    // ─────────────────────────────────────────────
    const { data, error } = await supabase
      .from('files')
      .insert({
        firebase_uid: firebase_uid,
        file_name: file.name,
        drive_file_id: driveData.id,
        mime_type: driveData.mimeType || file.type || null,
        url: driveData.webViewLink || driveData.webContentLink || driveData.url || null,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('❌ Upload to Drive failed:', err);
    return null;
  }
}
