// ─────────────────────────────────────────────
// src/context/EventContext.jsx
// EVENTS: Firebase firebase_uid + Supabase CRUD + Real-Time Socket Sync
// 100% SAFE • REALTIME • NO MEMORY LEAKS • NO DUPLICATE LISTENERS
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import supabase from '@/lib/supabaseClient';

import { useSocket } from './SocketContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const EventContext = createContext(null);

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
};

// ─────────────────────────────────────────────
// Event Provider (Supabase CRUD + Socket Sync)
// ─────────────────────────────────────────────
export const EventProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket() || {};

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keep latest state reference to avoid stale closures
  const eventsRef = useRef([]);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // ─────────────────────────────────────────────
  // Fetch Events (Supabase)
  // ─────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    if (!user?.firebase_uid) {
      setEvents([]);
      return [];
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('firebase_uid', user.firebase_uid)
        .order('start', { ascending: true });

      if (error) throw error;

      const result = Array.isArray(data) ? data : [];
      setEvents(result);

      return result;
    } catch (err) {
      console.error('❌ Failed to fetch events:', err.message);
      toast.error('Failed to load events');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch when user logs in
  useEffect(() => {
    if (!authLoading && user) fetchEvents();
    if (!authLoading && !user) {
      setEvents([]);
      setLoading(false);
    }
  }, [user, authLoading, fetchEvents]);

  // ─────────────────────────────────────────────
  // Create Event
  // ─────────────────────────────────────────────
  const createEvent = useCallback(
    async (eventData) => {
      if (!user?.firebase_uid) return null;

      try {
        const payload = { ...eventData, firebase_uid: user.firebase_uid };

        const { data, error } = await supabase.from('events').insert(payload).select().single();

        if (error) throw error;

        setEvents((prev) => [...prev, data]);

        socket?.emit('event_created', data);

        toast.success('Event created');
        return data;
      } catch (err) {
        toast.error(err.message || 'Failed to create event');
        return null;
      }
    },
    [user, socket]
  );

  // ─────────────────────────────────────────────
  // Update Event
  // ─────────────────────────────────────────────
  const updateEvent = useCallback(
    async (id, updates) => {
      if (!user?.firebase_uid || !id) return null;

      try {
        const { data, error } = await supabase
          .from('events')
          .update(updates)
          .eq('id', id)
          .eq('firebase_uid', user.firebase_uid)
          .select()
          .single();

        if (error) throw error;

        setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...data } : ev)));

        socket?.emit('event_updated', data);

        toast.success('Event updated');
        return data;
      } catch (err) {
        toast.error(err.message || 'Failed to update event');
        return null;
      }
    },
    [user, socket]
  );

  // ─────────────────────────────────────────────
  // Delete Event
  // ─────────────────────────────────────────────
  const deleteEvent = useCallback(
    async (id) => {
      if (!user?.firebase_uid || !id) return false;

      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id)
          .eq('firebase_uid', user.firebase_uid);

        if (error) throw error;

        setEvents((prev) => prev.filter((ev) => ev.id !== id));

        socket?.emit('event_deleted', { id });

        toast.success('Event deleted');
        return true;
      } catch (err) {
        toast.error(err.message || 'Failed to delete event');
        return false;
      }
    },
    [user, socket]
  );

  // ─────────────────────────────────────────────
  // Real-time Socket Sync
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onCreated = (ev) => {
      if (!ev) return;
      if (!eventsRef.current.some((e) => e.id === ev.id)) {
        setEvents((prev) => [...prev, ev]);
      }
    };

    const onUpdated = (ev) => {
      if (!ev) return;
      setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, ...ev } : e)));
    };

    const onDeleted = ({ id }) => {
      if (!id) return;
      setEvents((prev) => prev.filter((e) => e.id !== id));
    };

    socket.on('event_created', onCreated);
    socket.on('event_updated', onUpdated);
    socket.on('event_deleted', onDeleted);

    return () => {
      socket.off('event_created', onCreated);
      socket.off('event_updated', onUpdated);
      socket.off('event_deleted', onDeleted);
    };
  }, [socket]);

  // ─────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────
  return (
    <EventContext.Provider
      value={{
        events,
        setEvents,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        loading,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

EventProvider.propTypes = { children: PropTypes.node.isRequired };
