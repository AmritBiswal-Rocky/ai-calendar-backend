// src/components/EditTask.jsx
import React, { useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';

const EditTask = ({ task, onClose }) => {
  const [description, setDescription] = useState(task.description);
  const [date, setDate] = useState(task.date);
  const [priority, setPriority] = useState(task.priority || '');
  const [tag, setTag] = useState(task.tag || '');

  const socket = useSocket();

  const handleUpdate = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('tasks')
      .update({
        description,
        date,
        priority: priority || null,
        tag: tag || null,
      })
      .eq('id', task.id)
      .select()
      .single();

    if (error) {
      toast.error('❌ Failed to update task');
      return;
    }

    toast.success('✏️ Task updated!');

    // 🔌 Emit to WebSocket
    if (socket && data) {
      socket.emit('task_updated', { task: data });
    }

    onClose?.(); // close modal or form
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-3">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="Description"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="">Select Priority</option>
        <option value="High">High 🔴</option>
        <option value="Medium">Medium 🟡</option>
        <option value="Low">Low 🟢</option>
      </select>
      <input
        type="text"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="Tag"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        💾 Save Changes
      </button>
    </form>
  );
};

export default EditTask;
