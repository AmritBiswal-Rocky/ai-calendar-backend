// src/pages/AddTaskPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddTask from '@/components/AddTask';

export default function AddTaskPage() {
  const navigate = useNavigate();
  const handleSuccess = () => navigate('/app/calendar');
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Add Task</h1>
          <a
            href="/app/calendar"
            className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ← Back to Calendar
          </a>
        </div>
        <AddTask onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
