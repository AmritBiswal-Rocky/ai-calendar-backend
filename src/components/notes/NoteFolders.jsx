import { ensureAuth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function NoteFolders({ selectedFolder, setSelectedFolder }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) fetchFolders();
  }, [user]);

  const fetchFolders = async () => {
    if (!user?.firebase_uid) {
      console.warn('No user authenticated when fetching folders');
      return;
    }

    setLoading(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from('note_folders')
        .select('*')
        .eq('firebase_uid', user.firebase_uid)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch folders');
        console.error(error);
      } else {
        setFolders(data);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    if (!user?.firebase_uid) {
      toast.error('You must be logged in to create folders');
      return;
    }

    setCreating(true);
    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from('note_folders')
        .insert([
          {
            firebase_uid: user.firebase_uid,
            name: newFolderName.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        toast.error('Failed to create folder');
        console.error(error);
      } else {
        toast.success('Folder created!');
        setFolders((prev) => [data, ...prev]);
        setNewFolderName('');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">📁 Your Folders</h2>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="border p-1 rounded w-full"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          disabled={creating}
        />
        <button
          onClick={handleCreateFolder}
          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          aria-label="Create folder"
          disabled={creating}
        >
          ➕
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading folders...</div>
      ) : folders.length === 0 ? (
        <div className="text-sm text-gray-500">No folders yet.</div>
      ) : (
        <ul className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className={`w-full text-left px-2 py-1 rounded ${
                selectedFolder?.id === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              {folder.name}
            </button>
          ))}
        </ul>
      )}
    </div>
  );
}
