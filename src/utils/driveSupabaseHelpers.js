// ─────────────────────────────────────────────
// Google Drive → Supabase metadata bridge
// CATEGORY C FIXED (firebase_uid enforced)
// ─────────────────────────────────────────────

import supabase from '@/lib/supabaseClient';
import { uploadToDrive } from '@/utils/googleApi';

/**
 * Upload a file to Google Drive
 * and store ONLY metadata in Supabase (JSONB attachments)
 *
 * @param {Object} params
 * @param {File} params.file
 * @param {Object} params.user - Firebase user (preferred)
 * @param {string} params.firebase_uid - Explicit override (optional)
 * @param {string} params.title
 * @param {string} params.description
 * @param {string|null} params.start_time
 * @param {string|null} params.end_time
 */
export async function handleFileUpload({
  file,
  user,
  firebase_uid: explicitFirebaseUid,
  title = '',
  description = '',
  start_time = null,
  end_time = null,
}) {
  // ─────────────────────────────────────────────
  // 🔐 Resolve firebase_uid safely
  // ─────────────────────────────────────────────
  const firebase_uid = explicitFirebaseUid || user?.uid;

  if (!firebase_uid) {
    throw new Error('Firebase user not authenticated (firebase_uid missing)');
  }

  if (!file) {
    throw new Error('No file provided');
  }

  // ─────────────────────────────────────────────
  // 1️⃣ Upload file to Google Drive
  // (OAuth handled inside uploadToDrive)
  // ─────────────────────────────────────────────
  const driveData = await uploadToDrive(file);

  if (!driveData?.id || !driveData?.webViewLink) {
    throw new Error('Google Drive upload failed');
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Prepare attachment metadata (JSONB)
  // ─────────────────────────────────────────────
  const attachment = {
    type: 'drive',
    drive_file_id: driveData.id,
    drive_file_type: file.type || null,
    drive_web_link: driveData.webViewLink,
    name: file.name,
    size: file.size,
  };

  // ─────────────────────────────────────────────
  // 3️⃣ Store metadata ONLY in Supabase
  // ✅ Always scoped by firebase_uid
  // ─────────────────────────────────────────────
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([
      {
        firebase_uid, // ✅ ownership field (CATEGORY B/C)
        title,
        description,
        start_time,
        end_time,

        // ✅ JSONB only (no blobs)
        attachments: [attachment],
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase insert error:', error);
    throw new Error('Failed to save metadata to Supabase');
  }

  return data;
}
