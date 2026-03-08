// ─────────────────────────────────────────────
// src/AppRoutes.jsx
// Stable Nested Routing (Notes FIXED)
// - /app/* is fully protected
// - No duplicate /notes route
// - Deterministic fallback
// ─────────────────────────────────────────────

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './layouts/Layout.jsx';
import { useAuth } from './context/AuthContext';

// PUBLIC
import Home from './pages/Home.jsx';
import DebugPage from './pages/DebugPage.jsx';
import GoogleTest from './pages/GoogleTest.jsx';

// PROTECTED
import CalendarView from './components/CalendarView.jsx';
import SchedulePage from './pages/Schedule';
import Profile from './pages/Profile.jsx';
import Notes from './pages/Notes.jsx';
import Upload from './pages/Upload.jsx';
import Predict from './pages/Predict.jsx';
import ThreeDays from './pages/ThreeDays.jsx';
import Mentaum from './pages/Mentaum.jsx';
import Thewerup from './pages/Thewerup.jsx';
import Heeren from './pages/Heeren.jsx';
import Library from './pages/Library.jsx';
import DeepResearch from './pages/DeepResearch.jsx';
import PerplexicaPage from './pages/PerplexicaEmbed.jsx';

// Radeles
import Radeles from './pages/Radeles/index.jsx';
import NewChat from './pages/Radeles/NewChat.jsx';

// Tasks
import TasksBoard from './pages/TasksBoard.jsx';
import TasksPage from './pages/Tasks.jsx';
import AddTask from './components/AddTask.jsx';

// ─────────────────────────────────────────────
// Protected Route Wrapper
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}
      >
        ⏳ Checking authentication…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="/google-test" element={<GoogleTest />} />

      <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />

      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <SchedulePage />
          </ProtectedRoute>
        }
      />

      {/* PROTECTED APP TREE */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect */}
        <Route index element={<Navigate to="calendar" replace />} />

        {/* Core */}
        <Route path="calendar" element={<CalendarView />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notes" element={<Notes />} />
        <Route path="upload" element={<Upload />} />
        <Route path="predict" element={<Predict />} />
        <Route path="three-days" element={<ThreeDays />} />

        {/* Extra */}
        <Route path="mentaum" element={<Mentaum />} />
        <Route path="thewerup" element={<Thewerup />} />
        <Route path="heeren" element={<Heeren />} />
        <Route path="library" element={<Library />} />
        <Route path="deepresearch" element={<DeepResearch />} />
        <Route path="perplexica" element={<PerplexicaPage />} />

        {/* Radeles Nested */}
        <Route path="radeles/*" element={<Radeles />}>
          <Route index element={<NewChat />} />
          <Route path="deep-research" element={<DeepResearch />} />
        </Route>

        {/* Tasks */}
        <Route path="tasks" element={<TasksBoard />} />
        <Route path="tasks/list" element={<TasksPage />} />
        <Route path="tasks/new" element={<AddTask />} />
      </Route>

      {/* GLOBAL FALLBACK */}
      <Route
        path="*"
        element={
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              background: '#fee2e2',
              color: '#7f1d1d',
            }}
          >
            ❌ NO ROUTE MATCHED
          </div>
        }
      />
    </Routes>
  );
}
