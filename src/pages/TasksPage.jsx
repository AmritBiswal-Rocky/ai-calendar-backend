// src/pages/TaskPage.jsx
import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';

const TasksPage = () => {
  const { tasks, addTask, toggleTask, loading } = useTasks();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addTask(newTitle);
    setNewTitle('');
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Tasks</h2>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="border p-2 rounded flex-1"
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      <ul>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`p-2 mb-2 border rounded cursor-pointer ${
              task.completed ? 'bg-green-100 line-through' : 'bg-white'
            }`}
            onClick={() => toggleTask(task.id)}
          >
            {task.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TasksPage;
