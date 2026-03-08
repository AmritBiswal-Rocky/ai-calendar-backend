// src/pages/HolidayList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { ensureAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { initGoogleCalendar, fetchIndianHolidays } from '@/api/googleCalendar';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import UserBadge from '@/components/UserBadge';

export default function HolidayList() {
  const navigate = useNavigate();
  const { user, profile } = useAuth?.() || {};
  const userId = user?.firebase_uid || profile?.id || null;

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ title: '', date: '' });
  const [saving, setSaving] = useState(false);
  const [syncType, setSyncType] = useState('personal'); // personal | business
  const [createType, setCreateType] = useState('personal'); // personal | business
  const [googleError, setGoogleError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      // Try cache first for instant paint
      try {
        const cached = sessionStorage.getItem(`holidays:${year}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.items)) {
            setHolidays(parsed.items);
            setLoading(false);
          }
        }
      } catch {}
      try {
        // Try Google Calendar API first
        await initGoogleCalendar();
        const items = await fetchIndianHolidays(year);
        const normalized = (items || []).map((ev) => ({
          date: ev?.start?.date || ev?.start?.dateTime?.slice(0, 10) || '',
          name: ev?.summary || 'Holiday',
          localName: ev?.summary || 'Holiday',
          source: 'google',
        }));
        if (normalized.length) {
          setHolidays(normalized);
          try {
            sessionStorage.setItem(
              `holidays:${year}`,
              JSON.stringify({ ts: Date.now(), items: normalized })
            );
          } catch {}
          setLoading(false);
          return;
        }
        // fall through to fallback if empty
        setGoogleError(
          'Google returned no holidays — check API key, calendar ID, or referrer restrictions.'
        );
      } catch (err) {
        // Google API could fail if env keys missing; we'll fallback
        setGoogleError(
          'Google Calendar API failed — verify VITE_GOOGLE_API_KEY, enable Calendar API, and referrer restrictions.'
        );
      }

      // Fallback to Nager public holidays
      try {
        const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
        const mapped = (res.data || []).map((h) => ({
          date: h.date,
          name: h.name,
          localName: h.localName || h.name,
          source: 'nager',
        }));
        setHolidays(mapped);
        try {
          sessionStorage.setItem(
            `holidays:${year}`,
            JSON.stringify({ ts: Date.now(), items: mapped })
          );
        } catch {}
      } catch (err) {
        console.error('Error fetching holidays:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [year]);

  const createHoliday = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Please login to add a holiday');
      return;
    }
    if (!newHoliday.title.trim() || !newHoliday.date) {
      toast.error('Title and date are required');
      return;
    }
    
    setSaving(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');
      
      const startIso = new Date(newHoliday.date).toISOString();
      const { data, error } = await supabase
        .from('calendar_events')
        .upsert({
          title: newHoliday.title.trim(),
          description: 'Custom holiday',
          start_time: startIso,
          end_time: startIso,
          category: createType === 'business' ? 'holiday_business' : 'holiday_personal',
          color: 'green',
          firebase_uid: user.firebase_uid,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setNewHoliday({ title: '', date: '' });
      setCreateOpen(false);
      toast.success('Holiday created successfully');
      return data;
    } catch (err) {
      console.error('Failed to create holiday:', err);
      toast.error(err.message || 'Failed to create holiday');
      throw err;
      alert('Failed to create holiday');
    } finally {
      setSaving(false);
    }
  };

  const syncAllHolidays = async () => {
    if (!userId) return alert('Please login to sync holidays.');
    if (!Array.isArray(holidays) || holidays.length === 0) return alert('No holidays to sync.');
    try {
      const payload = holidays
        .filter((h) => h?.date)
        .map((h) => {
          const iso = new Date(h.date).toISOString();
          return {
            title: (h.localName || h.name || 'Holiday').trim(),
            description: `Imported ${h.source === 'google' ? 'from Google Holidays' : 'from Nager'}`,
            start_time: iso,
            end_time: iso,
            category: syncType === 'business' ? 'holiday_business' : 'holiday_personal',
            color: 'green',
            firebase_uid: userId,
          };
        });
      if (payload.length === 0) return alert('No valid holiday dates found.');
      const { error } = await supabase
        .from('calendar_events')
        .upsert(payload, { returning: 'minimal' });
      if (error) throw error;
      alert(`Synced ${payload.length} holidays to your calendar as ${syncType}.`);
    } catch (err) {
      console.error(err);
      alert('Failed to sync holidays');
    }
  };

  return (
    <div className="p-6">
      <UserBadge className="mb-3" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-2 py-1 rounded border hover:bg-gray-50 text-sm"
            title="Back"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">🎉 Holiday List</h1>
          <div className="flex items-center gap-2 ml-2">
            <label className="text-sm text-gray-600">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 border rounded px-2"
            >
              {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sync as</label>
            <select
              value={syncType}
              onChange={(e) => setSyncType(e.target.value)}
              className="h-9 border rounded px-2"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
            <button
              className="px-3 py-2 rounded border hover:bg-gray-50"
              onClick={syncAllHolidays}
              type="button"
            >
              ⟳ Sync All
            </button>
          </div>

          {googleError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              {googleError}
            </div>
          )}
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setCreateOpen((v) => !v)}
            type="button"
          >
            + Add Holiday
          </button>
        </div>
      </div>

      {createOpen && (
        <form
          onSubmit={createHoliday}
          className="mb-6 p-4 border rounded bg-white max-w-md space-y-3"
        >
          <div>
            <label className="text-sm block mb-1">Title</label>
            <input
              type="text"
              value={newHoliday.title}
              onChange={(e) => setNewHoliday((s) => ({ ...s, title: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Office Closed - Festival"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Date</label>
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday((s) => ({ ...s, date: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Type</label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded border"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-200" />
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <p>No holidays found.</p>
      ) : (
        <ul className="relative border-l border-gray-300">
          {holidays.map((holiday, idx) => (
            <li key={`${holiday.date}-${idx}`} className="mb-6 ml-6">
              <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-1.5 border border-white"></div>
              <time className="block text-sm text-gray-500">{holiday.date}</time>
              <h3 className="text-lg font-semibold">{holiday.localName || holiday.name}</h3>
              {holiday.name && holiday.localName && holiday.name !== holiday.localName && (
                <p className="text-gray-600">{holiday.name}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Source: {holiday.source}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
