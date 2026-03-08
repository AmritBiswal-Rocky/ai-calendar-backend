// src/components/HolidaySchedule.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function HolidaySchedule({
  year = new Date().getFullYear(),
  countryCode = 'IN',
  onAddToCalendar, // optional callback: (holidayEvent) => void
}) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHolidays() {
      setLoading(true);
      setError(null);
      try {
        // NOTE: endpoint is lowercase path "publicholidays"
        const url = `https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`;
        const res = await axios.get(url);
        if (!cancelled) setHolidays(res.data || []);
      } catch (err) {
        console.error('Holiday fetch error', err);
        if (!cancelled) setError('Failed to load holidays');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHolidays();
    return () => {
      cancelled = true;
    };
  }, [year, countryCode]);

  if (loading) return <div className="p-4">Loading holidays…</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!holidays.length) return <div className="p-4">No holidays found.</div>;

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3">🎉 Holiday Schedule — {year} (India)</h3>

      <ul className="space-y-3">
        {holidays.map((h) => {
          // map to friendly date text
          const date = new Date(h.date);
          const dateLabel = date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          // optional event object compatible with react-big-calendar
          const holidayEvent = {
            id: `holiday-${h.date}`,
            title: h.localName || h.name,
            start: new Date(h.date),
            end: new Date(h.date),
            allDay: true,
            category: 'holiday',
            raw: h,
          };

          return (
            <li key={h.date} className="flex items-start gap-3">
              <div className="min-w-[92px] text-sm text-gray-500">{dateLabel}</div>

              <div className="flex-1 border-l pl-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{h.localName || h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.types?.join(', ')}</div>
                  </div>

                  <div className="flex gap-2">
                    {onAddToCalendar && (
                      <button
                        onClick={() => onAddToCalendar(holidayEvent)}
                        className="text-sm px-2 py-1 rounded bg-blue-500 text-white hover:opacity-90"
                        title="Add to calendar"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
