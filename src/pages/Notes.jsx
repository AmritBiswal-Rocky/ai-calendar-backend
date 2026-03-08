// ─────────────────────────────────────────────
// src/pages/Notes.jsx
// Unified Notes Component = Real-time Notes + Google Drive/Photos uploads
// Using Firebase token + backend API for secure CRUD + “New Note” button
// Merged & cleaned version (fixed imports, socket payloads, workspace helpers,
// safe contentEditable updates, and missing functions).
// ─────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Link as LinkIcon,
  Copy as CopyIcon,
  Trash2,
  MoveRight,
  Text,
  Expand,
  Shrink,
  Lock,
  Wand2,
  Languages,
  UploadCloud,
  DownloadCloud,
  BookMarked,
  BarChart3,
  History,
  Bell,
  Share2,
  MonitorSmartphone,
  Search,
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAuth } from '@/context/AuthContext';
import { useNotes } from '../context/NoteContext';
import { uploadFileToDrive, uploadPhotoToGoogle } from '../utils/googleApi';
import SaveAIImage from '../components/DEEMENTUM/SaveAIImage';
import CreateNoteButton from '@/components/CreateNoteButton';
import FloatingAddNoteButton from '@/components/FloatingAddNoteButton';
import { askOpenRouter } from '../api/openrouter';
import TypingDots from '../components/TypingDots';

