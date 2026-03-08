// HARDENED + DIAGNOSTIC SAFE (NO WHITE SCREEN)
// ---------------------------------------------
//
// src/components/CalendarView.jsx
//
// FINAL STABLE VERSION
// ---------------------------------------------

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import moment from 'moment';
import { Calendar as RBCalendar, momentLocalizer } from 'react-big-calendar';
// import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarView.css';

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Contexts
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

// Backend
import { getFirebaseToken } from '../lib/auth';
import { listUpcomingEvents, fetchIndianHolidays } from '../api/googleCalendar';
import { safeInitGoogleClient } from '../api/googleDriveAuth';

// Components
import TimelineModal from './modals/TimelineModal';
import ChooseTypeModal from './modals/ChooseTypeModal';
import EventModal from './EventModal';
import CustomToolbar from './CustomToolbar';
import Radeles from '../pages/Radeles';
import CreateTypeModal from "./CreateTypeModal";
import CreateEventModal from "./CreateEventModal";
import { logError } from "../utils/logger";
import CalendarHeader from "./calendar/CalendarHeader";

const localizer = momentLocalizer(moment);
// const DnDCalendar = withDragAndDrop(RBCalendar);

const DEFAULT_DURATION_MIN = 60;

const DIAGNOSTIC_FLAGS = Object.freeze({
  logSlotSelections: false,
  logDraftLifecycle: false,
  logEventSelections: false,
});

const SHOW_CATEGORY_FILTER = false;

function diagnosticLog(flagEnabled, ...args) {
  if (!flagEnabled) return;
  try {
    console.debug('[CalendarView]', ...args);
  } catch {
    /* noop - console may be unavailable */
  }
}

const DRAFT_ACTIONS = ['Event', 'Task', 'Proj.', 'Apps'];

// Consistent factory for draft events
function createDraftEvent(start, end) {
  return {
    id: `draft-${Date.now()}`,
    title: 'New slot',
    start,
    end,
    category: 'draft',
    isDraft: true,
  };
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function formatEventTimeRange(start, end) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return '';
  const startLabel = timeFormatter.format(start);

  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return startLabel;

  return `${startLabel} - ${timeFormatter.format(end)}`;
}

