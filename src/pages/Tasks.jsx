import React, { useState } from 'react';
import TaskModal from '@/components/TaskModal';
import { useTasks as useTasksContext } from '@/context/TaskContext';

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask: deleteTaskFromContext, loading } = useTasksContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const openModal = (item = null) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setModalOpen(false);
    setError(null);
  };

  const saveTask = async (formData) => {
    try {
      setIsSaving(true);

      if (editingItem) {
        await updateTask(editingItem.id, formData);
      } else {
        await addTask(formData);
      }

      closeModal();
    } catch (err) {
      console.error('Error saving task:', err.message);
      setError(err.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return false;
    
    try {
      await deleteTaskFromContext(taskId);
      return true;
    } catch (err) {
      console.error('Error deleting task:', err.message);
      setError(err.message || 'Failed to delete task. Please try again.');
      return false;
    } finally {
      // no-op; loading state comes from context
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tasks</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading || isSaving}
        >
          {loading ? 'Loading...' : 'Add Task'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-4">No tasks found</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex justify-between items-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {task.description}
                  </p>
                )}
                {task.due_date && (
                  <div className="mt-2 text-xs text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(task)}
                  className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  title="Edit task"
                  disabled={loading || isSaving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
                  title="Delete task"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveTask}
        initialData={editingItem}
        isSaving={isSaving}
      />
    </div>
  );
}