// ─────────────────────────────────────────────
// Sortable Note Component
// ─────────────────────────────────────────────
function SortableNote({ note, toggleComplete, handleEdit, handleDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-start gap-2"
    >
      <div className="flex flex-col flex-1 gap-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!note.completed}
            onChange={() => toggleComplete(note)}
            aria-label="Toggle complete"
          />
          <span className={note.completed ? 'line-through text-gray-400' : ''}>
            {note.title || 'Untitled'}
          </span>
          {note.ai_generated && (
            <span className="w-2 h-2 bg-purple-500 rounded-full" title="AI-generated" />
          )}
        </div>
        <p className={note.completed ? 'line-through text-gray-400' : ''}>{note.content}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-gray-400">
          {note.updated_at ? new Date(note.updated_at).toLocaleString() : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(note)}
            className="text-blue-500 hover:underline text-sm"
            aria-label="Edit note"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(note.id)}
            className="text-red-500 hover:underline text-sm"
            aria-label="Delete note"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Notes Main Component
// ─────────────────────────────────────────────
const Notes = () => {
  const { user } = useAuth();
  const { notes, addNote, updateNote, deleteNote, loading } = useNotes();
  const sensors = useSensors(useSensor(PointerSensor));

  // Core states
  const [noteInput, setNoteInput] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [uploading, setUploading] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Workspace + AI states
  const [activeWorkspace, setActiveWorkspace] = useState('nourse');
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);

  // Workspace builder
  const [customWorkspaces, setCustomWorkspaces] = useState([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [actionsVisibleFor, setActionsVisibleFor] = useState(null);
  const [hoveredWorkspaceId, setHoveredWorkspaceId] = useState(null);

  // UI extras
  const [isNotesFullscreen, setIsNotesFullscreen] = useState(false);
  const contentRefs = useRef({});
  const notesEndRef = useRef(null);
  const aiBottomRef = useRef(null);

  // Debounce refs
  const sendAiDebounceRef = useRef(false);
  const socketDeleteDebounceRef = useRef(false);

  // Helper: scroll to bottom for notes/AI
  const scrollToBottom = () => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle fullscreen
  const toggleNotesFullscreen = () => {
    setIsNotesFullscreen((p) => !p);
  };

  // Ensure AI bottom visible when messages update
  useEffect(() => {
    if (activeWorkspace === 'nourse-ai') {
      aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiTyping, activeWorkspace]);

  // Keep AI sidebar open except when explicitly hidden
  useEffect(() => {
    if (activeWorkspace !== 'nourse-ai') {
      setAiSidebarOpen(true);
    }
  }, [activeWorkspace]);

  // Persist contentEditable content to customWorkspaces state
  useEffect(() => {
    customWorkspaces.forEach(({ id, content }) => {
      const node = contentRefs.current[id];
      if (node && node.innerText !== (content || '')) {
        // Only write when different to avoid clobbering selection
        node.innerText = content || '';
      }
    });
  }, [customWorkspaces]);

  // ─────────────────────────────────────────────
  // Add or update note
  // ─────────────────────────────────────────────
  const handleAddOrUpdate = async () => {
    if (!noteInput.trim()) return;
    if (!user?.firebase_uid) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          content: noteInput,
          title: editingNote.title || 'Note',
        });
        setEditingNote(null);
      } else {
        await addNote({
          title: 'Note',
          content: noteInput,
        });
      }
      setNoteInput('');
      scrollToBottom();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Delete note
  // ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!id) return;
    if (!user?.firebase_uid) return;
    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Toggle completion
  // ─────────────────────────────────────────────
  const toggleComplete = async (note) => {
    if (!user?.firebase_uid) return;
    try {
      await updateNote(note.id, {
        completed: !note.completed,
      });
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  // ----------------------------------------------------------------
  // Workspace helpers (create / rename / remove)
  // ----------------------------------------------------------------

  // openCreateWorkspace replaced missing function — creates default draft name
  const openCreateWorkspace = () => {
    const defaultName = `Untitled Workspace ${customWorkspaces.length + 1}`;
    setIsCreatingWorkspace(true);
    setNewWorkspaceName(defaultName);
  };

  const cancelCreateWorkspace = () => {
    setIsCreatingWorkspace(false);
    setNewWorkspaceName('');
  };

  const submitCreateWorkspace = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = (newWorkspaceName || '').trim();
    if (!trimmed) return;
    const id = `workspace-${Date.now()}`;
    setCustomWorkspaces((prev) => [...prev, { id, title: trimmed, content: '' }]);
    setActiveWorkspace(id);
    setIsCreatingWorkspace(false);
    setNewWorkspaceName('');
    setEditingWorkspaceId(null);
    setRenameDraft('');
  };

  const startRenameWorkspace = (workspace) => {
    setEditingWorkspaceId(workspace.id);
    setRenameDraft(workspace.title);
    setActionsVisibleFor(null);
  };

  const submitRenameWorkspace = (e, workspace) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = (renameDraft || '').trim();
    if (!trimmed) return;
    setCustomWorkspaces((prev) =>
      prev.map((ws) => (ws.id === workspace.id ? { ...ws, title: trimmed } : ws))
    );
    setEditingWorkspaceId(null);
    setRenameDraft('');
    setHoveredWorkspaceId(null);
  };

  const cancelRenameWorkspace = () => {
    setEditingWorkspaceId(null);
    setRenameDraft('');
    setHoveredWorkspaceId(null);
  };

  const handleRemoveWorkspace = (id) => {
    const workspace = customWorkspaces.find((ws) => ws.id === id);
    if (!workspace) return;
    const confirmed = window.confirm(`Remove the workspace "${workspace.title}"?`);
    if (!confirmed) return;
    setCustomWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
    if (activeWorkspace === id) {
      setActiveWorkspace('nourse');
    }
    if (editingWorkspaceId === id) {
      cancelRenameWorkspace();
    }
    if (actionsVisibleFor === id) {
      setActionsVisibleFor(null);
    }
  };

  const handleWorkspaceContentChange = (workspaceId, value) => {
    setCustomWorkspaces((prev) =>
      prev.map((ws) => (ws.id === workspaceId ? { ...ws, content: value } : ws))
    );
  };

  // renderCustomWorkspace extracted from your chunks (cleaned)
  const renderCustomWorkspace = (workspace) => {
    if (!workspace) return null;
    const isEditingTitle = editingWorkspaceId === workspace.id;
    const isHovered = hoveredWorkspaceId === workspace.id;

    return (
      <div className="flex flex-col gap-10 bg-white/70 rounded-[32px] border border-gray-200 shadow-sm px-8 sm:px-14 py-10 min-h-[560px]">
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.4em] text-gray-400">Private</span>
              {isEditingTitle ? (
                <form
                  onSubmit={(e) => submitRenameWorkspace(e, workspace)}
                  className="space-y-3 mt-4"
                >
                  <input
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    className="text-5xl font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-purple-500 focus:outline-none pb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelRenameWorkspace}
                      className="px-4 py-1.5 rounded-full border border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <h1 className="text-5xl font-semibold text-gray-900 mt-4">{workspace.title}</h1>
              )}
            </div>

            <div className="relative flex flex-col items-end gap-3 self-start">
              <button
                type="button"
                onClick={() =>
                  setActionsVisibleFor((prev) => (prev === workspace.id ? null : workspace.id))
                }
                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition"
                title="Workspace actions"
              >
                {workspace.title.slice(0, 1).toUpperCase()}
              </button>

              <button
                type="button"
                onClick={() =>
                  setActionsVisibleFor((prev) => (prev === workspace.id ? null : workspace.id))
                }
                className="w-10 h-10 rounded-full border border-gray-300 text-gray-500 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition flex items-center justify-center text-lg font-semibold"
                title="Workspace options"
              >
                ...
              </button>

              {actionsVisibleFor === workspace.id && !isEditingTitle && (
                <div className="absolute right-0 top-16 w-72 max-h-[420px] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl py-3 z-20">
                  <div className="px-4 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search actions..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-200/60 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 px-2 text-sm text-gray-700">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <span className="font-semibold text-base">Ag</span>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">Default</span>
                        <span className="text-xs text-gray-500">Serif</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <span className="font-serif text-lg">Ag</span>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">Serif</span>
                        <span className="text-xs text-gray-500">Classic</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <span className="font-mono text-base">Ag</span>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">Mono</span>
                        <span className="text-xs text-gray-500">Technical</span>
                      </div>
                    </div>

                    <hr className="border-gray-200 my-2" />

                    <MenuItem
                      icon={<LinkIcon className="w-4 h-4" />}
                      label="Copy link"
                      shortcut="Ctrl+Alt+L"
                    />
                    <MenuItem
                      icon={<CopyIcon className="w-4 h-4" />}
                      label="Duplicate"
                      shortcut="Ctrl+D"
                      onClick={() => startRenameWorkspace(workspace)}
                    />
                    <MenuItem
                      icon={<MoveRight className="w-4 h-4" />}
                      label="Move to"
                      shortcut="Ctrl+⇧+P"
                    />
                    <MenuItem
                      icon={<Trash2 className="w-4 h-4 text-red-500" />}
                      label="Move to Trash"
                      variant="danger"
                      onClick={() => handleRemoveWorkspace(workspace.id)}
                    />

                    <div className="py-2">
                      <ToggleRow icon={<Text className="w-4 h-4" />} label="Small text" />
                      <ToggleRow icon={<Expand className="w-4 h-4" />} label="Full width" />
                      <ToggleRow icon={<Wand2 className="w-4 h-4" />} label="Customize page" />
                      <ToggleRow icon={<Lock className="w-4 h-4" />} label="Lock page" />
                    </div>

                    <MenuItem icon={<Wand2 className="w-4 h-4" />} label="Suggest edits" />
                    <SubMenu icon={<Languages className="w-4 h-4" />} label="Translate" />
                    <MenuItem icon={<UploadCloud className="w-4 h-4" />} label="Import" />
                    <MenuItem icon={<DownloadCloud className="w-4 h-4" />} label="Export" />
                    <MenuItem icon={<BookMarked className="w-4 h-4" />} label="Turn into wiki" />
                    <MenuItem
                      icon={<BarChart3 className="w-4 h-4" />}
                      label="Updates & analytics"
                    />
                    <MenuItem icon={<History className="w-4 h-4" />} label="Version history" />
                    <MenuItem
                      icon={<Bell className="w-4 h-4" />}
                      label="Notify me"
                      description="Comments"
                    />
                    <MenuItem
                      icon={<Share2 className="w-4 h-4" />}
                      label="Connections"
                      description="None"
                    />
                    <MenuItem
                      icon={<MonitorSmartphone className="w-4 h-4" />}
                      label="Open in Windows app"
                    />

                    <div className="px-3 pt-3 text-xs text-gray-400">
                      Last edited by {user?.displayName || 'You'}
                      <div>{new Date().toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {actionsVisibleFor === workspace.id && isEditingTitle && (
                <div className="absolute right-0 top-16 w-44 rounded-2xl border border-gray-200 bg-white shadow-xl py-2 z-10">
                  <div className="px-4 py-2 text-xs text-gray-400">Finish editing title</div>
                </div>
              )}
            </div>
          </div>

          {!isEditingTitle && (
            <p className="text-sm text-gray-500 max-w-xl">
              This is your personalized Nourse page. Add notes, embeds, or task lists to build a
              workspace that mirrors your flow.
            </p>
          )}
        </div>

        <div
          className="relative flex-1"
          onMouseEnter={() => setHoveredWorkspaceId(workspace.id)}
          onMouseLeave={() =>
            setHoveredWorkspaceId((prev) => (prev === workspace.id ? null : prev))
          }
        >
          <div className="absolute inset-0 rounded-[28px] border border-dashed border-purple-200 bg-gradient-to-br from-white via-purple-50/40 to-white" />
          <div className="relative h-full">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto px-6 py-10">
                {isHovered && !isEditingTitle && (
                  <div className="absolute top-4 left-6 flex items-center gap-4 text-xs font-medium text-gray-500 tracking-wide uppercase">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-purple-600 transition">
                      <span role="img" aria-hidden="true">
                        😊
                      </span>
                      Add icon
                    </button>
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-purple-600 transition">
                      <span role="img" aria-hidden="true">
                        🖼️
                      </span>
                      Add cover
                    </button>
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-purple-600 transition">
                      <span role="img" aria-hidden="true">
                        💬
                      </span>
                      Add comment
                    </button>
                  </div>
                )}

                <div
                  className="min-h-[320px] text-lg leading-8 text-gray-700 whitespace-pre-wrap focus:outline-none"
                  contentEditable
                  suppressContentEditableWarning
                  ref={(node) => {
                    if (node) contentRefs.current[workspace.id] = node;
                    else delete contentRefs.current[workspace.id];
                  }}
                  onInput={(e) =>
                    handleWorkspaceContentChange(workspace.id, e.currentTarget.innerText)
                  }
                />
              </div>

              {(!workspace.content || workspace.content.trim().length === 0) && (
                <div className="absolute top-12 left-12 text-4xl sm:text-5xl font-semibold text-gray-200 capitalize pointer-events-none select-none">
                  {workspace.title}
                </div>
              )}

              <div className="px-6 pb-10">
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <span>Get started with</span>
                  {['Ask AI', 'Meet', 'Database', 'Form', 'Templates'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 bg-white hover:border-purple-300 hover:text-purple-600 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // AI chat handlers
  // ─────────────────────────────────────────────
  const handleAiNewChat = () => {
    setAiMessages([]);
    setAiInput('');
    setAiTyping(false);
    requestAnimationFrame(() => {
      aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleAiSend = async () => {
    if (activeWorkspace !== 'nourse-ai') return;
    if (!aiInput.trim() || aiTyping) return;
    if (sendAiDebounceRef.current) return; // simple debounce
    sendAiDebounceRef.current = true;
    setTimeout(() => (sendAiDebounceRef.current = false), 600);

    setAiMessages((prev) => [...prev, { role: 'user', content: aiInput }]);
    const currentMessage = aiInput;
    setAiInput('');
    setAiTyping(true);

    try {
      const response = await askOpenRouter(currentMessage);
      setAiMessages((prev) => [...prev, { role: 'bot', content: response }]);
    } catch (err) {
      console.error('Nourse AI error', err);
      setAiMessages((prev) => [
        ...prev,
        { role: 'bot', content: '⚠️ Unable to fetch a response. Please try again.' },
      ]);
    } finally {
      setAiTyping(false);
    }
  };

  // ─────────────────────────────────────────────
  // Google Drive upload
  // ─────────────────────────────────────────────
  const handleUploadDrive = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFileToDrive(file);
      if (uploaded) setDriveFiles((prev) => [uploaded, ...prev]);
    } catch (err) {
      console.error('Drive upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Google Photos upload
  // ─────────────────────────────────────────────
  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadPhotoToGoogle(file);
    } catch (err) {
      console.error('Photo upload failed:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Group notes by section
  // ─────────────────────────────────────────────
  const sections = (Array.isArray(notes) ? notes : []).reduce((acc, note) => {
    const sec = note.section || 'General';
    acc[sec] = acc[sec] || [];
    acc[sec].push(note);
    return acc;
  }, {});

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex p-6 max-w-7xl mx-auto gap-6 relative min-h-screen">
      <div className="absolute top-4 right-6">
        <CreateNoteButton />
      </div>

      {/* Sidebar */}
      {(activeWorkspace !== 'nourse-ai' || aiSidebarOpen) && (
        <div className="w-64 flex-shrink-0 bg-gray-100 dark:bg-gray-900 p-4 rounded">
          <h2 className="font-bold mb-4 text-lg">Workspaces</h2>
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => setActiveWorkspace('nourse-ai')}
                className={`w-full text-left font-medium px-3 py-2 rounded transition border ${
                  activeWorkspace === 'nourse-ai'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800'
                }`}
              >
                Nourse AI
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setActiveWorkspace('nourse')}
                className={`w-full text-left font-medium px-3 py-2 rounded transition border ${
                  activeWorkspace === 'nourse'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800'
                }`}
              >
                Nourse Workspace
              </button>
            </li>

            {isCreatingWorkspace && activeWorkspace !== 'nourse-ai' ? (
              <li>
                <form onSubmit={submitCreateWorkspace} className="space-y-2">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={cancelCreateWorkspace}
                      className="flex-1 px-3 py-1.5 rounded border border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              activeWorkspace !== 'nourse-ai' && (
                <li>
                  <button
                    onClick={openCreateWorkspace}
                    className="w-full text-left font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 px-2 py-1 rounded transition"
                  >
                    + New Nourse
                  </button>
                </li>
              )
            )}

            {customWorkspaces.map((workspace) => (
              <li key={workspace.id}>
                <button
                  type="button"
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className={`w-full text-left font-medium px-3 py-2 rounded transition border ${
                    activeWorkspace === workspace.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-transparent text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {workspace.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto">
        {activeWorkspace === 'nourse-ai' ? (
          <div
            className="flex flex-col gap-4"
            style={{
              minHeight: '600px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(59,130,246,0.02))',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
              padding: '2rem',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            {/* AI header + messages + input */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAiSidebarOpen((prev) => !prev)}
                  className="w-10 h-10 rounded-full border border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition"
                  title={aiSidebarOpen ? 'Hide workspace sidebar' : 'Show workspace sidebar'}
                  aria-label={aiSidebarOpen ? 'Hide workspace sidebar' : 'Show workspace sidebar'}
                >
                  {aiSidebarOpen ? '☰' : '▢'}
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Nourse AI</h1>
                  <p className="text-sm text-gray-500">
                    Converse with your AI assistant for research and ideation.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAiNewChat}
                  className="px-4 py-2 rounded-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition"
                >
                  New Chat
                </button>
              </div>
            </div>

            <div
              style={{
                flexGrow: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                borderRadius: '20px',
                background: '#ffffff',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {aiMessages.length === 0 && !aiTyping && (
                <div className="text-center text-gray-400 text-sm">
                  Start the conversation by typing a prompt below.
                </div>
              )}

              {aiMessages.map((msg, idx) => {
                const isBot = msg.role === 'bot';
                const rawImageUrl =
                  msg.imageUrl ||
                  (typeof msg.content === 'string' && msg.content.startsWith('data:image')
                    ? msg.content
                    : undefined);
                return (
                  <div
                    key={`ai-msg-${idx}`}
                    style={{
                      marginLeft: isBot ? '0' : 'auto',
                      marginRight: isBot ? 'auto' : '0',
                      background: isBot ? 'rgba(248, 250, 252, 0.95)' : '#eef2ff',
                      color: '#1f2937',
                      padding: '1rem 1.25rem',
                      borderRadius: '18px',
                      maxWidth: '75%',
                      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {rawImageUrl && isBot ? (
                      <div className="flex flex-col gap-2">
                        <img src={rawImageUrl} alt="AI Generated" className="rounded-lg shadow" />
                        <SaveAIImage imageUrl={rawImageUrl} />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                );
              })}

              {aiTyping && (
                <div
                  style={{
                    background: 'rgba(248, 250, 252, 0.95)',
                    padding: '1rem 1.25rem',
                    borderRadius: '18px',
                    width: 'fit-content',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <TypingDots />
                </div>
              )}

              <div ref={aiBottomRef} />
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '999px',
                padding: '0.65rem',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask Nourse AI anything..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
                style={{
                  flexGrow: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '48px',
                  maxHeight: '120px',
                  fontSize: '0.95rem',
                  background: 'transparent',
                }}
              />
              <button
                type="button"
                onClick={handleAiSend}
                disabled={aiTyping}
                style={{
                  background: aiTyping ? 'rgba(148, 163, 184, 0.45)' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.65rem 1.8rem',
                  fontWeight: 600,
                  cursor: aiTyping ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease',
                  boxShadow: '0 16px 30px rgba(79, 70, 229, 0.25)',
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : activeWorkspace === 'nourse' ? (
          <div
            className={`transition-all duration-300 ${
              isNotesFullscreen
                ? 'fixed inset-0 bg-neutral-900 z-50 p-6 overflow-auto'
                : 'relative bg-white rounded-[32px] border border-gray-200 shadow-sm p-6'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-lg font-semibold ${isNotesFullscreen ? 'text-white' : 'text-gray-900'}`}
              >
                My Notes
              </h2>
              <button
                type="button"
                onClick={toggleNotesFullscreen}
                className={`p-2 rounded-md transition ${isNotesFullscreen ? 'text-white hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'}`}
                title={isNotesFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isNotesFullscreen ? <Shrink size={18} /> : <Expand size={18} />}
              </button>
            </div>

            <div className="space-y-6">
              {/* Nourse Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a Nourse entry..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300"
                />
                <button
                  onClick={handleAddOrUpdate}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  {editingNote ? 'Update' : 'Add'}
                </button>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                {Object.keys(sections).map((section) => {
                  const sectionNotes = sections[section];
                  return (
                    <div key={section} className="mb-0">
                      <h3
                        className="font-semibold text-lg mb-2 flex items-center gap-2 cursor-pointer"
                        onClick={() =>
                          setCollapsedSections((p) => ({
                            ...p,
                            [section]: !p[section],
                          }))
                        }
                      >
                        {collapsedSections[section] ? '▶' : '▼'} 📌 {section}
                      </h3>
                      {!collapsedSections[section] && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter}>
                          <SortableContext
                            items={sectionNotes.map((n) => n.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {sectionNotes.map((note) => (
                              <SortableNote
                                key={note.id}
                                note={note}
                                toggleComplete={toggleComplete}
                                handleEdit={(n) => {
                                  setEditingNote(n);
                                  setNoteInput(n.content);
                                  scrollToBottom();
                                }}
                                handleDelete={handleDelete}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  );
                })}
              </div>

              {notes.length === 0 && (
                <div className="text-gray-400 text-center">No nourse entries yet.</div>
              )}

              <div ref={notesEndRef} />

              {/* Google Drive Section */}
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-bold mb-2">📂 Google Drive Files</h2>
                <input
                  type="file"
                  onChange={handleUploadDrive}
                  className="border p-1 rounded mb-2"
                />
                {uploading && <p>Uploading...</p>}
                <ul>
                  {driveFiles.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600"
                      >
                        {file.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Google Photos Section */}
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-bold mb-2">📸 Google Photos</h2>
                <input type="file" accept="image/*" onChange={handleUploadPhoto} className="mb-2" />
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.baseUrl}
                        alt={photo.filename}
                        className="w-full h-32 object-cover rounded"
                      />
                    ))}
                  </div>
                ) : (
                  <p>No photos found.</p>
                )}
              </div>
            </div>
          </div>
        ) : customWorkspaces.find((ws) => ws.id === activeWorkspace) ? (
          renderCustomWorkspace(customWorkspaces.find((ws) => ws.id === activeWorkspace))
        ) : (
          <div className="text-center text-gray-400 py-12">Select a workspace to begin.</div>
        )}
      </div>

      <FloatingAddNoteButton />
    </div>
  );
};

// ─────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────

function MenuItem({ icon, label, shortcut, description, onClick, variant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 transition ${
        variant === 'danger' ? 'text-red-600 hover:text-red-700' : 'text-gray-700'
      }`}
    >
      <span className="text-gray-500">{icon}</span>
      <div className="flex-1 flex items-center justify-between gap-4">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {description && <span className="text-xs text-gray-400">{description}</span>}
          {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
        </div>
      </div>
    </button>
  );
}

function ToggleRow({ icon, label }) {
  const [enabled, setEnabled] = useState(false);
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
      onClick={() => setEnabled((v) => !v)}
    >
      <div className="flex items-center gap-3 text-gray-700">
        <span className="text-gray-500">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-4' : 'translate-x-1'}`}
        />
      </span>
    </div>
  );
}

function SubMenu({ icon, label }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-700">
      <div className="flex items-center gap-3">
        <span className="text-gray-500">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-xs text-gray-400">›</span>
    </div>
  );
}

export default Notes;
