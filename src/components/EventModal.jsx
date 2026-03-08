// src/components/EventModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Timeline from '@/components/Timeline';
import AlarmClock from '@/components/AlarmClock';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import dayjs from 'dayjs';

export default function EventModal({ isOpen, onClose, event: initialEvent, onSaved, onDeleted }) {
  const { user } = useAuth();
  const { emit } = useSocket() || {};

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Local attachment state for previews only (not persisted yet)
  const [attachments, setAttachments] = useState([]); // [{file, url}]
  const fileInputRef = useRef(null);

  // Auto-focus title input when modal opens
  const titleInputRef = useRef(null);

  const [event, setEvent] = useState({
    id: null,
    title: '',
    start: '',
    end: '',
    category: 'general',
    description: '',
    color: 'blue',
    reminderMinutes: 10,
    accountEmail: '',
    _showUploadArea: false,
    ...initialEvent,
  });

  // Derive selected date (Date) and a human-friendly string
  const selectedDate = event?.start ? dayjs(event.start).toDate() : undefined;
  const selectedDateStr = selectedDate ? selectedDate.toDateString() : undefined;

  // Keep event state in sync when initialEvent changes
  useEffect(() => {
    setEvent((prev) => ({
      id: initialEvent?.id ?? null,
      title: initialEvent?.title ?? initialEvent?.Title ?? initialEvent?.description ?? '',
      start: initialEvent?.start ? dayjs(initialEvent.start).toISOString() : '',
      end: initialEvent?.end ? dayjs(initialEvent.end).toISOString() : (initialEvent?.end ?? ''),
      category:
        (initialEvent?.category ?? prev.category ?? 'general')?.toLowerCase?.() || 'general',
      description: initialEvent?.description ?? prev.description ?? '',
      color: initialEvent?.color ?? prev.color ?? 'blue',
      reminderMinutes: initialEvent?.reminderMinutes ?? prev.reminderMinutes ?? 10,
      accountEmail: initialEvent?.accountEmail ?? prev.accountEmail ?? (user?.email || ''),
      _showUploadArea: prev?._showUploadArea ?? false,
      ...initialEvent,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEvent, user?.email]);

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => titleInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Cleanup attachment preview URLs when modal closes/unmounts
  useEffect(() => {
    if (isOpen) return;
    attachments.forEach((att) => {
      try {
        URL.revokeObjectURL(att.url);
      } catch (e) {}
    });
    setAttachments([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getAuthHeader = async () => {
    try {
      if (!user) return {};
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (e) {
      console.warn('Failed to get id token', e);
      return {};
    }
  };

  const handleChange = (key) => (e) => setEvent((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = await getAuthHeader();

      const payload = {
        id: event.id || undefined,
        title: event.title,
        start: event.start,
        end: event.end || event.start,
        category: event.category || null,
        description: event.description || null,
        color: event.color || 'blue',
        reminder_minutes: Number.isFinite(Number(event.reminderMinutes))
          ? Number(event.reminderMinutes)
          : 10,
        account_email: event.accountEmail || user?.email || null,
      };

      const hasId = Boolean(payload.id);
      const res = hasId
        ? await api.put('/events', payload, { headers })
        : await api.post('/events', payload, { headers });

      const saved = Array.isArray(res?.data) ? res.data[0] : res?.data;

      toast.success('✅ Event saved');

      if (emit && saved) emit('event_updated', { event: saved });

      onSaved?.(saved);
      onClose();
    } catch (err) {
      console.error('Save event failed', err);
      toast.error('❌ Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Delete this event?');
    if (!ok || !event?.id) return;

    setDeleting(true);
    try {
      const headers = await getAuthHeader();

      await api.delete(`/events/${event.id}`, { headers });

      toast.success('🗑️ Event deleted');

      if (emit) emit('event_deleted', { id: event.id });

      onDeleted?.(event.id);
      onClose();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('❌ Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------
  // UI: advanced layout (Image 4/5)
  // + FIX: move modal upward + better visibility
  // ------------------------------
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            initial={{ y: 40, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              willChange: 'transform',
              touchAction: 'none',
              maxHeight: '85vh',
              marginTop: '20px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold">{event.id ? 'Edit Event' : 'Create Event'}</h3>

              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-full grid place-items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body scroll */}
            <div className="px-6 md:px-8 py-5 overflow-y-auto" style={{ maxHeight: '65vh' }}>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm mb-1">Title</label>
                <input
                  ref={titleInputRef}
                  value={event.title}
                  onChange={handleChange('title')}
                  className="w-full p-2.5 rounded border bg-white dark:bg-gray-900"
                  placeholder="Event title"
                />
              </div>

              {/* Start / End */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm mb-1">Start</label>
                  <input
                    value={event.start ? dayjs(event.start).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) =>
                      setEvent((p) => ({ ...p, start: dayjs(e.target.value).toISOString() }))
                    }
                    type="datetime-local"
                    className="w-full p-2.5 rounded border bg-white dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">End</label>
                  <input
                    value={event.end ? dayjs(event.end).format('YYYY-MM-DDTHH:mm') : ''}
                    onChange={(e) =>
                      setEvent((p) => ({ ...p, end: dayjs(e.target.value).toISOString() }))
                    }
                    type="datetime-local"
                    className="w-full p-2.5 rounded border bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm mb-1">Category</label>
                <Select
                  value={(event.category || 'general').toLowerCase()}
                  onValueChange={(val) => setEvent((p) => ({ ...p, category: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attachments */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3">
                  <Label>Attachments</Label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEvent((p) => ({ ...p, _showUploadArea: !p?._showUploadArea }))
                    }
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </Button>
                </div>

                {event?._showUploadArea && (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center bg-muted/20 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files || []);
                      const accepted = files.filter(
                        (f) => /^(image|video)\//.test(f.type) && f.size <= 10 * 1024 * 1024
                      );
                      const mapped = accepted.map((file) => ({
                        file,
                        url: URL.createObjectURL(file),
                      }));
                      setAttachments((prev) => [...prev, ...mapped]);
                    }}
                  >
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop images or videos here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: JPG, PNG, GIF, MP4, MOV (Max 10MB)
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const accepted = files.filter(
                            (f) => /^(image|video)\//.test(f.type) && f.size <= 10 * 1024 * 1024
                          );
                          const mapped = accepted.map((file) => ({
                            file,
                            url: URL.createObjectURL(file),
                          }));
                          setAttachments((prev) => [...prev, ...mapped]);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="mt-3 text-left">
                    <p className="text-sm font-medium mb-2">Selected files</p>
                    <ul className="space-y-2">
                      {attachments.map((att, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded bg-white/50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {att.file.type.startsWith('image/') ? (
                              <img
                                src={att.url}
                                alt={att.file.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-600 text-xs">
                                VID
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="text-sm truncate">{att.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(att.file.size / 1024)} KB
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded bg-red-500 text-white"
                            onClick={() => {
                              setAttachments((prev) => prev.filter((_, i) => i !== idx));
                              try {
                                URL.revokeObjectURL(att.url);
                              } catch (e) {}
                            }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <Label>Timeline</Label>
                <div className="mt-2">
                  <Timeline selectedDate={selectedDate} />
                </div>
                {selectedDateStr && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected date: {selectedDateStr}
                  </p>
                )}
              </div>

              {/* Alarm */}
              <div className="mb-2">
                <Label>Alarm / Reminder</Label>
                <div className="mt-2">
                  <AlarmClock selectedDate={selectedDate} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
                  disabled={saving || deleting}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

              {event.id && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