function DraftEventCard({ event, onClose, onQuickSelect }) {
  const title = event?.title || 'New slot';
  const timeLabel = formatEventTimeRange(event?.start, event?.end);

  return (
    <div
      className="draft-event-card"
      role="group"
      aria-label="Draft event"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="draft-event-card__header">
        <span className="draft-event-card__title">{title}</span>

        <button
          type="button"
          className="draft-event-card__close"
          aria-label="Dismiss draft"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        >
          ×
        </button>
      </div>

      <div className="draft-event-card__time">{timeLabel}</div>

      <div className="draft-event-card__chips">
        {DRAFT_ACTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="draft-event-card__chip"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onQuickSelect?.(label.toLowerCase());
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function safeDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return d;
}

function getStableDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sameInstant(a, b) {
  const da = safeDate(a);
  const db = safeDate(b);
  if (!da || !db) return false;
  return da.getTime() === db.getTime();
}

function mergeUniqueDrafts(prev, next) {
  const list = Array.isArray(prev) ? prev : [];
  const draft = next && typeof next === 'object' ? next : null;
  if (!draft) return list;

  const draftStart = draft?.start instanceof Date ? draft.start : safeDate(draft?.start);
  if (!draftStart) return list;

  const exists = list.some((d) => sameInstant(d?.start, draftStart));
  if (exists) return list;
  return [...list, { ...draft, start: draftStart }];
}

function buildDraftFromSlot(slotInfo) {
  const start = safeDate(slotInfo?.start);
  const rawEnd = safeDate(slotInfo?.end);
  const end = rawEnd || (start ? new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000) : null);

  if (!start || !end) return null;

  return {
    id: getStableDraftId(),
    title: 'New slot',
    description: '',
    start,
    end,
    category: 'draft',
    isDraft: true,
  };
}

function safeString(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function safeLower(value, fallback = '') {
  return safeString(value, fallback).toLowerCase();
}

function clampNumber(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function isTimeGridView(view) {
  return view === Views.WEEK || view === Views.DAY;
}

function normalizeDraftAction(action) {
  const a = safeLower(action);
  if (!a) return 'event';
  if (a === 'proj.' || a === 'proj' || a === 'project') return 'proj';
  if (a === 'apps' || a === 'app') return 'apps';
  if (a === 'task' || a === 'tasks') return 'task';
  if (a === 'event' || a === 'events') return 'event';
  return a;
}

function mapDraftActionToCategory(action) {
  const a = normalizeDraftAction(action);
  if (a === 'task') return 'task';
  if (a === 'proj') return 'proj';
  if (a === 'apps') return 'apps';
  return 'general';
}

function deriveDraftTitle(action) {
  const a = normalizeDraftAction(action);
  if (a === 'task') return 'New task';
  if (a === 'proj') return 'New project';
  if (a === 'apps') return 'New application';
  return 'New event';
}

function makeAdvancedModalSeedFromDraft(draft, chosenType) {
  const start = safeDate(draft?.start);
  const end = safeDate(draft?.end) || start;
  if (!start || !end) return null;

  const type = chosenType ? normalizeDraftAction(chosenType) : null;
  const category = type
    ? mapDraftActionToCategory(type)
    : normalizeCategory(draft?.category || 'general');

  return {
    id: null,
    title: '',
    description: '',
    start,
    end,
    category,
    color: 'blue',
  };
}

function ensureDateOrder(start, end) {
  const s = safeDate(start);
  const e = safeDate(end);
  if (!s) return { start: null, end: null };
  if (!e) return { start: s, end: s };
  if (e.getTime() < s.getTime()) return { start: e, end: s };
  return { start: s, end: e };
}

function coerceEventRange(ev) {
  if (!ev || typeof ev !== 'object') return null;
  const range = ensureDateOrder(ev.start, ev.end);
  if (!range.start || !range.end) return null;
  return { ...ev, start: range.start, end: range.end };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqById(list) {
  const seen = new Set();
  const out = [];
  for (const item of safeArray(list)) {
    const id = item?.id;
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

const CATEGORY_COLORS = {
  general: { bg: '#eef2ff', text: '#1e3a8a', accent: '#6366f1' },
  event: { bg: '#ecfeff', text: '#155e75', accent: '#06b6d4' },
  task: { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  proj: { bg: '#ecfccb', text: '#365314', accent: '#84cc16' },
  apps: { bg: '#fae8ff', text: '#701a75', accent: '#d946ef' },
};

function getCategoryColors(category) {
  const key = String(category || 'general').toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.general;
}

class CalendarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    logError(err, "Calendar Load");
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-center">Calendar failed to render. Please refresh.</div>;
    }
    return this.props.children;
  }
}

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */
function taskToEvent(task) {
  const start =
    task?.dueDate && !Number.isNaN(new Date(task.dueDate).getTime())
      ? new Date(task.dueDate)
      : new Date();
  const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000);

  return {
    id: `task-${task.id}`,
    title: task?.name || 'Untitled Task',
    start,
    end,
    allDay: false,
    isTask: true,
    taskId: task.id,
    completed: !!task.completed,
    category: 'task',
  };
}

function toCalendarEvent(row) {
  if (!row) return null;

  const start = row.start_time ? new Date(row.start_time) : null;
  const end = row.end_time ? new Date(row.end_time) : start;

  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null;

  return {
    id: row.id,
    title: row.title || '(untitled)',
    description: row.description || '',
    start,
    end: end instanceof Date && !Number.isNaN(end.getTime()) ? end : start,
    allDay: false,
    category: (row.category || 'general')?.toLowerCase?.() || 'general',
    color: row.color || '#3b82f6',
  };
}

function sanitizeEvents(list) {
  if (!Array.isArray(list)) return [];

  return list.filter(
    (e) =>
      e &&
      typeof e.title === 'string' &&
      e.start instanceof Date &&
      !Number.isNaN(e.start.getTime()) &&
      e.end instanceof Date &&
      !Number.isNaN(e.end.getTime())
  );
}

function normalizeCategory(value) {
  try {
    const raw = String(value || '')
      .trim()
      .toLowerCase();
    if (!raw) return 'all';
    if (raw === 'all') return 'all';
    if (raw === 'general') return 'general';
    if (raw === 'work') return 'work';
    if (raw === 'personal') return 'personal';
    if (raw === 'urgent') return 'urgent';
    if (raw === 'study') return 'study';
    if (raw === 'task') return 'task';
    if (raw === 'draft') return 'draft';
    return raw;
  } catch {
    return 'all';
  }
}

function getCategoryTheme(category) {
  const c = normalizeCategory(category);

  switch (c) {
    case 'urgent':
      return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)', text: '#7f1d1d' };
    case 'work':
      return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.16)', text: '#1e3a8a' };
    case 'personal':
      return { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.16)', text: '#581c87' };
    case 'study':
      return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)', text: '#78350f' };
    case 'task':
      return { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.16)', text: '#14532d' };
    case 'general':
    default:
      return { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.14)', text: '#111827' };
  }
}

