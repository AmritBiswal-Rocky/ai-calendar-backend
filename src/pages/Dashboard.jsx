// src/pages/Dashboard.jsx
import React from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../layouts/Layout';

// Pages rendered within the authenticated dashboard shell
import CalendarView from './CalendarView';
import Notes from './Notes';
import Profile from './Profile';
import Predict from './Predict';
import Mentaum from './Mentaum';
import Thewerup from './Thewerup';
import Heeren from './Heeren';
import Upload from './Upload';
import HolidayList from './HolidayList';
import Schedule from './Schedule';
import ThreeDays from './ThreeDays';
import Radeles from './Radeles';
import DeepResearch from './DeepResearch';

function DashboardRoutes() {
  return useRoutes([
    {
      element: <Layout />,
      children: [
        { index: true, element: <CalendarView /> },
        { path: 'calendar', element: <CalendarView /> },
        { path: 'notes', element: <Notes /> },
        { path: 'profile', element: <Profile /> },
        { path: 'predict', element: <Predict /> },
        { path: 'mentaum', element: <Mentaum /> },
        { path: 'thewerup', element: <Thewerup /> },
        { path: 'heeren', element: <Heeren /> },
        { path: 'upload', element: <Upload /> },
        { path: 'holidays', element: <HolidayList /> },
        { path: 'schedule', element: <Schedule /> },
        { path: 'three-days', element: <ThreeDays /> },
        { path: 'radeles', element: <Radeles /> },
        { path: 'deep-research', element: <DeepResearch /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
}

function Dashboard() {
  const routes = DashboardRoutes();

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-hidden">{routes}</main>
    </div>
  );
}

export default Dashboard;
