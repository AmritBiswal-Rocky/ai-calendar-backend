// src/components/SocketComponent.jsx
import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useTasks } from '../context/TaskContext';
import { toast } from 'react-hot-toast';

const SocketComponent = () => {
  const { socket, isConnected } = useSocket();
  const { updateTask } = useTasks();

  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdate = (task) => {
      if (!task) return;
      if (updateTask) updateTask(task);
      try {
        toast(`Task updated: ${task.description || task.title || task.id}`);
      } catch (e) {
        console.error('[SocketComponent] toast task update failed', e);
      }
    };

    socket.on('task_update', handleTaskUpdate);

    return () => {
      socket.off('task_update', handleTaskUpdate);
    };
  }, [socket, updateTask]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      try {
        toast.success('Socket connected');
      } catch (e) {
        console.error('[SocketComponent] toast connect failed', e);
      }
    };

    const handleDisconnect = () => {
      try {
        toast.error('Socket disconnected');
      } catch (e) {
        console.error('[SocketComponent] toast disconnect failed', e);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return null; // No UI, only handles socket events
};

export default SocketComponent;
