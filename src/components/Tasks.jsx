// ─────────────────────────────────────────────
// src/pages/Tasks.jsx
// Tasks Page with Supabase Realtime + CRUD
// ─────────────────────────────────────────────

import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ───── Fetch tasks ─────
  const fetchTasks = async () => {
    if (!user?.firebase_uid) {
      console.warn('No user authenticated when fetching tasks');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('firebase_uid', user.firebase_uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error.message);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  useEffect(() => {
    fetchTasks();

    // ───── Realtime subscriptions ─────
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Realtime event:', payload);
        if (payload.eventType === 'INSERT') {
          // Only add if it's the current user's task
          if (payload.new?.firebase_uid === user?.firebase_uid) {
            setTasks((prev) => [payload.new, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          // Only update if it's the current user's task
          if (payload.new?.firebase_uid === user?.firebase_uid) {
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
          }
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ───── Modal helpers ─────
  const openModal = (item = null) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setModalOpen(false);
  };

  // ───── Save (insert or update) ─────
  const saveData = async (formData) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when saving task');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      if (editingItem) {
        const { error } = await supabase
          .from('tasks')
          .update(formData)
          .eq('id', editingItem.id)
          .eq('firebase_uid', user.firebase_uid);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{ ...formData, firebase_uid: user.firebase_uid }])
          .select()
          .single();
        if (error) throw error;
      }
      closeModal();
    } catch (err) {
      console.error('Error saving task:', err.message);
    }
  };

  // ───── Toggle complete ─────
  const toggleComplete = async (task) => {
    if (!user?.firebase_uid) {
      console.error('No user authenticated when toggling task');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)
        .eq('firebase_uid', user.firebase_uid);
      if (error) throw error;
    } catch (err) {
      console.error('Error toggling task:', err.message);
    }
  };

  // ───── Delete task ─────
  const deleteTask = async (id) => {
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
        .eq('id', id)
        .eq('firebase_uid', user.firebase_uid);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting task:', err.message);
    }
  };

  // ───── Render ─────
  return (
    <div className="min-h-screen flex flex-col p-4">
      <h1 className="text-xl font-bold mb-4">Tasks</h1>

      <button
        onClick={() => openModal()}
        className="mb-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        ➕ Add Task
      </button>

      {tasks.length === 0 ? (
        <div className="text-gray-500 mt-8">No tasks found</div>
      ) : (
        <ul className="space-y-2 flex-1 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => toggleComplete(task)}
                />
                <span
                  className={`${
                    task.completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(task)}
                  className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition"
                >
                  ✏ Edit
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
                >
                  🗑 Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal for create/edit */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveData}
        initialData={editingItem}
      />
    </div>
  );
}
