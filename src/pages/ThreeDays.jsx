// src/pages/ThreeDays.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import TimelineModal from '@/components/modals/TimelineModal';
import ChooseTypeModal from '@/components/modals/ChooseTypeModal';
import AddTitleModal from '@/components/modals/AddTitleModal';
import { Trash2, Plus, X, Briefcase, CalendarPlus, MapPin, Ban, Folder } from 'lucide-react';
import { ensureAuth } from '@/lib/auth';
import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useTasks } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';

const HOURS_START = 6;
const HOURS_END = 23;
const DEFAULT_DURATION_MIN = Number(import.meta.env.VITE_DEFAULT_EVENT_DURATION_MINUTES || 60);

const INITIAL_TAB_BY_TYPE = {
  event: 'Event',
  task: 'Task',
  project: 'Project',
  appointment: 'Event',
  working: 'Working Location',
  outofoffice: 'Out of Office',
  out_of_office: 'Out of Office',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(hour) {
  return dayjs().hour(hour).minute(0).format('h A');
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildThreeDayWindow(base) {
  const mid = startOfDay(base);
  const prev = new Date(mid);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(mid);
  next.setDate(next.getDate() + 1);
  return [prev, mid, next];
}

function hourLabel(hour) {
  return dayjs().hour(hour).minute(0).format('h A');
}

export default function ThreeDays() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks } = useTasks();

  const [baseDate, setBaseDate] = useState(() => startOfDay(new Date()));
  const days = useMemo(() => buildThreeDayWindow(baseDate), [baseDate]);
  const hours = useMemo(
    () => Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, idx) => HOURS_START + idx),
    []
  );

  const [events, setEvents] = useState([]);
  const [bars, setBars] = useState([]);
  const [draft, setDraft] = useState(null);
  const [ignoreNextDraftClick, setIgnoreNextDraftClick] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [chosenType, setChosenType] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [chosenFabType, setChosenFabType] = useState('event');
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [activeBarId, setActiveBarId] = useState(null);
  const gridRef = useRef(null);
  const nowRef = useRef(null);
  const hourRowHeight = 64;

  const loadEvents = useCallback(async () => {
    if (!user?.firebase_uid) return;
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('firebase_uid', user.firebase_uid);

      if (error) throw error;

      const mapped = (data || []).map((row) => ({
        id: row.id,
        title: row.title || '(No title)',
        description: row.description || '',
        start: row.start_time ? new Date(row.start_time) : row.start ? new Date(row.start) : new Date(),
        end: row.end_time
          ? new Date(row.end_time)
          : row.end
          ? new Date(row.end)
          : row.start_time
          ? new Date(new Date(row.start_time).getTime() + DEFAULT_DURATION_MIN * 60000)
          : new Date(),
        category: row.category || 'event',
        isTask: false,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error('Failed to load events', err);
      toast.error('Failed to load events');
    }
  }, [user?.firebase_uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const taskEvents = useMemo(() => {
    return (tasks || [])
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.name || '(Task)',
        description: task.description || '',
        start: new Date(task.dueDate),
        end: new Date(new Date(task.dueDate).getTime() + DEFAULT_DURATION_MIN * 60000),
        category: 'task',
        isTask: true,
      }));
  }, [tasks]);

  const dayStarts = useMemo(() => days.map((d) => {
    const start = new Date(d);
    start.setHours(HOURS_START, 0, 0, 0);
    return start;
  }), [days]);

  const dayEnds = useMemo(() => days.map((d) => {
    const end = new Date(d);
    end.setHours(HOURS_END, 0, 0, 0);
    return end;
  }), [days]);

  const allBars = useMemo(() => {
    const entries = [...events, ...taskEvents, ...bars];
    const result = [];

    entries.forEach((entry) => {
      const dayIdx = days.findIndex((day) => dayjs(entry.start).isSame(day, 'day'));
      if (dayIdx === -1) return;

      const start = normalizeDate(entry.start);
      const end = normalizeDate(entry.end ?? new Date(entry.start.getTime() + DEFAULT_DURATION_MIN * 60000));

      if (end <= dayStarts[dayIdx] || start >= dayEnds[dayIdx]) return;

      const startMinutes = Math.max(0, Math.round((start - dayStarts[dayIdx]) / 60000));
      const durationMinutes = Math.max(
        30,
        Math.min(Math.round((end - start) / 60000) || DEFAULT_DURATION_MIN, (HOURS_END - HOURS_START) * 60 - startMinutes)
      );

      result.push({
        id: entry.id,
        title: entry.title,
        start,
        end,
        dayIdx,
        startMinutes,
        durationMinutes,
        category: entry.category || (entry.isTask ? 'task' : 'event'),
        isTask: !!entry.isTask,
        isDraft: false,
      });
    });

    if (draft) {
      const dayIdx = draft.dayIdx;
      if (dayIdx != null && dayIdx >= 0 && dayIdx < days.length) {
        const start = normalizeDate(draft.start);
        const end = normalizeDate(draft.end ?? new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000));
        const startMinutes = Math.max(0, Math.round((start - dayStarts[dayIdx]) / 60000));
        const durationMinutes = Math.max(
          30,
          Math.min(Math.round((end - start) / 60000) || DEFAULT_DURATION_MIN, (HOURS_END - HOURS_START) * 60 - startMinutes)
        );

        result.push({
          id: draft.id,
          title: 'New slot',
          start,
          end,
          dayIdx,
          startMinutes,
          durationMinutes,
          category: draft.category || 'event',
          isDraft: true,
          isTask: false,
        });
      }
    }

    return result;
  }, [events, taskEvents, bars, days, dayStarts, draft]);

  const resetDraft = useCallback(() => {
    setDraft(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setChosenType(null);
    setIgnoreNextDraftClick(false);
    setShowTimelineModal(false);
    setShowTypeModal(false);
    setShowAddModal(false);
  }, []);

  const handleCellClick = useCallback((dayIdx, hour) => {
    const dayBase = new Date(days[dayIdx]);
    const start = new Date(dayBase);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000);

    setDraft({
      id: 'draft-slot',
      dayIdx,
      start,
      end,
      category: 'event',
    });
    setSelectedDate(start);
    setSelectedTime(null);
    setChosenType(null);
    setIgnoreNextDraftClick(true);
    setShowTimelineModal(false);
    setShowTypeModal(false);
    setShowAddModal(false);
  }, [days]);

  const handleBarClick = useCallback((bar) => {
    if (bar.isDraft) {
      if (ignoreNextDraftClick) {
        setIgnoreNextDraftClick(false);
        return;
      }
      setSelectedDate(bar.start);
      setShowTimelineModal(true);
    }
  }, [ignoreNextDraftClick]);

  const handleDeleteBar = useCallback((barId) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== barId));
    if (draft?.id === barId) {
      resetDraft();
    }
  }, [draft, resetDraft]);

  const handleTimelineConfirm = useCallback((timeValue) => {
    if (!draft || !selectedDate) return;

    const [hour = 0, minute = 0] = timeValue.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(hour, minute || 0, 0, 0);
    const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000);

    setDraft((prev) => (prev ? { ...prev, start, end } : prev));
    setSelectedDate(start);
    setSelectedTime(timeValue);
    setShowTimelineModal(false);
    setShowTypeModal(true);
  }, [draft, selectedDate]);

  const handleChooseType = useCallback((type) => {
    setChosenType(type);
    setDraft((prev) => (prev ? { ...prev, category: type || prev.category } : prev));
    setShowTypeModal(false);
    setShowAddModal(true);
  }, []);

  const handleAddModalClose = useCallback(() => {
    resetDraft();
  }, [resetDraft]);

  const refreshAfterSave = useCallback(async () => {
    await loadEvents();
    resetDraft();
  }, [loadEvents, resetDraft]);

  const handlePrev = useCallback(() => {
    setBaseDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 3);
      return d;
    });
  }, []);

  const handleNext = useCallback(() => {
    setBaseDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 3);
      return d;
    });
  }, []);

  const initialTab = useMemo(() => {
    if (!chosenType) return 'Event';
    return INITIAL_TAB_BY_TYPE[chosenType] || 'Event';
  }, [chosenType]);

  const handleDelete = async (id) => {
    try {
      if (!user?.firebase_uid) {
        toast.error('You must be logged in to delete events');
        return;
      }

      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('firebase_uid', user.firebase_uid);

      if (error) throw error;

      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error('Failed to delete event:', e);
      toast.error(e.message || 'Failed to delete event');
    }
  };

  // 3️⃣ Persist title edits to Supabase (or update local temp bar)
  const saveTitle = async (barId, title) => {
    try {
      if (!user?.firebase_uid) {
        toast.error('You must be logged in to save changes');
        return;
      }

      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const bar = allBars.find((b) => b.id === barId);
      if (!bar) return;

      if (bar.isPersisted) {
        const { error } = await supabase
          .from('calendar_events')
          .update({ title })
          .eq('id', barId)
          .eq('firebase_uid', user.firebase_uid);

        if (error) throw error;
        setEvents((prev) => prev.map((ev) => (ev.id === bar.id ? { ...ev, title } : ev)));
      } else {
        setBars((prev) => prev.map((b) => (b.id === bar.id ? { ...b, title } : b)));
      }
    } catch (e) {
      console.error('Failed to save title:', e);
      toast.error(e.message || 'Failed to save title');
    }
  };

  const openAddTaskForBar = useCallback(
    (bar) => {
      const d = new Date(days[bar.dayIdx]);
      const startAbsMinutes = HOURS_START * 60 + bar.startMinutes; // minutes from midnight
      const startDate = new Date(d);
      startDate.setHours(Math.floor(startAbsMinutes / 60), startAbsMinutes % 60, 0, 0);
      const endAbsMinutes = startAbsMinutes + bar.durationMinutes;
      const endDate = new Date(d);
      endDate.setHours(Math.floor(endAbsMinutes / 60), endAbsMinutes % 60, 0, 0);
      setSelectedDate(startDate);
      setSelectedTime(`${dayjs(startDate).format('h:mm A')} - ${dayjs(endDate).format('h:mm A')}`);
      setActiveBarId(bar.id);
      setShowAddTitle(true);
    },
    [days]
  );

  const onResizeStart = (e, barId) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    setActiveBarId(barId);
    const bar = bars.find((b) => b.id === barId);
    if (!bar) return;
    const startHeight = (bar.durationMinutes / 60) * hourRowHeight;

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      const minutesDelta = Math.round((dy / hourRowHeight) * 60);
      const newDuration = Math.max(
        30,
        Math.min(
          (HOURS_END - HOURS_START) * 60 - bar.startMinutes,
          Math.round((bar.durationMinutes + minutesDelta) / 15) * 15
        )
      );
      setBars((prev) =>
        prev.map((b) => (b.id === barId ? { ...b, durationMinutes: newDuration } : b))
      );
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f5f0] text-slate-900">
      {/* Header */}
      <div className="px-4 py-5 bg-gradient-to-r from-[#ff6f61] via-[#f97316] to-[#8b5cf6] text-white shadow-md">
        <div className="relative max-w-6xl mx-auto">
          {/* Left and Right controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-[0.35em] text-white/90">
              3 DAYS
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-md text-sm border border-white/20 bg-white/15 text-white hover:bg-white/25 transition"
            >
              Back
            </button>
          </div>
          {/* Centered days */}
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
            <div className="flex items-end gap-6 pointer-events-auto">
              {days.map((d, idx) => {
                const isToday = new Date().toDateString() === d.toDateString();
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`text-xs font-medium ${isToday ? 'text-white' : 'text-white/70'}`}>
                      {dayNames[d.getDay()]}
                    </div>
                    <div
                      className={`mt-1 w-9 h-9 flex items-center justify-center rounded-full text-base font-semibold ${isToday ? 'bg-white text-[#ff6f61]' : 'bg-white/15 text-white'}`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Nav row */}
        <div className="max-w-6xl mx-auto mt-4 flex items-center justify-end gap-2">
          <button
            className="px-3 py-1.5 rounded-md text-sm border border-white/20 bg-white/15 text-white hover:bg-white/25 transition"
            onClick={() =>
              setBaseDate((d) => {
                const nd = new Date(d);
                nd.setDate(nd.getDate() - 3); // window shift back 3 days (e.g., Sat-Sun-Mon -> Tue-Wed-Thu when going forward)
                return nd;
              })
            }
          >
            ◀ Prev
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm border border-white/20 bg-white/15 text-white hover:bg-white/25 transition"
            onClick={() =>
              setBaseDate((d) => {
                const nd = new Date(d);
                nd.setDate(nd.getDate() + 3); // window shift forward 3 days
                return nd;
              })
            }
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="flex-1 overflow-auto">
        <div
          className="max-w-6xl mx-auto grid bg-white rounded-2xl shadow-sm border border-orange-100"
          style={{ gridTemplateColumns: '80px repeat(3, 1fr)' }}
        >
          {/* Sticky column headers for each day */}
          <div className="sticky top-0 z-10 bg-white border-b border-orange-100 rounded-tl-2xl" />
          {days.map((d, idx) => (
            <div
              key={`head-${idx}`}
              className={`sticky top-0 z-10 bg-white border-b border-orange-100 py-3 text-center ${idx === days.length - 1 ? 'rounded-tr-2xl' : ''}`}
            >
              <div className="text-xs uppercase tracking-wide text-orange-500 font-semibold">
                {dayNames[d.getDay()]}
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {d.getDate()} {d.toLocaleDateString(undefined, { month: 'short' })}
              </div>
            </div>
          ))}
          {/* Time column */}
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="h-16 flex items-start justify-end pr-3">
                <span className="text-xs text-slate-500">{formatHour(h)}</span>
              </div>
            ))}
          </div>
          {/* Day columns */}
          {days.map((d, dIdx) => (
            <div key={dIdx} className="relative">
              {/* Hour rows */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-16 border-t border-l first:border-l-0 border-orange-100/70 hover:bg-orange-50 cursor-pointer"
                  onClick={() => handleCellClick(dIdx, h)}
                  title={`Add at ${formatHour(h)}`}
                />
              ))}

              {/* Bars for this day (DB events + local selections) */}
              {allBars
                .filter((b) => b.dayIdx === dIdx)
                .map((bar) => {
                  const top = (bar.startMinutes / 60) * hourRowHeight;
                  const height = Math.max(24, (bar.durationMinutes / 60) * hourRowHeight);
                  const dDate = new Date(days[dIdx]);
                  const startAbsMin = HOURS_START * 60 + bar.startMinutes;
                  const startDate = new Date(dDate);
                  startDate.setHours(Math.floor(startAbsMin / 60), startAbsMin % 60, 0, 0);
                  const endDate = new Date(dDate);
                  const endAbsMin = startAbsMin + bar.durationMinutes;
                  endDate.setHours(Math.floor(endAbsMin / 60), endAbsMin % 60, 0, 0);
                  const timeLabel = `${dayjs(startDate).format('h:mm A')} - ${dayjs(endDate).format('h:mm A')}`;

                  return (
                    <div
                      key={bar.id}
                      className="absolute left-2 right-2 rounded-md text-white shadow-md cursor-pointer group"
                      style={{ top, height, backgroundColor: '#3b82f6' }}
                      onClick={() => openAddTaskForBar(bar)}
                    >
                      <button
                        className="absolute top-1 right-1 p-1 rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (bar.isDraft) {
                            resetDraft();
                            return;
                          }

                          if (bar.isPersisted) {
                            try {
                              if (!user?.firebase_uid) {
                                toast.error('You must be logged in to delete events');
                                return;
                              }

                              const token = await ensureAuth(user);
                              if (!token) throw new Error('Authentication failed');

                              const { error } = await supabase
                                .from('calendar_events')
                                .delete()
                                .eq('id', bar.id)
                                .eq('firebase_uid', user.firebase_uid);

                              if (!error) {
                                setEvents((prev) => prev.filter((ev) => ev.id !== bar.id));
                              }
                            } catch (e) {
                              console.error('Failed to delete event:', e);
                              toast.error(e.message || 'Failed to delete event');
                            }
                          }
                          setBars((prev) => prev.filter((b) => b.id !== bar.id));
                        }}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                      <div className="px-2 py-1 text-xs font-medium truncate">
                        {bar.title || '(No title)'}
                      </div>
                      <div className="px-2 pb-1 text-[11px] opacity-90">{timeLabel}</div>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                        onMouseDown={(e) => onResizeStart(e, bar.id)}
                        title="Drag to resize"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  );
                })}

              {/* Current time indicator when column is today */}
              {new Date().toDateString() === d.toDateString() && (
                <CurrentTimeLine ref={dIdx === 1 ? nowRef : null} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      {/* FAB Menu */}
      {showFabMenu && (
        <div className="fixed right-6 bottom-24 flex flex-col gap-2 z-20">
          <FabItem
            icon={<Folder className="h-4 w-4" />}
            label="Project"
            onClick={() => {
              setChosenFabType('project');
              setShowTimeline(true);
              setShowFabMenu(false);
            }}
            color="bg-gray-800"
          />
          <FabItem
            icon={<Ban className="h-4 w-4" />}
            label="Out Of Office"
            onClick={() => {
              setChosenFabType('outofoffice');
              setShowTimeline(true);
              setShowFabMenu(false);
            }}
            color="bg-red-600"
          />
          <FabItem
            icon={<MapPin className="h-4 w-4" />}
            label="Working Location"
            onClick={() => {
              setChosenFabType('working');
              setShowTimeline(true);
              setShowFabMenu(false);
            }}
            color="bg-purple-600"
          />
          <FabItem
            icon={<Briefcase className="h-4 w-4" />}
            label="Tasks"
            onClick={() => {
              setChosenFabType('task');
              setShowTimeline(true);
              setShowFabMenu(false);
            }}
            color="bg-green-600"
          />
          <FabItem
            icon={<CalendarPlus className="h-4 w-4" />}
            label="Events"
            onClick={() => {
              setChosenFabType('event');
              setShowTimeline(true);
              setShowFabMenu(false);
            }}
            color="bg-blue-600"
          />
        </div>
      )}
      <button
        aria-label={showFabMenu ? 'Close' : 'Add'}
        onClick={() => setShowFabMenu((v) => !v)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full text-white text-3xl shadow-lg flex items-center justify-center ${showFabMenu ? 'bg-gray-700 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {showFabMenu ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Timeline picker after FAB selection */}
      {showTimeline && (
        <TimelineModal
          isOpen={showTimeline}
          selectedDate={dayjs(days[1]).format('YYYY-MM-DD')}
          onClose={() => setShowTimeline(false)}
          onConfirm={(time) => {
            setSelectedDate(new Date(days[1]));
            setSelectedTime(time);
            setShowTimeline(false);
            setShowAddTitle(true);
          }}
        />
      )}

      {/* Add Task modal */}
      {showAddTitle && (
        <AddTitleModal
          isOpen={showAddTitle}
          onClose={() => setShowAddTitle(false)}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          initialTab={chosenFabType}
          visibleTabs={['event', 'task', 'working', 'outofoffice', 'project']}
          headerMode="simple"
          titleText="Add Tasks"
          refreshCalendar={() => {}}
          onSave={(title) => saveTitle(activeBarId, title)}
        />
      )}
    </div>
  );
}

function FabItem({ icon, label, onClick, color = 'bg-blue-600' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-white ${color} hover:opacity-90 shadow-md rounded-full px-3 py-2`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

const CurrentTimeLine = React.forwardRef(function CurrentTimeLine(_, ref) {
  // Position within the grid based on current time between 10AM-8PM
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutesFromStart = (hour - HOURS_START) * 60 + minutes;
  const clamped = Math.max(0, Math.min((HOURS_END - HOURS_START) * 60, totalMinutesFromStart));
  // Each hour row is 64px tall (h-16), so 1 minute ~ 64 / 60 px
  const top = (clamped / 60) * 64;

  return (
    <div ref={ref} className="absolute left-0 right-0" style={{ top }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#76B3F7' }} />
        <div className="flex-1 h-px" style={{ backgroundColor: '#FFFFFF' }} />
      </div>
    </div>
  );
});
