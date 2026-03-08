// src/utils/apiCalls.js
// Centralized API wrappers built on top of fetchWithAuth

import { fetchWithAuth } from './api';

// ---------- Tasks ----------
export async function createTask(task) {
  try {
    const res = await fetchWithAuth('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getTasks() {
  try {
    const res = await fetchWithAuth('/api/tasks');
    if (!res || !res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function deleteTask(taskId) {
  try {
    const res = await fetchWithAuth(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return res && res.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ---------- Notes ----------
export async function getNotes(folderId) {
  try {
    const res = await fetchWithAuth(`/api/notes?folder=${folderId}`);
    if (!res || !res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createNote(note) {
  try {
    const res = await fetchWithAuth('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function deleteNote(noteId) {
  try {
    const res = await fetchWithAuth(`/api/notes/${noteId}`, { method: 'DELETE' });
    return res && res.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ---------- Events ----------
export async function getEvents() {
  try {
    const res = await fetchWithAuth('/api/events');
    if (!res || !res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createEvent(event) {
  try {
    const res = await fetchWithAuth('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updateEvent(eventId, event) {
  try {
    const res = await fetchWithAuth(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function deleteEvent(eventId) {
  try {
    const res = await fetchWithAuth(`/api/events/${eventId}`, { method: 'DELETE' });
    return res && res.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}
