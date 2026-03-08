import React from "react";

export default function CreateEventModal({ onClose }) {

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[650px] max-h-[90vh] overflow-y-auto p-6 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create Event</h2>

          <button
            onClick={onClose}
            className="text-gray-500 text-xl"
          >
            ×
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Title</label>

          <input
            type="text"
            placeholder="Event title"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Start */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Start</label>

          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* End */}
        <div className="mb-4">
          <label className="block text-sm mb-1">End</label>

          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Category</label>

          <select className="w-full border rounded-lg px-3 py-2">
            <option>General</option>
            <option>Work</option>
            <option>Personal</option>
          </select>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <label className="block text-sm mb-1">Attachments</label>

          <button className="border rounded-lg px-4 py-2">
            Upload Files
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}
