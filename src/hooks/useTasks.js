// src/hooks/useTasks.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/tasks');
        setTasks(res.data || []);
      } catch (err) {
        console.error('Tasks fetch failed:', err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, loading, setTasks };
};

// Socket-enabled variant per requested implementation
export const useTasksSocket = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/tasks');
      setTasks(res.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    if (!socket) return;

    const handler = (data) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === data?.task?.id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = data.task;
          return copy;
        }
        return [...prev, data.task];
      });
    };

    socket.on('task_update', handler);
    return () => {
      socket.off('task_update', handler);
    };
  }, [socket]);

  return { tasks, loading, error };
};

// Simple unauthenticated variant matching the requested shape/signature
export const useTasksSimple = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/tasks'); // correct Flask endpoint
        setTasks(response.data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, loading, error };
};
