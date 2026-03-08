// src/pages/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import Calendar from '../components/Calendar'; // PascalCase import
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const CalendarPage = () => {
  const { tasks, loading, error, addTask } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Optional: you could add selectedTask state for editing tasks
  const [selectedTask, setSelectedTask] = useState(null);

  // Handle saving a new task or editing an existing task
  const handleSaveTask = async (taskData) => {
    try {
      await addTask(taskData); // Assumes useTasks provides addTask function
      toast.success('Task saved successfully!');
      setSelectedTask(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save task.');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Loading calendar...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500 font-medium">Failed to load tasks: {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header and Add Task Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Calendar</h1>
          <button
            onClick={() => {
              setSelectedTask(null); // reset for adding new task
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Add Task
          </button>
        </div>

        {/* Calendar Component: pass events prop for compatibility with components/Calendar */}
        <Calendar events={tasks} />

        {/* Task Modal for Add/Edit */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask}
          initialData={selectedTask}
        />
      </div>
    </motion.div>
  );
};

export default CalendarPage;
