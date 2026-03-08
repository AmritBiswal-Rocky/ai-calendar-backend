// src/Tasks.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔄 Load tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      if (!user?.firebase_uid) {
        console.warn('No user authenticated when loading tasks');
        return;
      }

      setLoading(true);
      try {
        const token = await ensureAuth(user);
        if (!token) throw new Error('Authentication failed');

        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.firebase_uid)
          .order('date', { ascending: true });

        if (error) {
          console.error('❌ Error fetching tasks:', error.message);
        } else {
          setTasks(data || []);
        }
      } catch (error) {
        console.error('❌ Authentication error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  // ➕ Add a new task
  const handleAddTask = async () => {
    if (!newTask || !date) return;
    if (!user?.firebase_uid) {
      console.error('No user authenticated when adding task');
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            description: newTask,
            date: new Date(date),
            user_id: user.firebase_uid,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding task:', error.message);
      } else if (data) {
        setTasks([...tasks, data]);
        setNewTask('');
        setDate('');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete a task
  const handleDeleteTask = async (id) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when deleting task');
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.firebase_uid);

      if (error) {
        console.error('❌ Error deleting task:', error.message);
      } else {
        setTasks(tasks.filter((task) => task.id !== id));
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
    } finally {
      setLoading(false);
    }
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
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
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