function eventStyleGetter(event) {
  if (event?.isDraft) {
    return {
      style: {
        backgroundColor: 'transparent',
        color: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
      },
      className: 'rbc-draft-event',
    };
  }

  const theme = getCategoryTheme(event?.category);

  return {
    style: {
      backgroundColor: theme.bg,
      color: theme.text,
      borderLeft: `6px solid ${theme.border}`,
      borderRadius: 10,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 4,
      paddingBottom: 4,
      fontWeight: 600,
      boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };
}

function DraftEventRenderer() {
  return <div className="calendar-draft-bar" />;
}

function DefaultEventRenderer(props) {
  return <span>{props?.title || ''}</span>;
}

function DraftTimeSlotWrapper({ children, value, draftEvents, onOpenDraft, onCloseDraft }) {
  const slotTime = value instanceof Date ? value.getTime() : null;

  const draftsInThisSlot = Array.isArray(draftEvents)
    ? draftEvents.filter((d) => {
        const t = d?.start instanceof Date ? d.start.getTime() : null;
        return t && slotTime && t === slotTime;
      })
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
    </div>
  );
}

/* --------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */
const CalendarRadelesToggle = ({ active, setActive }) => {
  return (
    <div className="flex items-center bg-gray-200 p-1 rounded-full shadow-inner">
      <button
        onClick={() => setActive("calendar")}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          active === "calendar"
            ? "bg-indigo-600 text-white shadow-md"
            : "text-gray-600"
        }`}
      >
        Calendar
      </button>

      <button
        onClick={() => setActive("radeles")}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          active === "radeles"
            ? "bg-indigo-600 text-white shadow-md"
            : "text-gray-600"
        }`}
      >
        Radeles
      </button>
    </div>
  );
};

