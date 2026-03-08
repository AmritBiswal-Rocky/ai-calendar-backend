// src/components/CalendarTasks.jsx
import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
// same folder CSS
import './CalendarView.css';
// calendar subfolder CSS
import './calendar/Calendar.css';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AddTask from './AddTask';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';

const CalendarTasks = ({ loading, selectedDate }) => {
  const navigate = useNavigate();
  const { tasks, deleteTask } = useTasks();
  const { user } = useAuth();

  // Default to today's date if prop not passed
  const today = new Date().toISOString().split('T')[0];
  const dateToUse = selectedDate || today;

  // Filter tasks by date
  const filteredTasks = tasks.filter((task) => task.date === dateToUse);

  /* ──────────────── Helpers ──────────────── */

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    if (!user?.firebase_uid) {
      toast.error('You must be logged in to delete tasks');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('firebase_uid', user.firebase_uid);

      if (error) {
        toast.error('❌ Failed to delete task');
        throw error;
      } else {
        deleteTask(id); // remove from context (real-time sync)
        toast.success('🗑️ Task deleted!');
      }
    } catch (err) {
      console.error('⚠️ Delete error:', err);
      toast.error('⚠️ Something went wrong');
    }
  };

  const goToCalendarView = () => navigate('/calendar-view');

  const getPriorityBadge = (priority) => {
    const base = 'text-xs font-semibold px-2 py-1 rounded-full';
    if (priority === 'High') return `${base} bg-red-100 text-red-800`;
    if (priority === 'Medium') return `${base} bg-yellow-100 text-yellow-800`;
    if (priority === 'Low') return `${base} bg-green-100 text-green-800`;
    return `${base} bg-gray-100 text-gray-700`;
  };

  const getTagBadge = (tag) => (
    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 ml-2">
      {tag || 'Untagged'}
    </span>
  );

  /* ──────────────── Render ──────────────── */

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-3 shadow animate-pulse"
          >
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* ── Add Task Form ── */}
      <AddTask />

      {filteredTasks.length === 0 ? (
        <>
          <p className="text-center text-gray-500 dark:text-gray-400">
            No tasks found for {dateToUse}.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={goToCalendarView}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              📅 View Full Calendar
            </button>
          </div>
        </>
      ) : (
        <>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-3 shadow flex justify-between items-center"
            >
              <div>
                <p className="text-gray-900 dark:text-white">{task.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{task.date}</p>

                <div className="mt-1 flex items-center space-x-2">
                  <span className={getPriorityBadge(task.priority)}>
                    {task.priority ? `${task.priority} Priority` : 'No Priority'}
                  </span>
                  {getTagBadge(task.tag)}
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                🗑️
              </button>
            </div>
          ))}

          <div className="flex justify-center mt-6">
            <button
              onClick={goToCalendarView}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              📅 View Full Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarTasks;
