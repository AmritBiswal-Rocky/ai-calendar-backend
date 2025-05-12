import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAuth } from "firebase/auth";

const localizer = momentLocalizer(moment);

const CalendarTasks = () => {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const formattedEvents = data.map((task) => ({
        id: task.id,
        title: task.description,
        start: new Date(task.date),
        end: new Date(task.date),
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo.start);
  };

  const handleAddTask = async () => {
    const user = auth.currentUser;
    if (!user || !taskDescription || !selectedSlot) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: taskDescription,
          date: selectedSlot.toISOString(),
        }),
      });

      if (res.ok) {
        setTaskDescription("");
        setSelectedSlot(null);
        fetchTasks(); // Refresh tasks
      } else {
        setError("Failed to add task.");
      }
    } catch (err) {
      console.error(err);
      setError("Error adding task.");
    }
  };

  const handleDeleteTask = async (event) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm(`Delete task "${event.title}"?`)) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: event.id }),
      });

      if (res.ok) {
        fetchTasks(); // Refresh after delete
      } else {
        setError("Failed to delete task.");
      }
    } catch (err) {
      console.error(err);
      setError("Error deleting task.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">My Tasks</h2>

      {loading ? (
        <p>Loading tasks...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No tasks yet. Click on the calendar to add one.</p>
      ) : null}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        style={{ height: 500 }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleDeleteTask}
      />

      {selectedSlot && (
        <div className="mt-4">
          <h3 className="font-medium">Add Task for {selectedSlot.toDateString()}</h3>
          <input
            className="border p-2 mr-2"
            type="text"
            placeholder="Task description"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleAddTask}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarTasks;















