// src/pages/TasksBoard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Badge = ({ children, color = 'gray' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`}
  >
    {children}
  </span>
);

const Card = ({
  title,
  subtitle,
  badge,
  badgeColor,
  footer,
  avatarUrl,
  onPrimary,
  primaryLabel,
}) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition relative">
    {badge && (
      <div className="mb-2">
        <Badge color={badgeColor}>{badge}</Badge>
      </div>
    )}
    <div className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</div>
    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{subtitle}</div>

    <div className="flex items-center justify-between mt-4">
      <button
        type="button"
        className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        onClick={onPrimary}
      >
        {primaryLabel}
      </button>
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-gray-200" />
      )}
    </div>

    {footer && <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">{footer}</div>}
  </div>
);

// src/pages/TasksBoard.jsx
export default function TasksBoard() {
  return <h1>✅ Tasks Board Loaded</h1>;
}
