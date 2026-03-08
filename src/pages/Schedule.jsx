// src/pages/Schedule.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SchedulePage() {
  const navigate = useNavigate();

  const goHolidays = () => navigate('/holidays');
  const goBack = () => navigate(-1);
  const createGeneric = () => {
    navigate('/app/calendar');
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('calendar-open-schedule'));
      } catch {}
    }, 0);
  };
  const createBusiness = () => {
    navigate('/app/calendar');
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('calendar-open-schedule-business'));
      } catch {}
    }, 0);
  };
  const createPersonal = () => {
    navigate('/app/calendar');
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('calendar-open-schedule-personal'));
      } catch {}
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] py-10 px-6 flex justify-center items-start">
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#ff6f61] via-[#f97316] to-[#8b5cf6] px-6 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="uppercase text-xs tracking-[0.45em] text-white/70">Planner Hub</p>
              <h1 className="text-3xl font-semibold mt-1">🗓️ Schedule</h1>
              <p className="text-sm text-white/80 mt-1">
                Jump into holidays or spin up a new schedule template in one click.
              </p>
            </div>
            <button
              type="button"
              onClick={goBack}
              className="self-start md:self-auto inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/15 border border-white/30 text-sm font-medium text-white hover:bg-white/25 transition"
              title="Back"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="px-6 py-8 bg-gradient-to-br from-white via-[#fff7ed] to-[#f0f9ff]">
          <div className="grid gap-4">
            <button
              type="button"
              onClick={goHolidays}
              className="w-full text-left px-5 py-4 rounded-2xl border border-orange-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-base font-semibold text-[#f97316]">🎉 Holiday List</div>
              <p className="text-sm text-slate-600 mt-1">Browse regional breaks and plan ahead.</p>
            </button>
            <button
              type="button"
              onClick={createGeneric}
              className="w-full text-left px-5 py-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-100/80 to-orange-50 text-amber-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-base font-semibold">➕ Create Schedule</div>
              <p className="text-sm text-amber-700/80 mt-1">Launch a fresh, all-purpose schedule template.</p>
            </button>
            <button
              type="button"
              onClick={createBusiness}
              className="w-full text-left px-5 py-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-indigo-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-base font-semibold">🏢 Create Business Schedule</div>
              <p className="text-sm text-indigo-700/80 mt-1">Sync meetings, launches, and team rituals.</p>
            </button>
            <button
              type="button"
              onClick={createPersonal}
              className="w-full text-left px-5 py-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 text-teal-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-base font-semibold">🧑‍💼 Create Personal Schedule</div>
              <p className="text-sm text-teal-700/80 mt-1">Track wellness, goals, and personal commitments.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
