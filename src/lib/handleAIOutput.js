import { createGoogleDoc } from '../api/googleDocs';
import { uploadToGoogleCloud, uploadToGoogleDrive } from '../api/googleCloudStorage';
import { saveNote } from './notes';

/**
 * handleSaveOutput - persists AI generated outputs to external services.
 * @param {{ type: 'text' | 'image' | 'video' | string, text?: string, file?: File }} aiOutput
 * @returns {Promise<string | undefined>} ID or URL of saved resource.
 */
export async function handleSaveOutput(aiOutput, accessToken) {
  try {
    if (!aiOutput || !aiOutput.type) {
      throw new Error('AI output payload is missing a type field.');
    }

    if (aiOutput.type === 'text') {
      const title = aiOutput.title || 'Radeles AI Output';
      const content = aiOutput.text || '';
      const docId = await createGoogleDoc(title, content, accessToken);
      console.log('✅ Saved text to Google Doc:', docId);
      return docId;
    }

    if (aiOutput.type === 'image' || aiOutput.type === 'video') {
      if (!aiOutput.file) {
        throw new Error('Media output requires a File object.');
      }

      let link;
      if (accessToken) {
        link = await uploadToGoogleDrive(aiOutput.file, accessToken);
      } else {
        link = await uploadToGoogleCloud(aiOutput.file);
      }
      console.log('✅ Uploaded media to Google Cloud Storage:', link);
      return link;
    }

    // Fallback for unsupported types: store as a note entry if available.
    if (typeof aiOutput.text === 'string') {
      const noteId = await saveNote({ title: aiOutput.title || 'AI Output', body: aiOutput.text });
      console.log('ℹ️ Saved AI output as note:', noteId);
      return noteId;
    }

    console.warn('⚠️ AI output type not supported for automatic saving:', aiOutput.type);
    return undefined;
  } catch (error) {
    console.error('❌ Failed to save AI output:', error);
    throw error;
  }
}
