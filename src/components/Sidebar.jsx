// ─────────────────────────────────────────────
// src/components/Sidebar.jsx
// Premium Sidebar (PRESENTATIONAL ONLY)
//
// RULES (as per your request)
// ─────────────────────────────────────────────
// ✅ NO internal toggle state
// ✅ NO layout control (no width changing here)
// ✅ Collapse/expand handled by Layout + UIContext (external)
// ✅ Sidebar only *triggers* an external toggle event
//
// GOAL
// ─────────────────────────────────────────────
// Match your "previous advanced" sidebar look:
// - Premium dark navy background
// - Soft divider line under DEEMENTUM
// - Rounded active pill highlight
// - Glassy "double arrow" collapse button (<<) on the right
// - When collapsed: show slim icons + ">> DEEMENTUM" pill
//
// EXTRA FIX (YOUR NEW REQUEST)
// ─────────────────────────────────────────────
// ✅ Hide button (<<) EXACT like your old Image-1:
//    - floating square
//    - hover popup (scale + lift + glow)
//
// EXTRA FIX (HIDE SCROLLBAR, KEEP SCROLLING)
// ─────────────────────────────────────────────
// ✅ Sidebar still scrolls
// ✅ Scrollbar is hidden (not visible)
//
// NEW UPDATE (YOUR LATEST REQUEST)
// ─────────────────────────────────────────────
// ✅ Change hide/unhide logo to a 3D double-chevron icon like your image
// ✅ Make hide arrow BIG and VISIBLE (not the border)
//
// NOTE
// ─────────────────────────────────────────────
// The toggle button dispatches:
//    window.dispatchEvent(new CustomEvent('sidebar-toggle'))
// Layout/UIContext listens to this and toggles collapse.
// ─────────────────────────────────────────────

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar as CalendarIcon,
  User,
  FileText,
  Brain,
  Upload,
  Image as ImageIcon,
  Video,
  ShoppingBag,
  Bot,
} from 'lucide-react';

import { useUI } from '../context/UIContext';

// ─────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────
const navItems = [
  { to: '/perplexica', label: 'Perplexica', icon: Bot },
  { to: '/', label: 'Home', icon: Home },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/notes', label: 'Notes', icon: FileText },
  { to: '/predict', label: 'Predict', icon: Brain },
  { to: '/mentaum', label: 'Mentaum', icon: ImageIcon },
  { to: '/thewerup', label: 'Thewerup', icon: Video },
  { to: '/heeren', label: 'Heeren', icon: ShoppingBag },
  { to: '/upload', label: 'DEEMENTUM', icon: Upload },
];

// ─────────────────────────────────────────────
// Small internal helpers (safe + stable)
// ─────────────────────────────────────────────
function safePathname(pathname) {
  try {
    return typeof pathname === 'string' ? pathname : '';
  } catch {
    return '';
  }

function DeementumUnhideIcon({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="unhidePrimary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f49b6" />
          <stop offset="100%" stopColor="#19357c" />
        </linearGradient>

        <linearGradient id="unhideTrail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(82,110,186,0.35)" />
          <stop offset="100%" stopColor="rgba(156,176,226,0.05)" />
        </linearGradient>

        <filter id="unhideBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      {/* trailing glow */}
      <g filter="url(#unhideBlur)" stroke="url(#unhideTrail)" strokeWidth="4" strokeLinecap="round">
        <path d="M14 11 L20.5 18 L14 25" />
        <path d="M20 11 L26.5 18 L20 25" />
      </g>

      {/* crisp front arrows */}
      <g stroke="url(#unhidePrimary)" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M13 11 L19.5 18 L13 25" />
        <path d="M19 11 L25.5 18 L19 25" />
      </g>
    </svg>
  );
}
}

function isItemActive(pathname, itemTo) {
  const path = safePathname(pathname);

  // Home exact match
  if (itemTo === '/') return path === '/';

  // Normal route prefix match
  return path === itemTo || path.startsWith(itemTo + '/');
}

/**
 * Dispatch sidebar toggle event.
 * Sidebar is presentational-only, so it does NOT manage collapse state.
 * Layout/UIContext should listen and toggle.
 */
function dispatchSidebarToggle() {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('sidebar-toggle'));
  } catch {
    // silent
  }
}