export default function CalendarView() {
  const [date, setDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month");

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState("");

  const [activeTab, setActiveTab] = useState("calendar");

  const [events, setEvents] = useState([]);
  const [draftEvent, setDraftEvent] = useState(null);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  useEffect(() => {
    if (calendarView === "day") {
      setDraftEvent(null);
    }
  }, [calendarView]);

  // 🔹 HANDLE SLOT SELECTION
  const handleSelectSlot = ({ start, end }) => {
    setDraftEvent(null);

    const draft = {
      id: "draft",
      title: "",
      start,
      end,
      isDraft: true,
      allDay: calendarView === "month"
    };

    setDraftEvent(draft);
  };

  // 🔹 HANDLE DRAFT CLICK
  const handleDraftClick = (event) => {

    if (!event.isDraft) return;

    if (calendarView === "month") {
      setCalendarView("day");
      return;
    }

    if (calendarView === "day") {
      setShowCreateTypeModal(true);
    }
  };

  // 🔹 HANDLE EVENT CLICK
  const handleSelectEvent = (event) => {

    if (!event.isDraft) return;

    // MONTH VIEW → open day view
    if (calendarView === "month") {

      setCalendarView("day");
      setSelectedDate(event.start);

      return;
    }

    // DAY VIEW → open creation modal
    if (calendarView === "day") {

      setShowCreateTypeModal(true);

    }
  };

  // 🔹 SAVE EVENT
  const handleSaveEvent = () => {
    if (!draftEvent) return;

    const newEvent = {
      ...draftEvent,
      id: Date.now(),
      title: "New Work",
      isDraft: false,
      isSaved: true,
    };

    setEvents((prev) => [...prev, newEvent]);
    setDraftEvent(null);
    setShowCreatePopup(false);
  };

  const handleAddEvent = () => {
    setShowCreatePopup(true);
  };

  const handleSave = () => {
    handleSaveEvent();
  };

  // 🔹 STYLE EVENTS
  const eventStyleGetter = (event) => {
    if (event.isDraft) {
      return {
        style: {
          background: "#3b82f6",
          borderRadius: "8px",
          padding: "4px",
          border: "none",
          color: "white"
        }
      };
    }

    return {};
  };

  const mergedEvents = draftEvent ? [...events, draftEvent] : events;

  const safeEvents = mergedEvents.filter((e) => e.start && e.end);

  const EventComponent = ({ event }) => {
    if (event.isDraft) {
      return <DraftEvent event={event} />;
    }

    return <span>{event.title}</span>;
  };

  function DraftEvent({ event, view, events }) {

    if (!event.isDraft) {
      return <span>{event.title}</span>;
    }

    // DAY VIEW (horizontal layout)
    if (view === "day") {
      return (
        <div className="bg-blue-500 text-white rounded-lg px-3 py-1 w-full flex items-center justify-between">

          <div className="flex items-center gap-3 text-sm">

            <span className="font-semibold">
              New Slot
            </span>

            <span className="opacity-60">|</span>

            <span>
              {moment(event.start).format("hh:mm A")} – {moment(event.end).format("hh:mm A")}
            </span>

            <span className="opacity-60">|</span>

            <span className="font-medium">
              To Do
            </span>

          </div>

          <button className="text-white">
            ×
          </button>

        </div>
      );
    }

    // MONTH VIEW (compact vertical layout)
    const tasksForDay = events.filter(e =>
      moment(e.start).isSame(event.start, "day") && !e.isDraft
    );

    return (
      <div className="bg-blue-500 text-white rounded-md px-2 py-1 text-xs">

        <div className="font-semibold">
          New Slot
        </div>

        <div>
          {moment(event.start).format("hh:mm A")}
        </div>

        <div className="opacity-90 text-[10px] mt-1">
          To Do ({tasksForDay.length})
        </div>

      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div className="calendar-container">
        {/* CALENDAR / RADELES SWITCH */}
        <div className="flex justify-end mt-2 mb-4 pr-4">
          <div className="flex items-center bg-gray-200 rounded-full p-1 shadow-inner">
            {/* Calendar Button */}
            <button
              onClick={() => setActiveTab("calendar")}
              className={`
                px-6 py-2 text-sm font-medium rounded-full transition-all duration-300
                ${
                  activeTab === "calendar"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600"
                }
              `}
            >
              Calendar
            </button>

            {/* Radeles Button */}
            <button
              onClick={() => setActiveTab("radeles")}
              className={`
                px-6 py-2 text-sm font-medium rounded-full transition-all duration-300
                ${
                  activeTab === "radeles"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600"
                }
              `}
            >
              Radeles
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        {activeTab === "calendar" ? (
          <>
            {/* CALENDAR HEADER */}
            <CalendarHeader
              date={date}
              setDate={setDate}
              view={calendarView}
              setView={setCalendarView}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddEvent={handleAddEvent}
              onSave={handleSave}
            />

            {/* CALENDAR GRID */}
            <RBCalendar
              localizer={localizer}
              events={mergedEvents}
              selectable
              toolbar={false}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              view={calendarView}
              onView={(v) => setCalendarView(v)}
              components={{
                event: (props) => (
                  <DraftEvent
                    {...props}
                    view={calendarView}
                    events={mergedEvents}
                  />
                )
              }}
            />
          </>
        ) : (
          <Radeles />
        )}
      </div>

      {showCreateTypeModal && (
        <CreateTypeModal
          onClose={() => setShowCreateTypeModal(false)}
          onCreateEvent={() => {
            setShowCreateTypeModal(false);
            setShowCreateEventModal(true);
          }}
        />
      )}

      {showCreateEventModal && (
        <CreateEventModal
          onClose={() => setShowCreateEventModal(false)}
        />
      )}

    </div>
  );
}
