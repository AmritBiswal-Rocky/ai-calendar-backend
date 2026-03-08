// src/hooks/useCalendars.js
// Custom hook for managing both public and personal calendars
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchIndianHolidays } from '../api/googleCalendar';
import { initGapi, signInGapi } from '../googleCalendar';
import { listUpcomingEvents } from '../utils/googleCalendarUtils';

export const useCalendars = () => {
  const { user, loading: authLoading } = useAuth();

  // Public calendar state
  const [publicEvents, setPublicEvents] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState(null);

  // Personal calendar state
  const [personalEvents, setPersonalEvents] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState(null);
  const [googleSignedIn, setGoogleSignedIn] = useState(false);

  // Load public calendar data immediately
  useEffect(() => {
    const loadPublicEvents = async () => {
      try {
        setPublicLoading(true);
        setPublicError(null);
        console.log('Loading public calendar events...');

        const holidays = await fetchIndianHolidays();
        setPublicEvents(holidays);
        console.log(`Loaded ${holidays.length} public events`);
      } catch (error) {
        console.error('Failed to load public events:', error);
        setPublicError(error.message);
      } finally {
        setPublicLoading(false);
      }
    };

    loadPublicEvents();
  }, []);

  // Initialize personal calendar ONLY after user login
  useEffect(() => {
    // 🚨 CRITICAL: Never initialize GAPI without user authentication
    if (!user || authLoading) {
      console.log('🔐 User not authenticated yet - skipping all GAPI initialization');
      setGoogleSignedIn(false);
      setPersonalEvents([]);
      setPersonalError(null);
      return;
    }

    // 🚨 CRITICAL: Only proceed with GAPI after user login
    console.log('✅ User authenticated - initializing personal Google Calendar...');

    let isGapiInitialized = false;

    const initializePersonalCalendar = async (isSignedIn) => {
      console.log('🔍 Google auth state:', isSignedIn);

      // Update Google sign-in status
      setGoogleSignedIn(isSignedIn);

      // 🚨 CRITICAL: Never make API calls without Google sign-in
      if (!isSignedIn) {
        console.log('🚫 Google not signed in - personal calendar unavailable');
        setPersonalError('Please sign in to Google to access your calendar');
        setPersonalEvents([]);
        return;
      }

      // 🚨 CRITICAL: Wrap all personal calendar operations in try-catch
      try {
        setPersonalLoading(true);
        setPersonalError(null);

        console.log('📅 Loading personal calendar events...');

        // Double-check GAPI is ready before making calls
        if (!window.gapi || !window.gapi.client) {
          throw new Error('Google API client not initialized');
        }

        const events = await listUpcomingEvents(10);
        setPersonalEvents(events || []);
        console.log(`✅ Loaded ${events?.length || 0} personal events`);

      } catch (error) {
        console.error('❌ Personal calendar error:', error);
        setPersonalError(`Failed to load calendar: ${error.message}`);
        setPersonalEvents([]);
      } finally {
        setPersonalLoading(false);
      }
    };

    // 🚨 CRITICAL: Initialize GAPI only after user authentication
    try {
      initGapi(initializePersonalCalendar);
      isGapiInitialized = true;
      console.log('🚀 GAPI initialization started');
    } catch (error) {
      console.error('💥 Failed to initialize GAPI:', error);
      setPersonalError('Failed to initialize Google Calendar');
      setPersonalEvents([]);
      setGoogleSignedIn(false);
    }

    // Cleanup function
    return () => {
      if (isGapiInitialized) {
        console.log('🧹 Cleaning up GAPI initialization');
      }
    };

  }, [user, authLoading]); // Only re-run when authentication state changes

  // Function to trigger Google sign-in
  const signInToGoogle = () => {
    console.log('Triggering Google sign-in...');
    signInGapi();
  };

  // Function to refresh personal events
  const refreshPersonalEvents = async () => {
    // 🚨 CRITICAL: Never call GAPI functions without authentication
    if (!googleSignedIn) {
      console.warn('🚫 Cannot refresh personal events: not signed in to Google');
      setPersonalError('Please sign in to Google first');
      return;
    }

    // 🚨 CRITICAL: Double-check user authentication
    if (!user || authLoading) {
      console.warn('🚫 Cannot refresh personal events: user not authenticated');
      setPersonalError('Please log in to your account first');
      return;
    }

    // 🚨 CRITICAL: Verify GAPI is available
    if (!window.gapi || !window.gapi.client) {
      console.error('🚫 Google API client not available');
      setPersonalError('Google Calendar not initialized');
      return;
    }

    try {
      setPersonalLoading(true);
      setPersonalError(null);

      console.log('🔄 Refreshing personal events...');
      const events = await listUpcomingEvents(10);

      setPersonalEvents(events || []);
      console.log(`✅ Refreshed ${events?.length || 0} personal events`);

    } catch (error) {
      console.error('❌ Failed to refresh personal events:', error);
      setPersonalError(`Failed to refresh calendar: ${error.message}`);
    } finally {
      setPersonalLoading(false);
    }
  };

  // Combined events (public + personal)
  const allEvents = [...publicEvents, ...personalEvents];

  // Filter events by date range
  const getEventsInDateRange = (startDate, endDate) => {
    return allEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      return eventStart >= startDate && eventEnd <= endDate;
    });
  };

  // Get events for specific date
  const getEventsForDate = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return getEventsInDateRange(startOfDay, endOfDay);
  };

  return {
    // Public calendar data
    publicEvents,
    publicLoading,
    publicError,

    // Personal calendar data
    personalEvents,
    personalLoading,
    personalError,
    googleSignedIn,

    // Actions
    signInToGoogle,
    refreshPersonalEvents,

    // Combined data
    allEvents,

    // Utility functions
    getEventsInDateRange,
    getEventsForDate,
  };
};
