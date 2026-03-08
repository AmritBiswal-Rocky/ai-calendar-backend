// src/pages/Profile.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getFirebaseToken } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Edit3,
  Camera,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
  FileText,
  Upload,
  Phone,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const baseUploadUrl = useMemo(
    () => (BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, ''),
    [BACKEND_URL]
  );
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    role: '',
  });
  const [editOpen, setEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ tasks: 0, notes: 0, uploads: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [connected, setConnected] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [source, setSource] = useState('Unknown');
  const quickAvatarInputRef = useRef(null);

  // Load Profile (via backend API)
  const fetchProfile = useCallback(async () => {
    if (!user?.firebase_uid) {
      setLoading(false);
      setProfile(null);
      setForm((prev) => ({
        ...prev,
        full_name: '',
        bio: '',
        avatar_url: '',
        phone: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        role: '',
      }));
      setConnected(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const token = await getFirebaseToken();
      if (!token) {
        throw new Error('No Firebase token available');
      }

      const res = await fetch('/api/profile', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load profile (status ${res.status})`);
      }

      const data = await res.json();

      setConnected(true);
      setProfile({ ...data });
      setForm({
        full_name: data.full_name || data.name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || user?.photoURL || '',
        phone: data.phone || '',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        role: data.role || '',
      });
    } catch (err) {
      console.error('Profile load error:', err);
      setConnected(false);
      setProfile({
        id: user.firebase_uid,
        full_name: user.displayName || 'Your Name',
        bio: '',
        avatar_url: user.photoURL || '',
      });
      setForm({
        full_name: user.displayName || '',
        bio: '',
        avatar_url: user.photoURL || '',
        phone: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        role: '',
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user?.firebase_uid, BACKEND_URL, user]);

  const loadProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const loadStats = useCallback(async () => {
    if (!user?.firebase_uid) return;
    try {
      const token = await getFirebaseToken();
      if (!token) return;

      const res = await fetch('/api/profile/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load stats (status ${res.status})`);
      }

      const data = await res.json();

      setStats({
        tasks: data.tasks || 0,
        notes: data.notes || 0,
        uploads: data.uploads ?? [profile?.avatar_url].filter(Boolean).length,
      });
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, [profile?.avatar_url, user?.firebase_uid]);

  useEffect(() => {
    const init = async () => {
      await fetchProfile();
    };
    init();
  }, [fetchProfile]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Connectivity checks (backend only)
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl) {
      fetch(`${backendUrl}/health`)
        .then((res) => {
          if (res && res.ok) {
            setBackendConnected(true);
            setSource('Backend');
          }
        })
        .catch(() => setBackendConnected(false));
    }
  }, [backendConnected]);

  const uploadFileToDrive = useCallback(
    async (file) => {
      if (!file) throw new Error('No file provided');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${baseUploadUrl}/upload_to_drive`, {
        method: 'POST',
        body: formData,
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (err) {
        console.error('Failed to parse Drive upload response', err);
      }

      if (!response.ok) {
        const message = (payload && payload.error) || `Drive upload failed with status ${response.status}`;
        throw new Error(message);
      }

      if (!payload) {
        throw new Error('Drive upload succeeded but returned no payload');
      }

      return payload;
    },
    [baseUploadUrl]
  );

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.firebase_uid) return;

    if (file.size > 5 * 1024 * 1024) return toast.error('File size must be less than 5MB');
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');

    try {
      setUploading(true);
      const uploaded = await uploadFileToDrive(file);
      const remoteUrl = uploaded.view_link || uploaded.webViewLink || uploaded.download_link || uploaded.webContentLink;
      if (!remoteUrl) {
        throw new Error('Drive upload response did not include an avatar link');
      }

      setForm((f) => ({ ...f, avatar_url: remoteUrl }));
      setProfile((prev) => (prev ? { ...prev, avatar_url: remoteUrl } : prev));
      toast.success('Avatar uploaded to Google Drive');
      await loadStats();
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  // Save Profile
  const saveProfile = async () => {
    if (!user?.firebase_uid) return;
    if (!form.full_name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!connected) {
      toast.error('Saving profile requires a working backend.');
      return;
    }

    try {
      setIsSaving(true);

      const token = await getFirebaseToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: (form.full_name || '').trim(),
          bio: (form.bio || '').trim(),
          avatar_url: form.avatar_url || null,
          phone: form.phone || '',
          timezone: form.timezone || '',
          role: form.role || '',
        }),
      });

      if (!res.ok) {
        throw new Error(`Profile save failed (status ${res.status})`);
      }

      const updated = await res.json();

      setForm((p) => ({
        ...p,
        full_name: updated.full_name || p.full_name,
        avatar_url: updated.avatar_url || p.avatar_url,
        bio: updated.bio ?? p.bio,
        phone: updated.phone ?? p.phone,
        timezone: updated.timezone ?? p.timezone,
        role: updated.role ?? p.role,
      }));

      toast.success('Profile saved successfully');
      setEditOpen(false);

      await loadProfile();
      await loadStats();
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name || profile.name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  };

  const handleEditClose = () => {
    setEditOpen(false);
    resetForm();
  };

  // UI Rendering
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={loadProfile} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          </div>
          <p className="text-gray-600 ml-11">Manage your account information and preferences</p>
        </div>

        {/* Connection Status Alert */}
        {!backendConnected && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-800 font-medium mb-1">Editing is disabled</p>
                <p className="text-amber-700 text-sm mb-3">Start your backend (VITE_BACKEND_URL) to enable editing.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadProfile();
                    loadStats();
                  }}
                  className="bg-white hover:bg-amber-50 border-amber-300 text-amber-700"
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Data Source Indicator */}
        {backendConnected && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800 font-medium">Connected to: {source}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <button
                  type="button"
                  className="block"
                  onClick={() => {
                    if (connected && quickAvatarInputRef.current) quickAvatarInputRef.current.click();
                    else setEditOpen(true);
                  }}
                  title={connected ? 'Change avatar' : 'Backend not connected'}
                >
                  <img
                    src={
                      profile?.avatar_url ||
                      user?.photoURL ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || profile?.name || 'User'}`
                    }
                    alt="avatar"
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-gray-100 shadow-sm"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2.5 shadow-lg group-hover:scale-110 transition-all duration-200">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile?.full_name || profile?.name || 'No name set'}
                </h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="p-1 bg-gray-100 rounded">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{user?.email || 'No email'}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {profile?.bio || 'Add a short bio to tell others about yourself.'}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStats}
                  className="flex items-center gap-2 px-6 py-2.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Stats
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.notes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Uploads</p>
                <p className="text-3xl font-bold text-gray-900">{stats.uploads}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LinkIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Connected Accounts</p>
                <p className="text-sm text-gray-600">Manage your connected services</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.providerData?.some((p) => (p.providerId || '').includes('google')) ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Google connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Not connected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input for avatar upload */}
        <input
          ref={quickAvatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarChange}
          disabled={!connected}
        />

        {/* Edit Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-white rounded-xl shadow-xl p-6 max-w-lg">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </div>
                Edit Profile
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Avatar in Modal */}
              <div className="flex items-center gap-4">
                <img
                  src={
                    form.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${form.full_name || 'User'}`
                  }
                  alt="avatar"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <Label htmlFor="avatar" className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4" />
                    <span className="font-medium">Avatar</span>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    disabled={uploading || !connected}
                    className="mb-3"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {!connected && (
                    <div className="text-xs text-amber-600">
                      Backend not connected; editing disabled.
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setForm((p) => ({ ...p, avatar_url: '' }));
                      if (connected) {
                        try {
                          const sb = (await getSupabaseClient()) || baseSupabase;
                          await sb
                            .from('profiles')
                            .update({ avatar_url: null, updated_at: new Date().toISOString() })
                            .eq('id', user.firebase_uid);
                          toast.success('Avatar removed');
                        } catch (e) {
                          console.warn(
                            'Failed to remove avatar immediately, will save on submit.',
                            e
                          );
                        }
                      }
                    }}
                    disabled={!connected}
                    className="text-xs"
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Remove avatar
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="full_name" className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Name</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                    disabled={!connected}
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Bio</span>
                  </Label>
                  <Input
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell something about yourself"
                    disabled={!connected}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Phone</span>
                    </Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. +91 98765 43210"
                      disabled={!connected}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Timezone</span>
                    </Label>
                    <Input
                      id="timezone"
                      value={form.timezone}
                      onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                      placeholder="e.g. Asia/Kolkata"
                      disabled={!connected}
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role" className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Role</span>
                  </Label>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    placeholder="e.g. Admin, Member"
                    disabled={!connected}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleEditClose} className="px-6">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={saveProfile} disabled={isSaving || uploading || !connected} className="px-6">
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;
