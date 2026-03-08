// src/components/SafeGoogleCalendarExample.jsx
// Example showing the CORRECT way to use Google Calendar integration
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { initGapi, signInGapi } from '../googleCalendar';
import { listUpcomingEvents, createCalendarEvent } from '../utils/googleCalendarUtils';

const SafeGoogleCalendarExample = () => {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CORRECT: Only initialize GAPI after user login
  useEffect(() => {
    // 🚨 CRITICAL: Never initialize GAPI without user authentication
    if (!user || authLoading) {
      console.log('🔐 Waiting for user authentication...');
      return;
    }

    console.log('✅ User authenticated - initializing Google Calendar...');

    // This is the SAFE way to initialize GAPI
    initGapi(async (isSignedIn) => {
      console.log('🔍 Google auth state:', isSignedIn);

      if (!isSignedIn) {
        console.log('🚫 Google not signed in - user needs to authenticate');
        setError('Please sign in to Google to access your calendar');
        return;
      }

      // ✅ SAFE: Only load events after Google authentication
      await loadEvents();
    });

  }, [user, authLoading]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📅 Loading personal calendar events...');
      const personalEvents = await listUpcomingEvents(5);

      setEvents(personalEvents);
      console.log(`✅ Loaded ${personalEvents.length} events`);

    } catch (err) {
      console.error('❌ Failed to load events:', err);
      setError(`Failed to load calendar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    console.log('🔗 Triggering Google sign-in...');
    signInGapi();
  };

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        summary: 'Sample Event from App',
        description: 'Created using the safe Google Calendar integration',
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      console.log('📝 Creating new event...');
      const newEvent = await createCalendarEvent(eventData);

      console.log('✅ Event created:', newEvent);
      await loadEvents(); // Refresh the list

    } catch (err) {
      console.error('❌ Failed to create event:', err);
      setError(`Failed to create event: ${err.message}`);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="safe-calendar-example">
        <h3>🔐 Authenticating...</h3>
        <p>Please wait while we verify your login status...</p>
      </div>
    );
  }

  // User not logged in
  if (!user) {
    return (
      <div className="safe-calendar-example">
        <h3>🔐 Please Log In</h3>
        <p>You need to log in to access Google Calendar features.</p>
      </div>
    );
  }

  return (
    <div className="safe-calendar-example">
      <h3>📅 Safe Google Calendar Integration</h3>

      <div className="status-section">
        <h4>Authentication Status:</h4>
        <div className="status-indicators">
          <div className={`status-item ${user ? 'authenticated' : 'not-authenticated'}`}>
            <span className="status-icon">{user ? '✅' : '❌'}</span>
            <span>App Authentication</span>
          </div>
          <div className={`status-item ${events.length > 0 ? 'authenticated' : 'not-authenticated'}`}>
            <span className="status-icon">{events.length > 0 ? '✅' : '⏳'}</span>
            <span>Google Calendar</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-section">
          <h4>⚠️ Error:</h4>
          <p>{error}</p>
        </div>
      )}

      <div className="actions-section">
        <button
          onClick={handleSignIn}
          className="action-button primary"
        >
          🔗 Sign In to Google
        </button>

        <button
          onClick={loadEvents}
          disabled={loading || events.length === 0}
          className="action-button secondary"
        >
          {loading ? 'Loading...' : '🔄 Refresh Events'}
        </button>

        <button
          onClick={handleCreateEvent}
          disabled={events.length === 0}
          className="action-button secondary"
        >
          📝 Create Sample Event
        </button>
      </div>

      <div className="events-section">
        <h4>Your Upcoming Events:</h4>

        {loading ? (
          <div className="loading-events">
            <div className="loading-spinner"></div>
            <p>Loading your calendar events...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="events-list">
            {events.map((event, index) => (
              <div key={index} className="event-item">
                <h5>{event.summary}</h5>
                <p>{event.description}</p>
                <div className="event-time">
                  <span>
                    {event.start.dateTime
                      ? new Date(event.start.dateTime).toLocaleString()
                      : event.start.date
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-events">
            <p>No upcoming events found</p>
            <p className="hint">Sign in to Google and create some events!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeGoogleCalendarExample;
