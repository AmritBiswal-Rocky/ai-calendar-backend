import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sun, Moon, UploadIcon } from 'lucide-react';
import NewChatActionMenu from '@/components/NewChatActionMenu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { askOpenRouter } from '@/api/openrouter';
import { safeLocalStorage } from '@/utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import TypingDots from '@/components/TypingDots';
import RadelesProfilePopup from '@/components/RadelesProfilePopup';

const discoverChats = [
  { id: 1, name: 'AI Brainstorm', message: "Let's refine your ideas...", time: '2m ago' },
  { id: 2, name: 'Project Phoenix', message: 'Latest summary ready.', time: '10m ago' },
  { id: 3, name: 'Research Hub', message: 'Uploaded new findings.', time: '1h ago' },
  { id: 4, name: 'Notebook', message: 'Quick note saved!', time: '2h ago' },
];

const samplePreviousChats = [
  {
    id: 'react-design',
    title: 'React app design ideas',
    lastMessageAt: '2 hours ago',
  },
  {
    id: 'supabase-rls',
    title: 'Supabase RLS policy error',
    lastMessageAt: 'Yesterday',
  },
  {
    id: 'ai-calendar',
    title: 'AI Calendar Fix',
    lastMessageAt: '3 days ago',
  },
];

function DiscoverView({ onSelectNav, activeSection, navItems }) {
  const [query, setQuery] = useState('');
  const filteredChats = useMemo(() => {
    if (!query.trim()) return discoverChats;
    const lower = query.toLowerCase();
    return discoverChats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(lower) || chat.message.toLowerCase().includes(lower)
    );
  }, [query]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8f9ff] via-[#eef1ff] to-[#e4e9ff]">
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 border-r border-white/30 bg-white/40 p-4 shadow-lg backdrop-blur-xl"
      >
        <div className="mb-8 text-xl font-bold text-indigo-700">Quick Navigation</div>
        <nav className="flex flex-col gap-4">
          {navItems.map(({ id, label }) => (
            <Button
              key={id}
              variant="ghost"
              className={`justify-start hover:bg-indigo-100 ${
                activeSection === id ? 'bg-indigo-100 text-indigo-700' : ''
              }`}
              onClick={() => onSelectNav(id)}
            >
              {label}
            </Button>
          ))}
        </nav>
      </motion.aside>

      <div className="flex flex-1 flex-col p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between"
        >
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            Radeles Discover
          </h1>
          <div>
            <input
              type="text"
              placeholder="Search featured chats..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white/70 py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="cursor-pointer rounded-2xl border border-white/40 bg-white/80 backdrop-blur-sm transition-all hover:shadow-2xl">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">{chat.name}</h2>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{chat.message}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Radeles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // { role: 'user' | 'bot', content: string }
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSection, setActiveSection] = useState('chats');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previousChats] = useState(samplePreviousChats);
  const [searchTerm, setSearchTerm] = useState('');
  const chatWindowRef = useRef(null);
  const [activeChatId, setActiveChatId] = useState(previousChats[0]?.id ?? null);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [showApiBar, setShowApiBar] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');

  const navItems = [
    { id: 'discover', label: 'Discover' },
    { id: 'new', label: 'New Chat' },
    { id: 'search', label: 'Search Chats' },
    { id: 'library', label: 'Library' },
    { id: 'projects', label: 'Projects' },
    { id: 'chats', label: 'Previous Chats' },
  ];

  const libraryItems = [
    {
      title: 'Conversation Starters',
      description: 'Save prompt templates and suggested replies for quick access.',
    },
    {
      title: 'Knowledge Base',
      description: 'Organize documents, guides, and reference links for Radeles.',
    },
    {
      title: 'Pinned Resources',
      description: 'Keep important files ready to share inside any conversation.',
    },
  ];

  const projectItems = [
    {
      title: 'Product Research',
      status: 'Active',
      summary: 'Collecting user questions from conversations for the Q4 roadmap.',
    },
    {
      title: 'Launch Playbook',
      status: 'Planning',
      summary: 'Draft messaging flows and automate outreach sequences.',
    },
    {
      title: 'Support Handoff',
      status: 'Review',
      summary: 'Sync chat transcripts with the customer success team.',
    },
  ];

  const avatarUrl =
    user?.photoURL ||
    user?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.avatarUrl ||
    null;
  const avatarInitial = (user?.displayName || user?.full_name || user?.email || 'U')
    .slice(0, 1)
    .toUpperCase();
  const profileStats = useMemo(
    () => ({
      chats: previousChats.length,
      saved: messages.length,
      credits: 120,
    }),
    [messages.length, previousChats.length]
  );

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    try {
      const storedKey = safeLocalStorage.getItem('radeles_api_key');
      if (storedKey) {
        setSavedApiKey(storedKey);
        setApiKeyInput(storedKey);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to read Radeles API key', error);
    }
  }, []);

  useEffect(() => {
    console.log('showAccountPopup:', showAccountPopup);
  }, [showAccountPopup]);

  useEffect(() => {
    if (!['chats', 'new'].includes(activeSection)) return;

    const container = chatWindowRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isTyping, activeSection]);

  useEffect(() => {
    if (activeSection !== 'search') {
      setSearchTerm('');
    }
  }, [activeSection]);

  useEffect(() => {
    if (showAccountPopup || showThemeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAccountPopup, showThemeModal]);

  if (!user) {
    return null;
  }

  const resetChatAndScroll = () => {
    requestAnimationFrame(() => {
      const container = chatWindowRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    });
  };

  const handleSelectNav = (id) => {
    if (id === 'new') {
      setMessages([]);
      setUserInput('');
      setActiveSection('new');
      resetChatAndScroll();
      return;
    }
    setActiveSection(id);
    if (id === 'chats') {
      resetChatAndScroll();
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveSection('chats');
    resetChatAndScroll();
  };

  const releaseAttachmentPreviews = (attachments) => {
    attachments.forEach((item) => {
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
  };

  const buildAttachmentObjects = (files) =>
    files.map((file) => ({
      file,
      preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));

  const clearPendingAttachments = () => {
    setPendingAttachments((prev) => {
      releaseAttachmentPreviews(prev);
      return [];
    });
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    const trimmed = apiKeyInput.trim();
    setSavedApiKey(trimmed);
    try {
      safeLocalStorage.setItem('radeles_api_key', trimmed);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to persist Radeles API key', error);
    }
    setShowApiBar(false);
  };

  const handleCancelApiBar = () => {
    setApiKeyInput(savedApiKey ?? '');
    setShowApiBar(false);
  };

  const handleClearApiKey = () => {
    setSavedApiKey('');
    setApiKeyInput('');
    try {
      safeLocalStorage.removeItem('radeles_api_key');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear Radeles API key', error);
    }
  };

  const handleSend = async () => {
    if (!['chats', 'new'].includes(activeSection)) return;
    if (!userInput.trim() && pendingAttachments.length === 0) return;
    if (isTyping) return;

    const outgoingPayload = {
      text: userInput,
      attachments: pendingAttachments.map(({ file }) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
      apiKey: savedApiKey || null,
    };

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userInput, attachments: outgoingPayload.attachments },
    ]);

    const currentMessage = userInput;
    setUserInput('');
    clearPendingAttachments();
    setIsTyping(true);

    try {
      const botReply = await askOpenRouter(currentMessage);
      setMessages((prev) => [...prev, { role: 'bot', content: botReply }]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Radeles chat error', err);
      setMessages((prev) => [...prev, { role: 'bot', content: '⚠️ Something went wrong.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const filteredMessages = searchTerm
    ? messages.filter((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleOpenTheme = () => setShowThemeModal(true);
  const handleCloseTheme = () => setShowThemeModal(false);
  const handleSelectTheme = (mode) => {
    setIsDarkMode(mode === 'dark');
  };
  const themeCardStyles = (mode) => {
    const isDarkCard = mode === 'dark';
    const isActive = isDarkCard ? isDarkMode : !isDarkMode;
    return {
      flex: 1,
      padding: '1rem 1.1rem',
      borderRadius: '1rem',
      border: isActive ? '2px solid #a5b4fc' : '1px solid rgba(148,163,184,0.35)',
      background: isDarkCard
        ? 'linear-gradient(135deg, #0f172a 0%, #1f2937 60%, #312e81 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      color: isDarkCard ? '#e2e8f0' : '#0f172a',
      boxShadow: isActive ? '0 20px 40px rgba(99,102,241,0.35)' : '0 10px 24px rgba(15,23,42,0.08)',
      transform: isActive ? 'translateY(-4px) scale(1.01)' : 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      minHeight: '150px',
      justifyContent: 'space-between',
    };
  };

  const activeLabel = navItems.find((item) => item.id === activeSection)?.label ?? '';

  if (activeSection === 'discover') {
    return (
      <DiscoverView
        navItems={navItems}
        activeSection={activeSection}
        onSelectNav={handleSelectNav}
      />
    );
  }

  return (
    <div
      className="radeles"
      style={{
        display: 'flex',
        minHeight: '120vh',
        height: 'auto',
        width: '100%',
        background: '#ffffff',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: sidebarOpen ? '280px' : '70px',
          transition: 'width 0.3s ease',
          background: '#ffffffee',
          backdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(148, 163, 184, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          boxSizing: 'border-box',
          gap: '1.25rem',
          boxShadow: '4px 0 24px rgba(15, 23, 42, 0.08)',
          marginRight: '1.5rem',
          borderRadius: '22px',
          position: 'sticky',
          top: '1rem',
          height: 'calc(100vh - 2rem)',
          overflow: 'hidden',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            alignSelf: 'flex-start',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            color: '#fff',
            fontSize: '1.125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
          }}
        >
          {sidebarOpen ? '×' : '☰'}
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            opacity: sidebarOpen ? 1 : 0,
            visibility: sidebarOpen ? 'visible' : 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            color: '#0f172a',
            flexGrow: 1,
            overflowY: 'auto',
            paddingRight: sidebarOpen ? '0.4rem' : 0,
            marginRight: sidebarOpen ? '-0.4rem' : 0,
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#475569',
            }}
          >
            QUICK NAVIGATION
          </span>
          {navItems.map(({ id, label }) => {
            const isActive = activeSection === id;
            return (
              <motion.button
                whileHover={{ scale: sidebarOpen ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                key={id}
                type="button"
                onClick={() => handleSelectNav(id)}
                style={{
                  textAlign: 'left',
                  background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: isActive ? '#1d4ed8' : '#334155',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 10px 24px rgba(37, 99, 235, 0.14)' : 'none',
                }}
              >
                <span>{label}</span>
              </motion.button>
            );
          })}
          <div
            style={{
              marginTop: 'auto',
              padding: '0.75rem',
              borderRadius: '1rem',
              border: '1px solid rgba(148,163,184,0.4)',
              background: 'rgba(248,250,252,0.6)',
            }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAccountPopup(true)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '0.8rem',
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'white',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Settings
            </motion.button>
          </div>
        </motion.div>
      </motion.aside>

      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          gap: '0',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 'none',
          margin: 0,
          height: 'auto',
          minHeight: '110vh',
          overflow: 'visible',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                margin: 0,
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              Radeles Chat
            </h1>
            <p
              style={{
                margin: '0.35rem 0 0',
                fontSize: '0.85rem',
                color: '#475569',
                letterSpacing: '0.01em',
              }}
            >
              {activeLabel}
            </p>
          </div>
          <div
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="User avatar"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User avatar"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {avatarInitial}
              </div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="chat-window"
          ref={chatWindowRef}
          style={{
            flexGrow: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '2rem',
            paddingBottom: '6.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {['chats', 'new'].includes(activeSection) && (
            <>
              {activeSection === 'chats' && previousChats.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {previousChats.map((chat) => {
                    const isActiveChat = chat.id === activeChatId;
                    return (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        onClick={() => handleSelectChat(chat.id)}
                        style={{
                          borderRadius: '16px',
                          border: isActiveChat
                            ? '1px solid rgba(59, 130, 246, 0.45)'
                            : '1px solid rgba(15,23,42,0.08)',
                          background: isActiveChat
                            ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(129,140,248,0.12) 100%)'
                            : 'rgba(248, 250, 252, 0.8)',
                          boxShadow: isActiveChat
                            ? '0 18px 32px rgba(37, 99, 235, 0.16)'
                            : '0 10px 20px rgba(15,23,42,0.06)',
                          padding: '1rem 1.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActiveChat) {
                            e.currentTarget.style.background = 'rgba(241,245,249,0.95)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActiveChat) {
                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                          }
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              color: '#1f2937',
                              fontWeight: 600,
                              fontSize: '0.98rem',
                            }}
                          >
                            <span aria-hidden style={{ fontSize: '1.05rem' }}>
                              💬
                            </span>
                            {chat.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              aria-label={`Rename ${chat.title}`}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '0.15rem',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#1d4ed8';
                                e.currentTarget.style.background = 'rgba(37,99,235,0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              ✏️
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              aria-label={`Delete ${chat.title}`}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0.15rem',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(248,113,113,0.12)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              ❌
                            </motion.button>
                          </div>
                        </div>
                        <span
                          style={{
                            color: '#64748b',
                            fontSize: '0.85rem',
                          }}
                        >
                          {chat.lastMessageAt}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className={msg.role === 'user' ? 'user-msg' : 'bot-msg'}
                  style={{
                    maxWidth: '100%',
                    width: 'fit-content',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.5rem',
                    background: msg.role === 'user' ? '#f7f7f8' : '#f9fafb',
                    color: '#1f2937',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    border: '1px solid rgba(0,0,0,0.05)',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.content}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: '1rem 1.5rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    width: 'fit-content',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <TypingDots />
                </motion.div>
              )}
            </>
          )}

          {activeSection === 'search' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                maxWidth: '640px',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#1f2937' }}>
                  Search across chats
                </h2>
                <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                  Find any message shared with Radeles by entering keywords below.
                </p>
              </motion.div>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  padding: '0.7rem 1.1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(15,23,42,0.15)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(15,23,42,0.15)';
                  e.target.style.boxShadow = '0 10px 24px rgba(15,23,42,0.05)';
                }}
              />
              {searchTerm.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ duration: 0.4 }}
                  style={{ color: '#94a3b8', fontSize: '0.9rem' }}
                >
                  Start typing to see matching snippets from your conversations.
                </motion.p>
              )}
              {searchTerm.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((msg, idx) => (
                      <motion.div
                        key={`search-${idx}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, duration: 0.35 }}
                        style={{
                          border: '1px solid rgba(148, 163, 184, 0.35)',
                          borderRadius: '0.75rem',
                          padding: '0.9rem 1.1rem',
                          background: 'rgba(248, 250, 252, 0.8)',
                          boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: msg.role === 'user' ? '#0f766e' : '#4338ca',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {msg.role === 'user' ? 'User' : 'Radeles'}
                        </span>
                        <p style={{ margin: 0, color: '#1f2937', lineHeight: 1.6 }}>
                          {msg.content}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        border: '1px dashed rgba(148, 163, 184, 0.5)',
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '0.9rem',
                      }}
                    >
                      No matches yet. Try a different keyword.
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'library' && (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {libraryItems.map((item) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    borderRadius: '1rem',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    padding: '1.35rem',
                    background:
                      'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(236,254,255,0.35) 100%)',
                    boxShadow: '0 18px 32px rgba(15,23,42,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>{item.title}</h3>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{item.description}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.45rem 1rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(59,130,246,0.35)',
                      background: 'white',
                      color: '#2563eb',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View collection
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {activeSection === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {projectItems.map((item) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    borderRadius: '1rem',
                    border: '1px solid rgba(148, 163, 184, 0.45)',
                    padding: '1.25rem',
                    background: 'rgba(248, 250, 252, 0.75)',
                    boxShadow: '0 16px 30px rgba(15,23,42,0.07)',
                    display: 'grid',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1f2937' }}>
                      {item.title}
                    </h3>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        background:
                          item.status === 'Active'
                            ? 'rgba(16,163,127,0.12)'
                            : 'rgba(99,102,241,0.12)',
                        color: item.status === 'Active' ? '#047857' : '#4338ca',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}
                  >
                    {item.summary}
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    style={{
                      justifySelf: 'flex-start',
                      padding: '0.45rem 1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    Open project
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        {activeSection === 'new' && (
          <div
            className="chat-input"
            style={{
              marginTop: 'auto',
              padding: '1.25rem 2rem',
              background: 'rgba(255,255,255,0.96)',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'center',
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              backdropFilter: 'blur(10px)',
              zIndex: 5,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                width: '100%',
              }}
            >
              <NewChatActionMenu
                onFilesSelected={(files) => {
                  const newItems = buildAttachmentObjects(files);
                  setPendingAttachments((prev) => [...prev, ...newItems]);
                }}
                onThinkingSelected={() => {
                  setShowApiBar(true);
                  setApiKeyInput(savedApiKey ?? '');
                }}
                onDeepResearchSelected={() => {
                  navigate('/radeles/deep-research');
                }}
              />
              {pendingAttachments.length > 0 && !showApiBar && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    maxWidth: '40%',
                    overflowX: 'auto',
                    padding: '0.35rem 0.4rem',
                  }}
                >
                  {pendingAttachments.map(({ file, preview }, index) => {
                    const isImage = Boolean(preview);
                    return (
                      <div
                        key={`${file.name}-${index}`}
                        style={{
                          position: 'relative',
                          background: 'rgba(15,23,42,0.06)',
                          borderRadius: '14px',
                          padding: '0.35rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 6px 14px rgba(15,23,42,0.08)',
                          minWidth: isImage ? '72px' : '120px',
                        }}
                      >
                        {isImage ? (
                          <img
                            src={preview ?? ''}
                            alt={file.name}
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.5)',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              maxWidth: '100px',
                              color: '#1f2937',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPendingAttachments((prev) => {
                              const updated = prev.filter((_, i) => i !== index);
                              const removed = prev[index];
                              if (removed?.preview) {
                                URL.revokeObjectURL(removed.preview);
                              }
                              return updated;
                            });
                          }}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '999px',
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 6px 12px rgba(239, 68, 68, 0.35)',
                          }}
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {showApiBar ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexGrow: 1,
                    background:
                      'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))',
                    borderRadius: '18px',
                    padding: '0.6rem 1rem',
                    border: '1px solid rgba(124,58,237,0.25)',
                    boxShadow: '0 10px 24px rgba(124,58,237,0.18)',
                  }}
                >
                  <input
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your GPT API key..."
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      background: 'transparent',
                      color: '#312e81',
                      fontSize: '0.94rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    style={{
                      padding: '0.4rem 1.05rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelApiBar}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  {savedApiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#7c3aed',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Clear saved key
                    </button>
                  )}
                </div>
              ) : (
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message Radeles..."
                  style={{
                    flexGrow: 1,
                    minWidth: 0,
                    padding: '0.65rem 1.25rem',
                    border: '1px solid rgba(15,23,42,0.15)',
                    borderRadius: '999px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 6px 16px rgba(15,23,42,0.04)',
                    minHeight: '0',
                    height: '48px',
                    resize: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(15,23,42,0.15)';
                    e.target.style.boxShadow = '0 6px 16px rgba(15,23,42,0.04)';
                  }}
                />
              )}
              <button
                onClick={handleSend}
                disabled={isTyping}
                style={{
                  padding: '0 1.35rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: isTyping ? 'rgba(0,0,0,0.1)' : '#10a37f',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  height: '46px',
                  minWidth: '80px',
                  boxShadow: '0 6px 16px rgba(16,163,127,0.18)',
                }}
              >
                {isTyping ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showAccountPopup && (
            <RadelesProfilePopup
              open={showAccountPopup}
              user={user}
              avatarUrl={avatarUrl}
              avatarInitial={avatarInitial}
              stats={profileStats}
              isDarkMode={isDarkMode}
              onClose={() => setShowAccountPopup(false)}
              onOpenTheme={() => {
                setShowAccountPopup(false);
                setShowThemeModal(true);
              }}
              onLogout={logout}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Radeles;
