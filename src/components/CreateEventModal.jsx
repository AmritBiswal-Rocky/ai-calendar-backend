import React, { useState, useEffect } from "react";

export default function CreateEventModal({ onClose, start, end, onSave }) {

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState("General");
  const [alarmTime, setAlarmTime] = useState("");
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    if (start) setStartTime(start);
    if (end) setEndTime(end);
  }, [start, end]);

  const addAlarm = () => {
    if (!alarmTime) return;
    setAlarms([...alarms, alarmTime]);
    setAlarmTime("");
  };

  const handleSave = () => {
    const event = {
      title,
      start: startTime,
      end: endTime,
      category,
      alarms
    };

    onSave(event);
    onClose();
  };

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Start */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Start</label>

          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* End */}
        <div className="mb-4">
          <label className="block text-sm mb-1">End</label>

          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option>General</option>
            <option>Work</option>
            <option>Personal</option>
            <option>Meeting</option>
            <option>Reminder</option>
          </select>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <label className="block text-sm mb-1">Attachments</label>

          <button className="border rounded-lg px-4 py-2 hover:bg-gray-100">
            Upload Files
          </button>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Timeline</h3>

          <p className="text-sm text-gray-500">
            No events yet
          </p>
        </div>

        {/* Alarm / Reminder */}
        <div className="mb-6">

          <h3 className="text-lg font-semibold mb-2">
            Alarm / Reminder
          </h3>

          <div className="flex items-center gap-3 mb-2">

            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />

            <button
              onClick={addAlarm}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Add
            </button>

          </div>

          {alarms.length === 0 && (
            <p className="text-sm text-gray-500">
              No alarms set
            </p>
          )}

          {alarms.map((a, i) => (
            <div key={i} className="text-sm text-gray-700">
              ⏰ {a}
            </div>
          ))}

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
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}
