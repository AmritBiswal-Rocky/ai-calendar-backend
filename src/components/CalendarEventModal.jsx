// ─────────────────────────────────────────────
// CalendarEventModal.jsx (Option B - Full GC Style)
// Modern, complete UI aligned with Google Calendar layout
// Centralized file handling via saveEventWithFiles()
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { saveEventWithFiles } from '@/utils/driveSupabaseHelpers';

const COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];

const CATEGORIES = ['general', 'work', 'personal', 'meeting', 'reminder'];

export default function CalendarEventModal({ isOpen, onClose, currentUser, initialEvent }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');

  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [category, setCategory] = useState('general');
  const [color, setColor] = useState('blue');

  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // Load existing event when editing
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setDescription(initialEvent.description || '');

      if (initialEvent.start_time) {
        const d = new Date(initialEvent.start_time);
        setStartDate(d.toISOString().slice(0, 10));
        setStartTime(d.toTimeString().slice(0, 5));
      }

      if (initialEvent.end_time) {
        const d = new Date(initialEvent.end_time);
        setEndDate(d.toISOString().slice(0, 10));
        setEndTime(d.toTimeString().slice(0, 5));
      }

      setCategory(initialEvent.category || 'general');
      setColor(initialEvent.color || 'blue');
      setAttachments(initialEvent.attachments || []);
    }
  }, [initialEvent]);

  // ─────────────────────────────────────────────
  // Handle file selects
  // ─────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const mapped = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setAttachments((prev) => [...prev, ...mapped]);
  };

  // ─────────────────────────────────────────────
  // Save event using centralized helper
  // ─────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);

      const startISO = startDate && startTime ? `${startDate}T${startTime}:00` : null;

      const endISO = endDate && endTime ? `${endDate}T${endTime}:00` : null;

      const eventData = {
        id: initialEvent?.id || null,
        title,
        description,
        start_time: startISO,
        end_time: endISO,
        category,
        color,
      };

      await saveEventWithFiles(currentUser, eventData, attachments);

      onClose();
    } catch (err) {
      console.error('Failed saving:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Render UI
  // ─────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">
            {initialEvent ? 'Edit Event' : 'Create Event'}
          </h2>

          {/* Title */}
          <input
            type="text"
            placeholder="Event title"
            className="w-full border rounded px-3 py-2 mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Start & End DateTime */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm font-medium">Start</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 mb-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">End</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 mb-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <textarea
            placeholder="Description"
            className="w-full border rounded px-3 py-2 mb-3"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Category */}
          <label className="text-sm font-medium">Category</label>
          <select
            className="w-full border rounded px-3 py-2 mb-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          {/* Color */}
          <label className="text-sm font-medium">Event Color</label>
          <div className="flex gap-3 mb-4 mt-1">
            {COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border cursor-pointer ${
                  color === c ? 'ring-2 ring-black' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer mb-4">
            <input
              type="file"
              multiple
              className="hidden"
              id="event-attachment-input"
              onChange={handleFileUpload}
            />
            <label htmlFor="event-attachment-input" className="cursor-pointer">
              <p className="text-sm text-gray-600">Drag and drop files or click to upload</p>
            </label>
          </div>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="space-y-3 mb-4">
              {attachments.map((att, idx) => (
                <div key={idx} className="border rounded p-2">
                  {att.preview && (
                    <img
                      src={att.preview}
                      alt="preview"
                      className="w-full h-32 object-cover rounded mb-1"
                    />
                  )}

                  <div className="flex justify-between text-sm mb-1">
                    <span>{att.file?.name || att.name}</span>
                    <span>{att.progress || 0}%</span>
                  </div>

                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-blue-500 rounded transition-all"
                      style={{ width: `${att.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose} disabled={saving}>
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
