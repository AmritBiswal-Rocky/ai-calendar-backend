import React from "react";

export default function CreateTypeModal({ onClose, onCreateEvent }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[500px] p-6 shadow-xl relative">

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-6 text-center">
          What would you like to create?
        </h2>

        <div className="space-y-3">

          <button
            onClick={onCreateEvent}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            + Create Event
          </button>

          <button className="w-full bg-green-600 text-white py-3 rounded-lg">
            Task
          </button>

          <button className="w-full bg-gray-600 text-white py-3 rounded-lg">
            Project
          </button>

          <button className="w-full bg-teal-600 text-white py-3 rounded-lg">
            Appointment
          </button>

          <button className="w-full bg-purple-600 text-white py-3 rounded-lg">
            Working Location
          </button>

          <button className="w-full bg-red-600 text-white py-3 rounded-lg">
            Out of Office
          </button>

        </div>

      </div>
    </div>
  );
}
