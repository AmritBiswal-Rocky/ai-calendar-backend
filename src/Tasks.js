// src/Tasks.js

import React, { useState, useEffect } from 'react';
import { supabase, setSupabaseSession } from './supabaseClient';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔄 Load tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      await setSupabaseSession(); // ✅ Ensure Supabase uses Firebase token
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching tasks:', error.message);
      } else {
        setTasks(data);
      }
      setLoading(false);
    };

    loadTasks();
  }, []);

  // ➕ Add a new task
  const handleAddTask = async () => {
    if (!newTask || !date) return;

    setLoading(true);
    const { data, error } = await supabase.from('tasks').insert([
      {
        description: newTask,
        date: new Date(date),
      },
    ]);

    if (error) {
      console.error('❌ Error adding task:', error.message);
    } else {
      setTasks([...tasks, ...data]);
      setNewTask('');
      setDate('');
    }
    setLoading(false);
  };

  // ❌ Delete a task
  const handleDeleteTask = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('❌ Error deleting task:', error.message);
    } else {
      setTasks(tasks.filter((task) => task.id !== id));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📝 Task List</h2>

      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Enter task description"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={handleAddTask} disabled={loading}>
          Add Task
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.description} — {new Date(task.date).toLocaleString()}
              <button onClick={() => handleDeleteTask(task.id)} style={{ marginLeft: 10 }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Tasks;





