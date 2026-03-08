import React, { useState } from 'react';
import { useEvents } from '../context/EventContext';

export default function EventPanel({ date, onClose }) {
  const { addEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState([]);

  const handleSave = () => {
    addEvent({
      title,
      date: date.toISOString(),
      files,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md w-96">
        <h2 className="text-lg font-semibold mb-2">Add Event – {date.toDateString()}</h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="border p-2 w-full rounded mb-3 bg-transparent"
        />

        {/* Upload area */}
        <div className="border-2 border-dashed rounded p-3 mb-3 text-center">
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-left">
              {files.map((f, i) => (
                <li key={i}>📎 {f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800">
            Cancel
          </button>
          <button onClick={handleSave} className="px-3 py-1 rounded bg-blue-600 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