// ─────────────────────────────────────────────
// 3D Double Chevron Icon (LIKE YOUR IMAGE)
// (UPDATED: stronger visibility)
// ─────────────────────────────────────────────
function DeementumChevron3D({ direction = 'left', size = 30 }) {
  const rotate = direction === 'right' ? 'rotate(180 16 16)' : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{
        filter:
          'drop-shadow(0 3px 8px rgba(255,255,255,0.35)) drop-shadow(0 14px 22px rgba(0,0,0,0.70))',
      }}
    >
      <defs>
        <linearGradient id="d3dOuter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9e4ff" />
          <stop offset="100%" stopColor="#7384a6" />
        </linearGradient>

        <linearGradient id="d3dInner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dce6ff" />
        </linearGradient>

        <linearGradient id="d3dSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
      </defs>

      <g transform={rotate ? rotate : undefined}>
        {/* rear chevron */}
        <path
          d="M22 7.2 L14.4 16 L22 24.8 L25.2 21.7 L19.6 16 L25.2 10.3 Z"
          fill="url(#d3dOuter)"
        />

        {/* front chevron */}
        <path
          d="M17.6 7.2 L10 16 L17.6 24.8 L20.8 21.7 L15.2 16 L20.8 10.3 Z"
          fill="url(#d3dInner)"
        />

        {/* glossy edge */}
        <path
          d="M17 9.2 L11.4 16 L17 22.8 L19 20.6 L15.4 16 L19 11.4 Z"
          fill="url(#d3dSheen)"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ SINGLE source of truth for collapse state
  const { sidebarOpen } = useUI();

  const pathname = safePathname(location?.pathname);
  const isCollapsed = !sidebarOpen;

  return (
    <aside
      style={{
        height: '100%',
        width: '100%',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',

        // Premium deep navy background (like your old screenshot)
        background:
          'radial-gradient(1200px 800px at 10% 0%, rgba(59,130,246,0.08) 0%, rgba(15,24,39,0.0) 45%), linear-gradient(180deg, #0b1322 0%, #0a1220 35%, #08101d 100%)',

        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ───────────── Header / Brand ───────────── */}
      <div
        style={{
          position: 'relative',
          padding: isCollapsed ? '14px 10px 12px' : '18px 16px 14px',
          flexShrink: 0,
        }}
      >
        {/* Expanded Header */}
        {!isCollapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.12em',
                margin: 0,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              DEEMENTUM
            </h1>

            {/* ✅ Hide button: floating square + popup hover + BIG visible icon */}
            <button
              type="button"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              onClick={dispatchSidebarToggle}
              style={{
                height: 40,
                width: 40,
                borderRadius: 14,
                border: '1px solid rgba(160,185,255,0.18)',
                background:
                  'linear-gradient(160deg, rgba(18,24,40,0.95) 0%, rgba(12,18,32,0.92) 60%, rgba(7,11,21,0.88) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 12px rgba(0,0,0,0.45), 0 14px 32px rgba(3,6,14,0.95)',
                position: 'relative',
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition:
                  'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(186,206,255,0.34)';
                e.currentTarget.style.background =
                  'linear-gradient(150deg, rgba(28,36,60,0.98) 0%, rgba(12,18,32,0.95) 65%, rgba(6,9,18,0.92) 100%)';
                e.currentTarget.style.boxShadow =
                  'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -4px 14px rgba(0,0,0,0.55), 0 22px 38px rgba(3,6,14,0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(160,185,255,0.18)';
                e.currentTarget.style.background =
                  'linear-gradient(160deg, rgba(18,24,40,0.95) 0%, rgba(12,18,32,0.92) 60%, rgba(7,11,21,0.88) 100%)';
                e.currentTarget.style.boxShadow =
                  'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 12px rgba(0,0,0,0.45), 0 14px 32px rgba(3,6,14,0.95)';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 1,
                  borderRadius: 14,
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(0,0,0,0))',
                  pointerEvents: 'none',
                }}
              />

              {/* BIG + bright arrow (not border) */}
              <div
                style={{
                  transform: 'scale(1.35)',
                  filter:
                    'drop-shadow(0 0px 8px rgba(255,255,255,0.55)) drop-shadow(0 14px 22px rgba(0,0,0,0.70))',
                }}
              >
                <DeementumChevron3D direction="left" size={26} />
              </div>
            </button>
          </div>
        )}

        {/* Collapsed Header => glowing "unhide" control */}
        {isCollapsed && (
          <button
            type="button"
            onClick={dispatchSidebarToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            style={{
              width: '100%',
              height: 56,
              borderRadius: 28,
              border: '1px solid rgba(147,176,255,0.35)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(233,240,255,0.98) 55%, rgba(214,226,255,0.95) 100%)',
              boxShadow:
                '0 18px 35px rgba(15,30,65,0.22), inset 0 1px 0 rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              padding: '0 16px',
              transition:
                'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease, background 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              e.currentTarget.style.borderColor = 'rgba(126,158,255,0.55)';
              e.currentTarget.style.boxShadow =
                '0 22px 42px rgba(15,30,65,0.28), inset 0 1px 0 rgba(255,255,255,0.9)';
              e.currentTarget.style.background =
                'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(226,235,255,0.99) 55%, rgba(204,218,255,0.97) 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(147,176,255,0.35)';
              e.currentTarget.style.boxShadow =
                '0 18px 35px rgba(15,30,65,0.22), inset 0 1px 0 rgba(255,255,255,0.8)';
              e.currentTarget.style.background =
                'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(233,240,255,0.98) 55%, rgba(214,226,255,0.95) 100%)';
            }}
          >
            <span
              style={{
                height: 44,
                width: 44,
                borderRadius: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(175,193,255,0.55)',
                background:
                  'linear-gradient(145deg, rgba(249,251,255,1) 0%, rgba(223,233,255,0.95) 65%, rgba(200,213,244,0.9) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -4px 10px rgba(164,178,209,0.35)',
              }}
            >
              <div
                style={{
                  transform: 'scale(1.1)',
                  filter:
                    'drop-shadow(0 2px 6px rgba(57,89,168,0.45)) drop-shadow(0 8px 16px rgba(24,39,94,0.35))',
                }}
              >
                <DeementumUnhideIcon size={26} />
              </div>
            </span>

            <span
              style={{
                flex: 1,
                height: 42,
                borderRadius: 20,
                border: '1px solid rgba(166,188,255,0.65)',
                background:
                  'linear-gradient(130deg, rgba(229,237,255,1) 0%, rgba(208,220,255,0.98) 60%, rgba(192,206,248,0.95) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -4px 12px rgba(156,173,214,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.32em',
                color: '#141c2e',
                textTransform: 'uppercase',
              }}
            >
              DEEMENTUM
            </span>
          </button>
        )}

        {/* divider line like old advanced UI */}
        <div
          style={{
            marginTop: 14,
            height: 1,
            width: '100%',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.0) 100%)',
          }}
        />
      </div>

      {/* ───────────── Navigation ───────────── */}
      <nav
        className="deementum-sidebar-scroll"
        style={{
          flex: 1,

          // ✅ Keep scrolling working
          overflowY: 'auto',

          // padding based on collapsed/expanded
          padding: isCollapsed ? '10px 8px 14px' : '10px 12px 14px',

          // Firefox hide scrollbar
          scrollbarWidth: 'none',

          // IE/old Edge hide scrollbar
          msOverflowStyle: 'none',
        }}
      >
        {/* Hide scrollbar in Chrome/Edge/Safari */}
        <style>
          {`
            .deementum-sidebar-scroll::-webkit-scrollbar {
              width: 0px;
              height: 0px;
            }
            .deementum-sidebar-scroll::-webkit-scrollbar-thumb {
              background: transparent;
            }
            .deementum-sidebar-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
          `}
        </style>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item.to);

          const itemStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 12,
            padding: isCollapsed ? '12px 10px' : '12px 14px',
            borderRadius: 14,
            fontSize: 15,
            cursor: 'pointer',
            textDecoration: 'none',
            marginBottom: 10,
            width: '100%',
            textAlign: 'left',

            color: active ? '#ffffff' : 'rgba(255,255,255,0.82)',
            background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.00)',

            border: active ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0)',

            boxShadow: active ? '0 10px 20px rgba(0,0,0,0.22)' : 'none',

            transition: 'all 180ms ease',
          };

          const iconColor = active ? '#ffffff' : 'rgba(255,255,255,0.72)';

          const content = (
            <>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.02)',
                  border: active
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: active ? '0 8px 18px rgba(0,0,0,0.22)' : 'none',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color={iconColor} />
              </span>

              {!isCollapsed && (
                <span
                  style={{
                    fontWeight: active ? 700 : 600,
                    letterSpacing: '0.01em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              )}
            </>
          );

          // Home uses button for SPA-safe navigation
          if (item.to === '/') {
            return (
              <button
                key="home"
                type="button"
                onClick={() => navigate('/')}
                style={{
                  ...itemStyle,
                  outline: 'none',
                }}
                title={isCollapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (active) return;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (active) return;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.00)';
                  e.currentTarget.style.border = '1px solid rgba(0,0,0,0)';
                }}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              style={itemStyle}
              title={isCollapsed ? item.label : undefined}
              onMouseEnter={(e) => {
                if (active) return;
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (active) return;
                e.currentTarget.style.background = 'rgba(255,255,255,0.00)';
                e.currentTarget.style.border = '1px solid rgba(0,0,0,0)';
              }}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* ───────────── Footer spacing / subtle fade ───────────── */}
      <div
        style={{
          height: 18,
          flexShrink: 0,
          background:
            'linear-gradient(180deg, rgba(8,16,29,0) 0%, rgba(8,16,29,0.8) 70%, rgba(8,16,29,1) 100%)',
        }}
      />
    </aside>
  );
}
