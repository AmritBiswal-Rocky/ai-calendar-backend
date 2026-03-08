// src/components/GoogleCalendarIntegration.jsx
// Example component showing proper GAPI integration with authentication
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initGapi, signInGapi, signOutGapi } from '../googleCalendar';
import {
  listUpcomingEvents,
  createCalendarEvent,
  isGoogleSignedIn
} from '../utils/googleCalendarUtils';

const GoogleCalendarIntegration = () => {
  const { user, loading } = useAuth();
  const [googleSignedIn, setGoogleSignedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Initialize GAPI only after user authentication
  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated, initializing GAPI...');

      // Initialize GAPI with auth state callback
      initGapi((isSignedIn) => {
        console.log('Google auth state changed:', isSignedIn);
        setGoogleSignedIn(isSignedIn);

        if (isSignedIn) {
          // Load events when user signs in to Google
          loadEvents();
        } else {
          setEvents([]);
        }
      });
    }
  }, [user, loading]);

  const loadEvents = async () => {
    if (!isGoogleSignedIn()) return;

    setLoadingEvents(true);
    try {
      const upcomingEvents = await listUpcomingEvents(5);
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleGoogleSignIn = () => {
    signInGapi();
  };

  const handleGoogleSignOut = () => {
    signOutGapi();
  };

  const createSampleEvent = async () => {
    if (!googleSignedIn) return;

    const eventData = {
      summary: 'Sample Event from App',
      description: 'This is a test event created from the app',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      const newEvent = await createCalendarEvent(eventData);
      console.log('Event created:', newEvent);
      // Reload events to show the new one
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to use Google Calendar features</div>;
  }

  return (
    <div className="google-calendar-integration">
      <h3>Google Calendar Integration</h3>

      <div className="auth-section">
        <h4>Google Account</h4>
        {googleSignedIn ? (
          <div>
            <p>✅ Connected to Google Calendar</p>
            <button onClick={handleGoogleSignOut}>Disconnect Google</button>
          </div>
        ) : (
          <div>
            <p>❌ Not connected to Google Calendar</p>
            <button onClick={handleGoogleSignIn}>Connect Google Calendar</button>
          </div>
        )}
      </div>

      {googleSignedIn && (
        <div className="events-section">
          <h4>Upcoming Events</h4>
          <button onClick={loadEvents} disabled={loadingEvents}>
            {loadingEvents ? 'Loading...' : 'Refresh Events'}
          </button>

          <button onClick={createSampleEvent} style={{ marginLeft: '10px' }}>
            Create Sample Event
          </button>

          <div className="events-list">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div key={index} className="event-item">
                  <h5>{event.summary}</h5>
                  <p>{event.description}</p>
                  <p>
                    <strong>Start:</strong>{' '}
                    {event.start.dateTime || event.start.date}
                  </p>
                </div>
              ))
            ) : (
              <p>No upcoming events found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration;
