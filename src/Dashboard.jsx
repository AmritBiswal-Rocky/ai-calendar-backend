import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';
import { upsertProfile } from '@/utils/api';
import { useSocket } from './context/SocketContext';

export default function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Create a new task
  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    if (!user?.firebase_uid) {
      console.error('No user authenticated when adding task');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data: task, error } = await supabase
        .from('tasks')
        .insert([{ title: newTaskTitle, user_id: user.firebase_uid }])
        .select()
        .single();

      if (!error && task) {
        setTasks((prev) => [task, ...prev]);
        if (socket) socket.emit('task_created', task);
        setNewTaskTitle('');
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Update a task title
  const handleUpdateTask = async (taskId, newTitle) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when updating task');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data: task, error } = await supabase
        .from('tasks')
        .update({ title: newTitle })
        .eq('id', taskId)
        .eq('user_id', user.firebase_uid)
        .select()
        .single();

      if (!error && task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        if (socket) socket.emit('task_updated', task);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when deleting task');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.firebase_uid);

      if (!error) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (socket) socket.emit('task_deleted', taskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Update a note
  const handleUpdateNote = async (noteId, newTitle, newContent) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when updating note');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data: note, error } = await supabase
        .from('notes')
        .update({ title: newTitle, content: newContent })
        .eq('id', noteId)
        .eq('user_id', user.firebase_uid)
        .select()
        .single();

      if (!error && note) {
        setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
        if (socket) socket.emit('note_updated', note);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when deleting note');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.firebase_uid);

      if (!error) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        if (socket) socket.emit('note_deleted', noteId);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Create a new note
  const handleAddNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    if (!user?.firebase_uid) {
      console.error('No user authenticated when adding note');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data: note, error } = await supabase
        .from('notes')
        .insert([{ title: newNoteTitle, content: newNoteContent, user_id: user.firebase_uid }])
        .select()
        .single();

      if (!error && note) {
        setNotes((prev) => [note, ...prev]);
        if (socket) socket.emit('note_created', note);
        setNewNoteTitle('');
        setNewNoteContent('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Upsert profile and fetch user data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Ensure profile exists
        await upsertProfile(user);

        // Fetch profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;
        setNotes(notesData || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase]);

  // Listen for real-time WebSocket updates
  useEffect(() => {
    if (!socket || !user) return;

    // --- Task events ---
    const onTaskCreated = (payload) => {
      const task = payload?.task || payload;
      if (task?.user_id === user.id) setTasks((prev) => [task, ...prev]);
    };
    const onTaskUpdated = (payload) => {
      const task = payload?.task || payload;
      if (task?.user_id === user.id)
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    };
    const onTaskDeleted = (payload) => {
      const id = payload?.id ?? payload;
      setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    socket.on('task_created', onTaskCreated);
    socket.on('task_added', onTaskCreated); // backend uses task_added in some paths
    socket.on('task_updated', onTaskUpdated);
    socket.on('task_deleted', onTaskDeleted);

    // --- Note events ---
    const onNoteCreated = (payload) => {
      const note = payload?.note || payload;
      if (note?.user_id === user.id) setNotes((prev) => [note, ...prev]);
    };
    const onNoteUpdated = (payload) => {
      const note = payload?.note || payload;
      if (note?.user_id === user.id)
        setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    };
    const onNoteDeleted = (payload) => {
      const id = payload?.id ?? payload;
      setNotes((prev) => prev.filter((n) => n.id !== id));
    };

    socket.on('note_created', onNoteCreated);
    socket.on('note_updated', onNoteUpdated);
    socket.on('note_deleted', onNoteDeleted);

    return () => {
      socket.off('task_created', onTaskCreated);
      socket.off('task_added', onTaskCreated);
      socket.off('task_updated', onTaskUpdated);
      socket.off('task_deleted', onTaskDeleted);
      socket.off('note_created', onNoteCreated);
      socket.off('note_updated', onNoteUpdated);
      socket.off('note_deleted', onNoteDeleted);
    };
  }, [socket, user]);

  if (!user) return <div>Please log in to access your dashboard.</div>;
  if (loading) return <div>Loading your dashboard...</div>;

  return (
    <div className="dashboard">
      {/* Profile */}
      <ProfileSection profile={profile} />

      {/* Quick Add Task */}
      <section className="quick-add-task">
        <h3>Add Task</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title"
            className="border p-1"
          />
          <button onClick={handleAddTask} className="px-3 py-1 bg-blue-600 text-white rounded">
            Add Task
          </button>
        </div>
      </section>

      {/* Tasks */}
      <section className="tasks-section">
        <h2>Your Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2">
                <input
                  className="border p-1 flex-1"
                  value={task.title || ''}
                  onChange={(e) => handleUpdateTask(task.id, e.target.value)}
                />
                <span className="text-sm text-gray-500">{task.status || 'Pending'}</span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick Add Note */}
      <section className="quick-add-note">
        <h3>Add Note</h3>
        <div className="flex flex-col gap-2 max-w-md">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Note title"
            className="border p-1"
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Note content"
            rows={3}
            className="border p-1"
          />
          <button
            onClick={handleAddNote}
            className="px-3 py-1 bg-green-600 text-white rounded self-start"
          >
            Add Note
          </button>
        </div>
      </section>

      {/* Notes */}
      <section className="notes-section">
        <h2>Your Notes</h2>
        {notes.length === 0 ? (
          <p>No notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-col gap-2">
                <input
                  className="border p-1"
                  value={note.title || ''}
                  onChange={(e) => handleUpdateNote(note.id, e.target.value, note.content)}
                />
                <textarea
                  className="border p-1"
                  rows={3}
                  value={note.content || ''}
                  onChange={(e) => handleUpdateNote(note.id, note.title, e.target.value)}
                />
                <div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
