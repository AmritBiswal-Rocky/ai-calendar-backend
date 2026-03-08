// ─────────────────────────────────────────────
// src/components/Calendar/CalendarHeader.jsx
// MERGED ADVANCED HEADER (FINAL STABLE VERSION)
// ─────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export default function CalendarHeader({
  date,
  setDate,
  view = 'month',
  setView,
  searchTerm = '',
  setSearchTerm = () => {},
  onAddEvent = () => {},
  onSave = () => {},
  activeTab = 'calendar',
  setActiveTab = () => {},
}) {
  function MenuItem({ icon, label, onClick }) {
    return (
      <div
        onClick={onClick}
        className="
          flex items-center gap-3
          px-4 py-2
          text-gray-700
          text-sm
          rounded-lg
          cursor-pointer
          hover:bg-orange-50
          transition
        "
      >
        <span className="w-5 text-gray-500">{icon}</span>
        <span className="flex-1">{label}</span>
      </div>
    );
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const goPrev = () => {
    const unit = view === 'month' ? 'month' : view;
    setDate(moment(date).subtract(1, unit).toDate());
  };

  const goNext = () => {
    const unit = view === 'month' ? 'month' : view;
    setDate(moment(date).add(1, unit).toDate());
  };

  const goToday = () => {
    setDate(new Date());
  };

  const changeMonth = (monthName) => {
    const monthIndex = moment().month(monthName).month();
    setDate(moment(date).month(monthIndex).toDate());
  };

  const handleMenuAction = (viewName) => {
    setView(viewName);
    setMenuOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* MAIN HEADER */}
      <div
        className="
        flex items-center justify-between
        gap-4 px-4 py-2 rounded-xl shadow-lg
        overflow-visible whitespace-nowrap
        mb-2
        "
        style={{
          background: 'linear-gradient(90deg,#fb923c 0%,#ec4899 45%,#8b5cf6 100%)',
        }}
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* MENU */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white text-xl px-2"
            >
              ☰
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                onClick={() => setMenuOpen(false)}
                className="
                  absolute top-14 left-4
                  w-72
                  rounded-2xl
                  shadow-2xl
                  border border-orange-100
                  overflow-hidden
                  z-50
                "
                style={{
                  background: "linear-gradient(180deg,#fffaf3 0%,#f8f5f0 100%)"
                }}
              >
                {/* CALENDAR OPTIONS */}
                <div className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Calendar
                </div>
                <div className="py-2">
                  <MenuItem icon="📅" label="Holiday List (India)" />

                  <MenuItem icon="🕒" label="Schedule" onClick={() => { navigate("/schedule"); setMenuOpen(false); }} />
                </div>

                <div className="border-t border-orange-100 my-2" />

                {/* VIEWS */}
                <div className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Views
                </div>
                <div className="py-2">
                  <MenuItem icon="📅" label="Days" onClick={() => handleMenuAction("day")} />

                  <MenuItem icon="📅" label="3 Days" />

                  <MenuItem icon="📅" label="Week" onClick={() => handleMenuAction("week")} />

                  <MenuItem icon="📅" label="Months" onClick={() => handleMenuAction("month")} />
                </div>

                <div className="border-t border-orange-100 my-2" />

                <div className="py-2">
                  <MenuItem icon="🔄" label="Refresh" />
                </div>

                <div className="border-t border-orange-100 my-2" />

                {/* ACCOUNT */}
                <div className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </div>
                <div className="py-2">
                  <div className="px-4 py-3 text-sm text-gray-600 border-t border-orange-100">
                    mechanisedmarketing@gmail.com
                  </div>

                  <MenuItem icon="📅" label="My Calendar" />

                  <MenuItem icon="✔" label="Tasks" />
                </div>

                <div className="border-t border-orange-100 my-2" />

                {/* EMAIL SECTION */}
                <div className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </div>
                <div className="py-2">
                  <MenuItem icon="➕" label="Add Multiple Emails" />

                  <div className="px-4 py-2 text-sm text-gray-500">
                    • mechanisedmarketing@gmail.com
                    <br />
                    Select | Edit | View
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DATE */}
          <div className="text-white font-semibold text-lg">
            {moment(date).format('dddd, MMMM DD, YYYY')}
          </div>

          {/* MONTH SELECT */}
          <select
            value={moment(date).format('MMMM')}
            onChange={(e) => changeMonth(e.target.value)}
            className="bg-white/90 px-3 py-1 rounded-md text-sm"
          >
            {moment.months().map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* CATEGORY SELECT */}
          <select className="bg-white/90 px-3 py-1 rounded-md text-sm">
            <option>All</option>
            <option>General</option>
            <option>Work</option>
            <option>Personal</option>
          </select>

          {/* SEARCH */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search features, tasks, calendar..."
            className="
              bg-white/90 px-4 py-1 rounded-md text-sm
              min-w-[220px] max-w-[320px]
            "
          />
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ADD EVENT */}
          <button
            onClick={onAddEvent}
            className="
              bg-white text-black
              px-3 py-1 rounded-md
              text-xs font-medium
              hover:bg-gray-100
            "
          >
            + Add Event
          </button>

          {/* SAVE */}
          <button
            onClick={onSave}
            className="
              border border-white
              text-white
              px-3 py-1 rounded-md
              text-xs
            "
          >
            Save
          </button>

          {/* NAVIGATION */}
          <button onClick={goPrev} className="bg-white px-2 py-1 rounded-md text-sm">
            ‹
          </button>

          <button onClick={goToday} className="bg-white px-3 py-1 rounded-md text-sm font-medium">
            Today
          </button>

          <button onClick={goNext} className="bg-white px-2 py-1 rounded-md text-sm">
            ›
          </button>

          {/* PROFILE */}
          <div
            className="
              w-8 h-8 rounded-full
              bg-black text-white
              flex items-center justify-center
              text-sm font-semibold
            "
          >
            U
          </div>
        </div>
      </div>
    </div>
  );
}
