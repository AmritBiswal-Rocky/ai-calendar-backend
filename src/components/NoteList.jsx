// src/components/NoteList.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNotes } from '../context/NoteContext';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Clock,
  Tag,
  Star,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } },
};

const NoteList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notes, setNotes } = useNotes();
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact
  const inputRef = useRef(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setEditingNote(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const openEditModal = useCallback((note) => {
    setEditingNote(note);
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.value = note.text;
    }
  }, []);

  const addNote = useCallback(
    (noteText) => {
      if (!noteText.trim()) {
        toast.error('Note cannot be empty');
        return;
      }

      try {
        setIsLoading(true);
        const newNote = {
          id: Date.now(),
          text: noteText.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: filterCategory || 'General',
          tags: [],
          isPinned: false,
          isArchived: false,
        };

        setNotes((prev) => [newNote, ...prev]);
        toast.success('Note added successfully');
        closeModal();
      } catch (err) {
        console.error('Error adding note:', err);
        toast.error('Failed to add note');
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [filterCategory, setNotes]
  );

  const updateNote = useCallback(
    (noteId, updatedText) => {
      if (!updatedText.trim()) {
        toast.error('Note cannot be empty');
        return;
      }

      try {
        setIsLoading(true);
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? { ...note, text: updatedText.trim(), updated_at: new Date().toISOString() }
              : note
          )
        );
        toast.success('Note updated successfully');
        closeModal();
      } catch (err) {
        console.error('Error updating note:', err);
        toast.error('Failed to update note');
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [setNotes]
  );

  const deleteNote = useCallback(
    (noteId) => {
      try {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        setSelectedNotes((prev) => prev.filter((id) => id !== noteId));
        toast.success('Note deleted successfully');
      } catch (err) {
        console.error('Error deleting note:', err);
        toast.error('Failed to delete note');
      }
    },
    [setNotes, setSelectedNotes]
  );

  const toggleNoteSelection = useCallback(
    (noteId) => {
      setSelectedNotes((prev) =>
        prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
      );
    },
    [setSelectedNotes]
  );

  const togglePinNote = useCallback(
    (noteId) => {
      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? { ...note, isPinned: !note.isPinned } : note))
      );
    },
    [setNotes]
  );

  const bulkDeleteNotes = useCallback(() => {
    if (selectedNotes.length === 0) {
      toast.error('No notes selected');
      return;
    }

    try {
      setNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)));
      setSelectedNotes([]);
      toast.success(`${selectedNotes.length} notes deleted successfully`);
    } catch (err) {
      console.error('Error bulk deleting notes:', err);
      toast.error('Failed to delete selected notes');
    }
  }, [selectedNotes, setNotes, setSelectedNotes]);

  const bulkArchiveNotes = useCallback(() => {
    if (selectedNotes.length === 0) {
      toast.error('No notes selected');
      return;
    }

    try {
      setNotes((prev) =>
        prev.map((note) => (selectedNotes.includes(note.id) ? { ...note, isArchived: true } : note))
      );
      setSelectedNotes([]);
      toast.success(`${selectedNotes.length} notes archived successfully`);
    } catch (err) {
      console.error('Error bulk archiving notes:', err);
      toast.error('Failed to archive selected notes');
    }
  }, [selectedNotes, setNotes, setSelectedNotes]);

  const clearSelection = useCallback(() => {
    setSelectedNotes([]);
  }, [setSelectedNotes]);

  // Filter and sort notes
  const filteredAndSortedNotes = useCallback(() => {
    let filtered = notes.filter((note) => {
      const matchesSearch = note.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? note.category === filterCategory : true;
      const matchesArchived = !note.isArchived; // Only show non-archived by default
      return matchesSearch && matchesCategory && matchesArchived;
    });

    // Sort notes
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortOrder === 'newest') {
        return new Date(b.updated_at) - new Date(a.updated_at);
      } else if (sortOrder === 'oldest') {
        return new Date(a.updated_at) - new Date(b.updated_at);
      } else if (sortOrder === 'alphabetical') {
        return a.text.localeCompare(b.text);
      }
      return 0;
    });

    return filtered;
  }, [notes, searchTerm, filterCategory, sortOrder]);

  const handleSaveNote = useCallback(() => {
    const noteText = inputRef.current?.value || '';

    if (editingNote) {
      updateNote(editingNote.id, noteText);
    } else {
      addNote(noteText);
    }
  }, [editingNote, updateNote, addNote]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSaveNote();
      }
    },
    [handleSaveNote]
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Get unique categories from notes
  const categories = [...new Set(notes.map((note) => note.category).filter(Boolean))];

  const renderNoteCard = useCallback(
    (note) => (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-4 bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
          note.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
        } ${selectedNotes.includes(note.id) ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedNotes.includes(note.id)}
              onChange={() => toggleNoteSelection(note.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {note.isPinned && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => togglePinNote(note.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Star
                className={`h-4 w-4 ${note.isPinned ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
              />
            </button>
            <button
              onClick={() => openEditModal(note)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit note"
            >
              <Edit3 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => deleteNote(note.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        <div className="text-gray-800 mb-3 leading-relaxed">{note.text}</div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {new Date(note.updated_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {note.category}
          </div>
        </div>
      </motion.div>
    ),
    [selectedNotes, toggleNoteSelection, togglePinNote, openEditModal, deleteNote]
  );

  const renderNoteList = useCallback(
    (note) => (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-3 bg-white rounded border-l-4 transition-all duration-200 hover:bg-gray-50 ${
          note.isPinned ? 'border-l-yellow-400 bg-yellow-50' : 'border-l-gray-300'
        } ${selectedNotes.includes(note.id) ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              checked={selectedNotes.includes(note.id)}
              onChange={() => toggleNoteSelection(note.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {note.isPinned && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                <span className="font-medium text-gray-900">{note.text.substring(0, 100)}...</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                <span>{note.category}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => togglePinNote(note.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Star
                className={`h-3 w-3 ${note.isPinned ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
              />
            </button>
            <button
              onClick={() => openEditModal(note)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit note"
            >
              <Edit3 className="h-3 w-3 text-gray-600" />
            </button>
            <button
              onClick={() => deleteNote(note.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </button>
          </div>
        </div>
      </motion.div>
    ),
    [selectedNotes, toggleNoteSelection, togglePinNote, openEditModal, deleteNote]
  );

  const renderNoteCompact = useCallback(
    (note) => (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`p-2 bg-white rounded border transition-all duration-200 hover:bg-gray-50 ${
          note.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
        } ${selectedNotes.includes(note.id) ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={selectedNotes.includes(note.id)}
              onChange={() => toggleNoteSelection(note.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              {note.isPinned && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
              <span className="text-sm text-gray-600">{note.category}</span>
            </div>
            <span className="text-sm text-gray-800 truncate">{note.text}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => openEditModal(note)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit note"
            >
              <Edit3 className="h-3 w-3 text-gray-600" />
            </button>
            <button
              onClick={() => deleteNote(note.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </button>
          </div>
        </div>
      </motion.div>
    ),
    [selectedNotes, toggleNoteSelection, openEditModal, deleteNote]
  );

  const renderNotes = useCallback(() => {
    const notesToRender = filteredAndSortedNotes();

    if (notesToRender.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No notes found</p>
          {searchTerm && <p className="text-sm">Try adjusting your search or filters</p>}
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {notesToRender.map(renderNoteCard)}
        </div>
      );
    } else if (viewMode === 'list') {
      return <div className="space-y-2">{notesToRender.map(renderNoteList)}</div>;
    } else {
      return <div className="space-y-1">{notesToRender.map(renderNoteCompact)}</div>;
    }
  }, [
    filteredAndSortedNotes,
    viewMode,
    renderNoteCard,
    renderNoteList,
    renderNoteCompact,
    searchTerm,
  ]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">📝 Notes</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
          {selectedNotes.length > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedNotes.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Grid view"
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="List view"
          >
            <div className="w-4 h-4 space-y-0.5">
              <div className="h-1 bg-current rounded-sm"></div>
              <div className="h-1 bg-current rounded-sm"></div>
              <div className="h-1 bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded ${viewMode === 'compact' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Compact view"
          >
            <div className="w-4 h-2 space-y-0.5">
              <div className="h-0.5 bg-current rounded-sm"></div>
              <div className="h-0.5 bg-current rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkArchiveNotes}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Archive
              </button>
              <button
                onClick={bulkDeleteNotes}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Note Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openModal}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Note
      </motion.button>

      {/* Notes Display */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading notes...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>Error: {error}</p>
        </div>
      ) : (
        renderNotes()
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {editingNote ? (
                  <>
                    <Edit3 className="h-5 w-5 text-blue-500" />
                    Edit Note
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-green-500" />
                    Add New Note
                  </>
                )}
              </h3>

              <textarea
                ref={inputRef}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write your note here..."
                rows={6}
                onKeyDown={handleKeyPress}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Category:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">General</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-gray-400">Ctrl+Enter to save</div>
              </div>

              <div className="flex justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveNote}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {editingNote ? 'Update' : 'Save'}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoteList;
