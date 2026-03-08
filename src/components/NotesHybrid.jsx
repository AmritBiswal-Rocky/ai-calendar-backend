// src/components/NotesHybrid.jsx
import React, { useEffect, useState } from 'react';
import { useNotes } from '@/context/NoteContext';
import {
  initGapi,
  signInWithGoogleDrive,
  listDriveFiles,
  uploadFileToDrive,
} from '@/lib/googleDrive';

export default function NotesHybrid() {
  const { notes, addNote, deleteNote } = useNotes();
  const [newNote, setNewNote] = useState('');
  const [driveFiles, setDriveFiles] = useState([]);
  const [connectedDrive, setConnectedDrive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [driveToken, setDriveToken] = useState(null);

  // --------------------------
  // Notes CRUD via NoteContext
  // --------------------------
  async function handleAddNote() {
    const content = (newNote || '').trim();
    if (!content) return;
    try {
      // Reuse NoteContext API: title + content
      await addNote('Note', content);
      setNewNote('');
    } catch (_) {
      // best-effort, keep UI responsive
    }
  }

  async function handleDeleteNote(id) {
    try {
      await deleteNote(id);
    } catch (err) {
      // NoteContext already surfaces toast; log for debugging only
      console.error('Error deleting note from NotesHybrid:', err);
    }
  }

  // --------------------------
  // Google Drive Integration
  // --------------------------
  useEffect(() => {
    (async () => {
      try {
        await initGapi();
      } catch (_) {}
    })();
  }, []);

  async function handleDriveLogin() {
    try {
      setBusy(true);
      const token = await signInWithGoogleDrive();
      if (token) {
        setConnectedDrive(true);
        setDriveFiles([]);
        setDriveToken(token);
        await fetchDriveFiles(token);
      }
    } finally {
      setBusy(false);
    }
  }

  async function fetchDriveFiles(tokenArg) {
    try {
      const tokenToUse = tokenArg || driveToken;
      if (!tokenToUse) return;
      const files = await listDriveFiles(tokenToUse);
      setDriveFiles(files || []);
    } catch (_) {}
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !connectedDrive || !driveToken) return;
    try {
      setBusy(true);
      await uploadFileToDrive(file, driveToken);
      await fetchDriveFiles(driveToken);
    } finally {
      setBusy(false);
    }
  }

  // --------------------------
  // UI
  // --------------------------
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Notes from NoteContext */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-bold mb-4">📝 My Notes</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button onClick={handleAddNote} className="bg-blue-500 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {(notes || []).map((note) => (
            <li
              key={note.id}
              className="flex justify-between items-center bg-gray-50 border rounded px-3 py-2"
            >
              <span>{note.content}</span>
              <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 hover:underline">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Google Drive Files */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-xl font-bold mb-4">📂 Drive Files</h2>
        {!connectedDrive ? (
          <button
            onClick={handleDriveLogin}
            disabled={busy}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Connect Google Drive
          </button>
        ) : (
          <>
            <input type="file" onChange={handleFileUpload} className="mb-4" />
            <ul className="space-y-2">
              {driveFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex justify-between items-center bg-gray-50 border rounded px-3 py-2"
                >
                  <a
                    href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
