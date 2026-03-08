// src/components/AddTaskForm.jsx
import { ensureAuth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const AddTaskForm = ({ onTaskCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setLoading(true);

    if (!user?.firebase_uid) {
      toast.error('❌ You must be logged in to add tasks');
      return;
    }

    setLoading(true);

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            firebase_uid: user.firebase_uid,
            title: title.trim(),
            description: description.trim(),
            due_date: dueDate || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error('Failed to add task. Please try again.');
      } else {
        toast.success('Task added successfully!');
        setTitle('');
        setDescription('');
        setDueDate('');
        if (onTaskCreated) onTaskCreated(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleAddTask}
      className="p-4 border rounded shadow bg-white dark:bg-gray-800 space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">📝 New Task</h2>

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional description..."
          className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600"
        />
      </div>

      <div>
        <label
          htmlFor="dueDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Reminder (Due date & time)
        </label>
        <input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-label={loading ? 'Adding task...' : 'Add new task'}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  );
};

export default AddTaskForm;
