import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import useNotes from "../hooks/useNotes";
import axios from "axios";

const Dashboard = () => {
  const { tasks } = useTasks();
  const { notes } = useNotes();

  // Local state for new task/note form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // ---- Task CRUD ----
  const addTask = async () => {
    if (!taskTitle) return;
    try {
      await axios.post("http://127.0.0.1:5000/tasks", {
        title: taskTitle,
        description: taskDesc,
      });
      setTaskTitle("");
      setTaskDesc("");
    } catch (err) {
      console.error("Add task failed:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/tasks/${id}`);
    } catch (err) {
      console.error("Delete task failed:", err);
    }
  };

  // ---- Note CRUD ----
  const addNote = async () => {
    if (!noteTitle) return;
    try {
      await axios.post("http://127.0.0.1:5000/notes", {
        title: noteTitle,
        content: noteContent,
      });
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      console.error("Add note failed:", err);
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/notes/${id}`);
    } catch (err) {
      console.error("Delete note failed:", err);
    }
  };

  return (
    <div className="p-6 space-y-10">
      {/* TASKS SECTION */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tasks</h2>

        {/* Add Task Form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="border p-2 rounded w-40"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Description"
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            className="border p-2 rounded w-60"
          />
          <button
            onClick={addTask}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>

        {/* Task List */}
        {tasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-3 border rounded shadow-sm flex justify-between"
              >
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NOURSE SECTION */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Nourse</h2>

        {/* Add Note Form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nourse title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="border p-2 rounded w-40"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Content"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="border p-2 rounded w-60"
          />
          <button
            onClick={addNote}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>

        {/* Nourse List */}
        {notes.length === 0 ? (
          <p>No nourse entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="p-3 border rounded shadow-sm flex justify-between"
              >
                <div>
                  <strong>{note.title}</strong>
                  <p>{note.content}</p>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
