// src/pages/TestRLS.jsx
// Simple manual test harness for RLS enforcement
// ─────────────────────────────────────────────

import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';
import toast from "react-hot-toast";

export default function TestRLS() {
  const { user } = useAuth() || {};
  const [taskId, setTaskId] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const createTask = async () => {
    if (!user?.firebase_uid) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from("tasks")
        .insert([{
          title: "Test Task RLS",
          firebase_uid: user.firebase_uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setTaskId(data.id);
      toast.success(`Task created: ${data.id}`);
    } catch (error) {
      console.error("Create task failed:", error);
      toast.error(`Create task failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!user?.firebase_uid) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from("notes")
        .insert([{
          title: "Test Note RLS",
          content: "Check RLS",
          firebase_uid: user.firebase_uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setNoteId(data.id);
      toast.success(`Note created: ${data.id}`);
    } catch (error) {
      console.error("Create note failed:", error);
      toast.error(`Create note failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tryHackTask = async () => {
    if (!taskId) {
      toast.error("Please create a task first");
      return;
    }

    if (!user?.firebase_uid) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from("tasks")
        .update({
          title: "HACKED!",
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;
      toast.success("Update went through (should not happen!)");
    } catch (error) {
      toast.error(`Update denied: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tryHackNote = async () => {
    if (!noteId) {
      toast.error("Please create a note first");
      return;
    }

    if (!user?.firebase_uid) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
      toast.success("Delete went through (should not happen!)");
    } catch (error) {
      toast.error(`Delete denied: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔐 RLS Test Harness</h1>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="font-medium">Authentication Status:</p>
          <p className="text-sm text-gray-600">
            {user ? `Logged in as: ${user.email}` : 'Not authenticated'}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Create Test Data</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={createTask}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button 
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={createNote}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold">Test RLS Policies</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Task ID to test update</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Task ID"
                className="flex-1 border rounded px-3 py-2"
                value={taskId || ""}
                onChange={(e) => setTaskId(e.target.value)}
                disabled={loading}
              />
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={tryHackTask}
                disabled={!taskId || loading}
              >
                Test Task Update
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Note ID to test delete</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Note ID"
                className="flex-1 border rounded px-3 py-2"
                value={noteId || ""}
                onChange={(e) => setNoteId(e.target.value)}
                disabled={loading}
              />
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={tryHackNote}
                disabled={!noteId || loading}
              >
                Test Note Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
          <p className="font-medium">Expected Behavior:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Creating tasks/notes should work when authenticated</li>
            <li>Updating/deleting other users' records should be denied by RLS</li>
            <li>All operations should include proper timestamps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
