// ─────────────────────────────────────────────
// src/api/googleCalendar.js
// Unified Google Calendar API (SAFE VERSION)
// - No storage access at module scope
// - No automatic OAuth initialization
// - React-render safe (never throws)
// ─────────────────────────────────────────────

import { initGapiClient, getAccessToken } from '../lib/gapiClient';

// ─────────────────────────────────────────────
// 🔧 Environment
// ─────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// 🇮🇳 Google official Indian public holidays calendar ID
const HOLIDAY_CALENDAR_ID = 'en.indian#holiday@group.v.calendar.google.com';

// ─────────────────────────────────────────────
// 🧪 Dev logging (SAFE — no side effects)
// ─────────────────────────────────────────────
if (import.meta.env.DEV) {
  console.log('🧩 Calendar API Configuration:');
  console.log('   🔑 API Key:', API_KEY ? '✅ Loaded' : '❌ Missing');
}

// ─────────────────────────────────────────────
// ⚙️ Safe Calendar API Init (NO THROW)
// ─────────────────────────────────────────────
export async function initGoogleCalendarClient() {
  try {
    if (typeof window === 'undefined') return false;

    // Initialize gapi ONLY when explicitly called
    await initGapiClient();

    if (!window.gapi?.client?.calendar) {
      console.warn('⚠️ gapi calendar client unavailable');
      return false;
    }

    console.log('✅ Google Calendar API client ready');
    return true;
  } catch (err) {
    // CRITICAL: never throw
    console.error('❌ Calendar API init failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────
// 🔁 Retry wrapper (SAFE)
// ─────────────────────────────────────────────
export async function safeInitGoogleCalendarClient(retries = 2) {
  const ok = await initGoogleCalendarClient();
  if (ok) return true;

  if (retries <= 0) {
    console.warn('❌ Calendar API init failed after retries');
    return false;
  }

  await new Promise((r) => setTimeout(r, 1200));
  return safeInitGoogleCalendarClient(retries - 1);
}

// ─────────────────────────────────────────────
// 📅 Fetch Google Calendar Events (SAFE)
// ─────────────────────────────────────────────
export async function listCalendarEvents() {
  try {
    // 1️⃣ Ensure Calendar API is ready
    const initialized = await safeInitGoogleCalendarClient();
    if (!initialized) return [];

    // 2️⃣ Token must already exist (user clicked Connect Google)
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.warn('ℹ️ Google Calendar access token missing');
      return [];
    }

    // 3️⃣ Inject token (guarded)
    try {
      window.gapi.client.setToken({ access_token: accessToken });
    } catch (err) {
      console.error('❌ Failed to set gapi token:', err);
      return [];
    }

    // 4️⃣ Fetch events
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
    });

    const items = response?.result?.items ?? [];

    console.log(`📆 Loaded ${items.length} Google Calendar events`);

    return items.map((event) => ({
      id: event.id,
      title: event.summary || '(No Title)',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description || '',
      location: event.location || '',
      htmlLink: event.htmlLink || '',
    }));
  } catch (err) {
    // CRITICAL: never throw
    console.error('❌ Calendar fetch failed:', err);
    return [];
  }
}

// Alias (backward compatibility)
export const listUpcomingEvents = listCalendarEvents;

// ─────────────────────────────────────────────
// 🏛 Public Holidays (API KEY ONLY — SAFE)
// ─────────────────────────────────────────────
function buildHolidayUrl({ timeMin, timeMax, pageToken }) {
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    HOLIDAY_CALENDAR_ID
  )}/events`;

  const params = new URLSearchParams({
    key: API_KEY,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin,
    timeMax,
    maxResults: '2500',
  });

  if (pageToken) params.append('pageToken', pageToken);

  return `${base}?${params.toString()}`;
}

// ─────────────────────────────────────────────
// 🇮🇳 Fetch Indian Public Holidays (SAFE)
// ─────────────────────────────────────────────
export async function fetchIndianHolidays(year = new Date().getFullYear()) {
  if (!API_KEY) {
    console.warn('⚠️ Holiday API key missing');
    return [];
  }

  try {
    const timeMin = new Date(Date.UTC(year, 0, 1)).toISOString();
    const timeMax = new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString();

    let items = [];
    let nextPageToken;

    do {
      const url = buildHolidayUrl({
        timeMin,
        timeMax,
        pageToken: nextPageToken,
      });

      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      items = items.concat(data.items || []);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    console.log(`🎉 Loaded ${items.length} holidays`);

    return items.map((h) => ({
      id: h.id,
      title: h.summary,
      date: h.start?.date,
      description: h.description || '',
    }));
  } catch (err) {
    console.error('❌ Holiday fetch failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────
// 🧩 Legacy no-op (SAFE)
// ─────────────────────────────────────────────
export const initGoogleCalendar = async () => true;
