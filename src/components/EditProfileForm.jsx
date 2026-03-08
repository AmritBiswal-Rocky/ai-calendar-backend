// ─────────────────────────────────────────────
// src/components/EditProfileForm.jsx
// ✅ Profile Editor with Nationality support
// ✅ Uploads avatar to Google Photos via backend
// ✅ Includes cropper + toast + Supabase sync-ready
// ✅ Added console log for nationality debug
// ─────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import getCroppedImg from '@/utils/cropImage';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const EditProfileForm = ({ onSave = null, onCancel, initialData = {}, onClose }) => {
  const { user } = useAuth() || { user: null };

  const [formData, setFormData] = useState({
    name: initialData.name || initialData.full_name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    bio: initialData.bio || '',
    nationality: initialData.nationality || '',
  });

  const [avatar, setAvatar] = useState(initialData.avatar || '');
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);

  // ─────────────────────────────────────────────
  // 🌍 Load country list
  // ─────────────────────────────────────────────
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        const data = await res.json();
        const sorted = data.map((c) => c.name.common).sort((a, b) => a.localeCompare(b));
        setCountries(sorted);
      } catch (err) {
        console.error('Failed to load countries', err);
      }
    };
    loadCountries();
  }, []);

  // ─────────────────────────────────────────────
  // Load profile
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.firebase_uid) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/profile/${user.firebase_uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.full_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            bio: data.bio || '',
            nationality: data.nationality || '',
          });
          setAvatar(data.avatar_url || '');
        } else if (res.status === 404) {
          // Auto-create new profile
          const newProfile = {
            firebase_uid: user.firebase_uid,
            email: user.email,
            full_name: user.displayName || '',
            avatar_url: user.photoURL || '',
          };
          const insertRes = await fetch(`${API_BASE}/profile/${user.firebase_uid}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newProfile),
          });
          if (!insertRes.ok) throw new Error('Failed to create profile');
          toast.success('New profile created!');
          setFormData({
            name: newProfile.full_name,
            email: newProfile.email,
            phone: '',
            bio: '',
            nationality: '',
          });
          setAvatar(newProfile.avatar_url);
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.firebase_uid]);

  // ─────────────────────────────────────────────
  // 🖼️ Cropper logic
  // ─────────────────────────────────────────────
  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const applyCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(avatar, croppedAreaPixels);
      setAvatar(croppedImage);
      setIsCropping(false);
      toast.success('Avatar cropped successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to crop avatar');
    }
  };

  // ─────────────────────────────────────────────
  // 📸 Handle avatar file
  // ─────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = () => {
    setAvatar('');
    toast.success('Avatar reset');
  };

  const handleDeleteAvatar = () => {
    setAvatar('');
    toast.success('Avatar deleted');
  };

  // ─────────────────────────────────────────────
  // ☁️ Upload avatar to Google Photos
  // ─────────────────────────────────────────────
  const uploadAvatarToPhotos = async (base64Image) => {
    try {
      const token = await user.getIdToken();
      const blob = await (await fetch(base64Image)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');

      const res = await fetch(`${API_BASE}/upload/avatar/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Google Photos upload failed');
      const data = await res.json();
      return data.fileUrl;
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload avatar to Google Photos');
      return null;
    }
  };

  // ─────────────────────────────────────────────
  // 💾 Submit profile
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.firebase_uid) return toast.error('User not authenticated');

    console.log('Saving profile with nationality:', formData.nationality);

    setLoading(true);
    try {
      let avatar_url = avatar;
      if (avatar.startsWith('data:')) {
        avatar_url = await uploadAvatarToPhotos(avatar);
        if (!avatar_url) throw new Error('Avatar upload failed');
      }

      const token = await user.getIdToken();
      const payload = {
        full_name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        avatar_url: avatar_url || null,
        nationality: formData.nationality || null,
      };

      const res = await fetch(`${API_BASE}/profile/${user.firebase_uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully!');
      if (onSave) await onSave(payload);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // 🧩 Render
  // ─────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-md"
    >
      {loading && <div className="text-sm text-gray-500">Processing...</div>}

      {/* Avatar Section */}
      <div className="flex items-center space-x-4">
        <img
          src={avatar || '/default-avatar.png'}
          alt="Avatar"
          className="w-16 h-16 rounded-full object-cover border"
        />
        <div className="flex flex-col space-y-2">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload
          </Button>
          <Button type="button" variant="outline" onClick={handleResetAvatar}>
            Reset
          </Button>
          <Button type="button" variant="destructive" onClick={handleDeleteAvatar}>
            Delete
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Cropper Modal */}
      <AnimatePresence>
        {isCropping && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-[90%] md:w-[500px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700">
                <Cropper
                  image={avatar}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <Label htmlFor="zoom">Zoom</Label>
                <Input
                  type="range"
                  id="zoom"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsCropping(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={applyCrop}>
                  Apply
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="dark:bg-gray-800"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="dark:bg-gray-800"
          />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-800"
          />
        </div>

        {/* 🆕 Nationality Selector */}
        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <select
            id="nationality"
            value={formData.nationality || ''}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-800"
          >
            <option value="">Select your country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default EditProfileForm;
