import React from 'react';
import { useEvents } from '../context/EventContext';

export default function Timeline() {
  const { events } = useEvents();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">🕒 Timeline</h1>
      <ul>
        {(events || []).map((e) => (
          <li key={e.id} className="mb-2">
            <span className="font-semibold">{e.title}</span> —{' '}
            {e.date ? new Date(e.date).toLocaleDateString() : ''}
            {e.files?.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">({e.files.length} files)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
