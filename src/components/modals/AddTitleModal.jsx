// src/components/modals/AddTitleModal.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import EventForm from '@/components/EventForm';
import TaskForm from '@/components/TaskForm';
import WorkingLocationForm from '@/components/WorkingLocationForm';
import OutOfOfficeForm from '@/components/OutOfOfficeForm';
import ProjectForm from '@/components/ProjectForm';

import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TABS = ['Event', 'Task', 'Working Location', 'Out of Office', 'Project'];

const AddTitleModal = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  refreshCalendar,
  initialTab,
}) => {
  const { user } = useAuth() || {};

  const [activeTab, setActiveTab] = useState(initialTab || 'Event');
  const [title, setTitle] = useState('');

  const [eventFormData, setEventFormData] = useState({});
  const [taskFormData, setTaskFormData] = useState({});
  const [locationFormData, setLocationFormData] = useState({});
  const [oooFormData, setOooFormData] = useState({});
  const [projectFormData, setProjectFormData] = useState({});

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleSave = async () => {
    if (!user?.uid) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      // Inject Firebase JWT → Supabase headers
      await ensureAuth(user);

      const baseData = {
        firebase_uid: user.uid,
        title: title.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let query;

      switch (activeTab) {
        case 'Event':
          query = supabase.from('calendar_events').insert({
            ...baseData,
            date: selectedDate,
            time: selectedTime,
            ...eventFormData,
          });
          break;

        case 'Task':
          query = supabase.from('tasks').insert({
            ...baseData,
            date: selectedDate,
            ...taskFormData,
          });
          break;

        case 'Working Location':
          query = supabase.from('working_locations').insert({
            ...baseData,
            date: selectedDate,
            ...locationFormData,
          });
          break;

        case 'Out of Office':
          query = supabase.from('out_of_office').insert({
            ...baseData,
            start_date: selectedDate,
            ...oooFormData,
          });
          break;

        case 'Project':
          query = supabase.from('projects').insert({
            ...baseData,
            ...projectFormData,
          });
          break;

        default:
          throw new Error('Invalid tab selected');
      }

      const { error } = await query;
      if (error) throw error;

      toast.success(`${activeTab} created successfully`);

      if (typeof refreshCalendar === 'function') refreshCalendar();
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      console.error('AddTitleModal save error:', err);
      toast.error(err.message || `Failed to create ${activeTab.toLowerCase()}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">Create Item</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 pb-2 border-b mb-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab === 'Event' ? 'Create Event' : tab}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Add title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 outline-none focus:ring focus:ring-blue-100"
          />
        </div>

        {/* Forms */}
        <div className="space-y-3">
          {activeTab === 'Event' && (
            <EventForm formData={eventFormData} setFormData={setEventFormData} />
          )}
          {activeTab === 'Task' && (
            <TaskForm formData={taskFormData} setFormData={setTaskFormData} />
          )}
          {activeTab === 'Working Location' && (
            <WorkingLocationForm formData={locationFormData} setFormData={setLocationFormData} />
          )}
          {activeTab === 'Out of Office' && (
            <OutOfOfficeForm formData={oooFormData} setFormData={setOooFormData} />
          )}
          {activeTab === 'Project' && (
            <ProjectForm formData={projectFormData} setFormData={setProjectFormData} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 border hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTitleModal;
