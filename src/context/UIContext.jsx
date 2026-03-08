// ─────────────────────────────────────────────
// src/context/UIContext.jsx
// Global UI State (ROUTE-AWARE + SAFE)
// - Centralized sidebar control
// - Route-aware UI flags
// - Radeles Focus Mode (Step 3.6)
// - NEVER blocks render
// ─────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const UIContext = createContext(null);

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used inside UIProvider');
  }
  return ctx;
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function UIProvider({ children }) {
  const location = useLocation();

  // ───────── Sidebar state ─────────
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Remember last non-Radeles sidebar state
  const lastSidebarStateRef = useRef(true);

  // ───────── Route detection ─────────
  const pathname = location.pathname;

  const isAppRoute = pathname.startsWith('/app');
  const isCalendarRoute = pathname.startsWith('/app/calendar');
  const isRadelesRoute = pathname.startsWith('/app/radeles');
  const isDeepResearchRoute =
    pathname.startsWith('/app/deepresearch') || pathname.includes('deep-research');

  // ─────────────────────────────────────────────
  // Radeles Focus Mode (AUTO COLLAPSE / RESTORE)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (isRadelesRoute) {
      // Save previous sidebar state once, then collapse
      lastSidebarStateRef.current = sidebarOpen;
      setSidebarOpen(false);
    } else {
      // Restore when leaving Radeles
      setSidebarOpen(lastSidebarStateRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRadelesRoute]);

  // ───────── Visibility rules ─────────
  const showSidebar = isAppRoute;
  const showCalendarHeader = isCalendarRoute;

  // ───────── Context value ─────────
  const value = useMemo(
    () => ({
      // Sidebar controls
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar: () => setSidebarOpen((prev) => !prev),

      // Route flags
      isAppRoute,
      isCalendarRoute,
      isRadelesRoute,
      isDeepResearchRoute,

      // UI visibility
      showSidebar,
      showCalendarHeader,
    }),
    [
      sidebarOpen,
      isAppRoute,
      isCalendarRoute,
      isRadelesRoute,
      isDeepResearchRoute,
      showSidebar,
      showCalendarHeader,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
