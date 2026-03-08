// src/components/NavigationBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home as LucideHome,
  Calendar as LucideCalendar,
  FileText as LucideNotes,
  Upload as LucideUpload,
  Brain as LucidePredict,
  User as LucideProfile,
  Settings as LucideSettings,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: LucideHome },
  { to: '/app/calendar', label: 'Calendar', icon: LucideCalendar },
  { to: '/notes', label: 'Notes', icon: LucideNotes },
  { to: '/upload', label: 'Upload', icon: LucideUpload },
  { to: '/predict', label: 'Predict', icon: LucidePredict },
  { to: '/profile', label: 'Profile', icon: LucideProfile },
  { to: '/settings', label: 'Settings', icon: LucideSettings },
];

const NavigationBar = () => {
  return (
    <nav className="bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 w-full z-50">
      <ul className="flex justify-around">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs transition-colors duration-200 ${
                  isActive ? 'text-blue-400' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Icon className="h-6 w-6 mb-1" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavigationBar;
