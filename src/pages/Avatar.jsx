// src/pages/Avatar.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';
import { gapi } from 'gapi-script';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import uploadToDrive from '@/utils/uploadToDrive';

const QUALITY_OPTIONS = [
  { key: 'standard', label: 'Standard' },
  { key: 'hd', label: 'HD' },
  { key: 'raw', label: 'Raw Data' },
];

export default function AvatarModal({ onClose }) {
  const { user } = useAuth();
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Controls
  const [structureMatch, setStructureMatch] = useState(50);
  const [quality, setQuality] = useState('standard');
  const [colorMatch, setColorMatch] = useState(true);
  const [faceMatch, setFaceMatch] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const structureLabel = useMemo(() => {
    if (structureMatch <= 33) return 'Low';
    if (structureMatch >= 66) return 'High';
    return 'Balanced';
  }, [structureMatch]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const uploadToDrive = async (selectedFile) => {
    try {
      const token = gapi?.auth?.getToken?.();
      if (!token?.access_token) return null;

      const metadata = { name: selectedFile.name, mimeType: selectedFile.type, parents: ['root'] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', selectedFile);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.access_token}` },
          body: form,
        }
      );
      const data = await res.json();
      return data?.id || null;
    } catch (e) {
      console.error('Drive upload failed:', e);
      return null;
    }
  };

  const handleChooseFile = useCallback(() => {
    if (!fileInputRef.current) return;
    try {
      fileInputRef.current.value = '';
    } catch (e) {
      console.warn('Unable to reset file input value', e);
    }
    fileInputRef.current.click();
  }, []);

  const onChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (preview && preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(preview);
      } catch (err) {
        console.warn('Failed to revoke previous preview URL', err);
      }
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }, [preview]);

  const onSave = useCallback(async () => {
    if (!file || !user) return;
    setSaving(true);

    const cleanupPreview = () => {
      if (preview && preview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(preview);
        } catch (err) {
          console.warn('Failed to revoke preview URL', err);
        }
      }
    };

    let avatarUrl = preview;

    try {
      const payload = await uploadToDrive(file);
      const remoteUrl =
        payload?.webViewLink || payload?.view_link || payload?.download_link || payload?.webContentLink;
      if (!remoteUrl) {
        throw new Error('Drive upload response did not include an avatar link');
      }

      avatarUrl = remoteUrl;
      toast.success('Avatar uploaded to Google Drive');
    } catch (err) {
      console.error('Drive upload failed', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
      setSaving(false);
      cleanupPreview();
      return;
    }

    const payload = {
      avatar_url: avatarUrl,
      structure_match: structureMatch,
      quality,
      color_match: colorMatch,
      face_match: faceMatch,
      updated_at: new Date().toISOString(),
    };

    let metadataSaved = false;

    const baseUploadUrl = (BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

    if (baseUploadUrl) {
      try {
        const idToken = (await user?.getIdToken?.()) || undefined;
        const res = await fetch(`${baseUploadUrl}/profile/avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ firebase_uid: user.firebase_uid, ...payload }),
        });

        if (!res.ok) throw new Error(`Backend save failed with status ${res.status}`);
        const data = await res.json();
        const remoteUrl = data?.avatarUrl || data?.avatar_url || avatarUrl;
        avatarUrl = remoteUrl;
        metadataSaved = true;
      } catch (err) {
        console.warn('Backend avatar save failed, attempting Supabase fallback.', err);
      }
    }

    if (!metadataSaved) {
      try {
        const token = await ensureAuth(user);
        if (!token) throw new Error('Authentication failed');

        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert([{ id: user.firebase_uid, ...payload }]);
        if (profileErr) throw profileErr;
        metadataSaved = true;
      } catch (err) {
        console.error('Supabase avatar save failed:', err);
        toast.error(err.message || 'Failed to save avatar settings.');
      }
    }

    if (metadataSaved) {
      setPreview(avatarUrl);
      toast.success('Avatar updated successfully 🎉');
    }

    setSaving(false);
    cleanupPreview();
  }, [BACKEND_URL, colorMatch, faceMatch, file, preview, quality, structureMatch, user]);

  const onDownload = useCallback(() => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    a.download = 'avatar.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [preview]);

  return (
    <motion.div
      className="avatar-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="avatar-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="avatar-header">
          <h2>Edit Avatar</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">

          <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
            {/* Preview Card */}
            <div className="rounded-2xl bg-white shadow border border-slate-200 p-4">
              <div className="rounded-xl overflow-hidden bg-slate-100 aspect-square mb-3 flex items-center justify-center">
                {preview ? (
                  <img ref={imgRef} src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 text-sm text-center px-6">
                    Choose an image to start customizing your avatar.
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleChooseFile}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-5">
          {/* Structure Match */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-700 font-semibold">Structure Match</span>
              <span className="text-xs text-slate-500">{structureLabel}</span>
            </div>
            <div className="px-1">
              <input
                type="range"
                min={0}
                max={100}
                value={structureMatch}
                onChange={(event) => setStructureMatch(Number(event.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Lower values allow more variation; higher values closely match the original structure.
            </div>
          </div>

          {/* Quality */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-700 font-semibold">Quality</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setQuality(opt.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    quality === opt.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Match Toggles */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-slate-700 font-semibold">Color Match</div>
              <button
                type="button"
                onClick={() => setColorMatch((v) => !v)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${
                  colorMatch ? 'bg-slate-900' : 'bg-slate-300'
                }`}
                aria-pressed={colorMatch}
                aria-label="Toggle color match"
              >
                <span
                  className={`inline-flex items-center justify-center h-6 w-6 transform rounded-full shadow transition-all duration-200 ${
                    colorMatch ? 'translate-x-7 bg-emerald-500 text-white' : 'translate-x-1 bg-white text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-slate-700 font-semibold">
                Face Match <span className="ml-1 text-emerald-600 text-xs">Hot</span>
              </div>
              <button
                type="button"
                onClick={() => setFaceMatch((v) => !v)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${
                  faceMatch ? 'bg-slate-900' : 'bg-slate-300'
                }`}
                aria-pressed={faceMatch}
                aria-label="Toggle face match"
              >
                <span
                  className={`inline-flex items-center justify-center h-6 w-6 transform rounded-full shadow transition-all duration-200 ${
                    faceMatch ? 'translate-x-7 bg-emerald-500 text-white' : 'translate-x-1 bg-white text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          </div>

          {/* Advanced */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between text-left text-slate-700 font-semibold"
            >
              <span>Advanced</span>
              <span className="text-xs text-slate-500">{showAdvanced ? 'Hide' : 'Show'} options</span>
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Structure Match</span> affects how closely the generated avatar follows the
                  underlying geometry of your source image. Try lowering it if you want creative variations.
                </div>
                <div>
                  <span className="font-medium">Color Match</span> ensures the palette aligns with your source photo.
                  Toggle it off for experimental color schemes.
                </div>
                <div>
                  <span className="font-medium">Face Match</span> is great for portraits where identity accuracy matters.
                </div>
              </div>
            )}
          </div>

            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !preview}
              className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors ${
                saving ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'
              } disabled:bg-slate-300 disabled:text-slate-500`}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={!preview}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
            >
              Download
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
