// ─────────────────────────────────────────────
// src/components/listeners/TaskListener.jsx
// Unified Task Socket Listener
// - Merged from legacy TaskListener files
// - Real-time sync via Socket.IO
// - Delegates all state updates to TaskContext
// ─────────────────────────────────────────────

import { useEffect, useMemo } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useTasks } from '@/context/TaskContext';

export default function TaskListener() {
  const { socket } = useSocket() || {};
  const { addTask, updateTask, deleteTask, setTasks } = useTasks();

  // ─────────────────────────────────────────────
  // Normalize & centralize handlers
  // ─────────────────────────────────────────────
  const handlers = useMemo(
    () => ({
      // Single task created
      created: (task) => {
        if (!task || !task.id) return;
        addTask(task);
      },

      // Single task updated
      updated: (task) => {
        if (!task || !task.id) return;
        updateTask(task);
      },

      // Task deleted (supports multiple payload shapes)
      deleted: (payload) => {
        const id = payload?.id ?? payload?._id ?? payload?.taskId ?? payload;

        if (id) deleteTask(id);
      },

      // Optional: full task sync (legacy / fallback)
      bulkUpdated: (tasks) => {
        if (Array.isArray(tasks)) {
          setTasks(tasks);
        }
      },
    }),
    [addTask, updateTask, deleteTask, setTasks]
  );

  // ─────────────────────────────────────────────
  // Socket subscriptions
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Modern granular events
    socket.on('task_created', handlers.created);
    socket.on('task_updated', handlers.updated);
    socket.on('task_deleted', handlers.deleted);

    // Legacy / fallback support (safe, optional)
    socket.on('task_update', handlers.updated);
    socket.on('tasks_updated', handlers.bulkUpdated);

    return () => {
      socket.off('task_created', handlers.created);
      socket.off('task_updated', handlers.updated);
      socket.off('task_deleted', handlers.deleted);

      socket.off('task_update', handlers.updated);
      socket.off('tasks_updated', handlers.bulkUpdated);
    };
  }, [socket, handlers]);

  return null; // headless listener
}
