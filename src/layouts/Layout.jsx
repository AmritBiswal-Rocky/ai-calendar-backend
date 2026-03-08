// ─────────────────────────────────────────────
// src/layouts/Layout.jsx
// Full Layout Wrapper (Sidebar + Content)
//
// FIXED:
// ✅ Removed the extra Layout arrow toggle button (white circle)
// ✅ Sidebar "double arrow" (<<) is now the ONLY toggle control
// ✅ Layout listens to the global event: "sidebar-toggle"
//
// NEW (as per your latest requirement):
// ✅ When sidebar is hidden -> it hides COMPLETELY (width = 0)
// ✅ Floating UNHIDE pill appears: ( >> + DEEMENTUM )
// ✅ Clicking the pill unhides the sidebar
//
// EXTRA FIX (UPDATED):
// ✅ Page CAN scroll up/down
// ✅ Scrollbar is HIDDEN (not removed)
// ✅ Smooth scrolling enabled
//
// UI UPDATE (YOUR LATEST REQUEST):
// ✅ Unhide pill updated EXACTLY like your 2nd image:
//    - soft white pill container
//    - left circular button with (>>)
//    - DEEMENTUM inside a rounded rectangle bar
//
// EXTRA UI UPDATE (LATEST):
// ✅ Inside rectangular box:
//    - light sky color background (like your image)
//    - smaller rectangle size
//    - simpler DEEMENTUM font
//
// RULES:
// - UIContext is the SINGLE source of truth
// - Sidebar collapse/expand RESTORED via UIContext
// - Route-aware + crash-safe
// ─────────────────────────────────────────────

import React, { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronsRight } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

// ─────────────────────────────────────────────
// Loader UI (safe, visible)
// ─────────────────────────────────────────────
const Loader = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontSize: 16,
    }}
  >
    Loading…
  </div>
);

// ─────────────────────────────────────────────
// Layout Error Boundary
// ─────────────────────────────────────────────
class LayoutErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('❌ Layout render crash:', error);
    console.error(info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 32,
            background: '#fee2e2',
            color: '#7f1d1d',
            minHeight: '100vh',
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>❌ Layout crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {this.state.error?.message || 'Unknown layout error'}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────
// Main Layout
// ─────────────────────────────────────────────
export default function Layout() {
  const { user, loading } = useAuth();
  const { sidebarOpen, toggleSidebar, showSidebar } = useUI();

  // ───────────────────────────────────────────
  // IMPORTANT: Sidebar toggle event listener
  // ───────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (typeof toggleSidebar === 'function') {
        toggleSidebar();
      }
    };

    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, [toggleSidebar]);

  // ───────── Auth loading ─────────
  if (loading) {
    return <Loader />;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#f8fafc',
        position: 'relative',
      }}
    >
      {/* ───────────── Sidebar Wrapper ───────────── */}
      {user && showSidebar && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            width: sidebarOpen ? 240 : 0, // ✅ fully hide
            transition: 'width 0.28s ease',
            background: '#0f1827',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Only mount Sidebar when open (prevents partial leftover UI) */}
          {sidebarOpen && (
            <LayoutErrorBoundary>
              <Sidebar />
            </LayoutErrorBoundary>
          )}
        </div>
      )}

      {/* ───────────── Floating UNHIDE pill (>> + DEEMENTUM) ───────────── */}
      {!sidebarOpen && user && showSidebar && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          title="Open sidebar"
          style={{
            position: 'absolute',
            left: 16,
            top: 14,
            zIndex: 50,

            height: 56,
            padding: '8px 14px',
            borderRadius: 999,

            display: 'flex',
            alignItems: 'center',
            gap: 12,

            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(59,130,246,0.22)',

            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)',
            cursor: 'pointer',

            transition: 'transform 160ms ease, box-shadow 160ms ease',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 20px 44px rgba(15, 23, 42, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0px) scale(1)';
            e.currentTarget.style.boxShadow = '0 16px 36px rgba(15, 23, 42, 0.18)';
          }}
        >
          {/* left circular button (>>) */}
          <span
            style={{
              height: 42,
              width: 42,
              borderRadius: 999,

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              background: 'rgba(59,130,246,0.10)',
              border: '1px solid rgba(59,130,246,0.22)',

              boxShadow: '0 10px 22px rgba(59,130,246,0.18)',
              flexShrink: 0,
            }}
          >
            <ChevronsRight size={18} color="#1e3a8a" />
          </span>

          {/* DEEMENTUM rectangular bar (LIGHT SKY + SMALLER + SIMPLE FONT) */}
          <span
            style={{
              height: 30, // ✅ smaller like your image
              display: 'flex',
              alignItems: 'center',

              padding: '0 16px', // ✅ smaller width
              borderRadius: 14,

              // ✅ MORE LIGHT SKY COLOR (UPDATED)
              background: 'rgba(240, 249, 255, 1)',
              border: '1px solid rgba(191, 219, 254, 0.95)',

              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <span
              style={{
                // ✅ simpler font (not bold heavy)
                fontWeight: 600,
                letterSpacing: '0.18em',
                fontSize: 12,
                fontFamily:
                  'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              DEEMENTUM
            </span>
          </span>
        </button>
      )}

      {/* ───────────── Main Content ───────────── */}
      <main
        className="deementum-main-scroll"
        style={{
          flex: 1,
          height: '100%',
          padding: 16,
          marginLeft: sidebarOpen ? 240 : 0, // prevent overlap with fixed sidebar

          // ✅ SCROLL ENABLED
          overflowY: 'auto',

          // smooth scrolling
          scrollBehavior: 'smooth',

          // hide scrollbar in Firefox
          scrollbarWidth: 'none',

          // hide scrollbar in IE/old Edge
          msOverflowStyle: 'none',
        }}
      >
        {/* Hide scrollbar in Chrome/Edge/Safari */}
        <style>
          {`
            .deementum-main-scroll::-webkit-scrollbar {
              width: 0px;
              height: 0px;
            }
            .deementum-main-scroll::-webkit-scrollbar-thumb {
              background: transparent;
            }
            .deementum-main-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
          `}
        </style>

        <LayoutErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </LayoutErrorBoundary>
      </main>
    </div>
  );
}
