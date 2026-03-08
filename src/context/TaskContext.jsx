// ─────────────────────────────────────────────
// src/context/TaskContext.jsx
// Stable • Real-time Sync (Backend API + WebSocket)
// Backend API = with Firebase token
// DEADLOCK FIXED: loading always resolves
// ─────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import PropTypes from 'prop-types';

import { useSocket } from './SocketContext';
import { useAuth as useAuthHook } from '@/context/AuthContext';

import { toast } from 'react-hot-toast';
import { getFirebaseToken } from '@/lib/auth';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const TASK_STATUS = ['pending', 'completed'];

const TaskContext = createContext(null);

export const useTasks = () => useContext(TaskContext);
export const useTask = () => useContext(TaskContext);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────
export const TaskProvider = forwardRef(({ children }, ref) => {
  const { user } = useAuthHook();
  const { socket } = useSocket() || {};

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const tasksRef = useRef([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // ─────────────────────────────────────────────
  // FETCH TASKS (DEADLOCK SAFE)
  // ─────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!user?.firebase_uid) {
      // 🔴 CRITICAL FIX — unblock UI
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getFirebaseToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/tasks', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to load tasks (status ${res.status})`);

      const data = await res.json();
      setTasks(data || []);
    } catch (err) {
      console.error('❌ Error fetching tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user?.firebase_uid]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ─────────────────────────────────────────────
  // ADD TASK
  // ─────────────────────────────────────────────
  const addTask = useCallback(
    async (task) => {
      if (!user?.firebase_uid) return;

      try {
        const payload = {
          ...task,
          firebase_uid: user.firebase_uid,
          completed: task.completed ?? false,
        };

        const token = await getFirebaseToken();
        if (!token) throw new Error('Not authenticated');

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Failed to add task (status ${res.status})`);

        const data = await res.json();

        setTasks((prev) => [data, ...prev]);
        socket?.emit('task_created', data);
        return data;
      } catch (err) {
        console.error('❌ Error adding task:', err);
        toast.error('Failed to add task');
      }
    },
    [user?.firebase_uid, socket]
  );

  // ─────────────────────────────────────────────
  // UPDATE TASK
  // ─────────────────────────────────────────────
  const updateTask = useCallback(
    async (taskId, updates) => {
      if (!user?.firebase_uid || !taskId) return;

      try {
        const token = await getFirebaseToken();
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
        });

        if (!res.ok) throw new Error(`Failed to update task (status ${res.status})`);

        const data = await res.json();

        setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
        socket?.emit('task_updated', data);
        return data;
      } catch (err) {
        console.error('❌ Error updating task:', err);
        toast.error('Failed to update task');
      }
    },
    [user?.firebase_uid, socket]
  );

  // ─────────────────────────────────────────────
  // DELETE TASK
  // ─────────────────────────────────────────────
  const deleteTask = useCallback(
    async (taskId) => {
      if (!user?.firebase_uid || !taskId) return;

      try {
        const token = await getFirebaseToken();
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`Failed to delete task (status ${res.status})`);

        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        socket?.emit('task_deleted', { id: taskId });
        return true;
      } catch (err) {
        console.error('❌ Error deleting task:', err);
        toast.error('Failed to delete task');
      }
    },
    [user?.firebase_uid, socket]
  );

  // ─────────────────────────────────────────────
  // TOGGLE TASK
  // ─────────────────────────────────────────────
  const toggleTask = useCallback(
    async (taskId) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;

      return updateTask(taskId, { completed: !task.completed });
    },
    [updateTask]
  );

  // ─────────────────────────────────────────────
  // SOCKET EVENTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('task_created', (task) => {
      setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
    });

    socket.on('task_updated', (task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    });

    socket.on('task_deleted', ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
    };
  }, [socket]);

  // ─────────────────────────────────────────────
  // REF API
  // ─────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    fetchTasks,
    setTasks,
  }));

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        fetchTasks,
        loading,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
});

TaskProvider.displayName = 'TaskProvider';
TaskProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
