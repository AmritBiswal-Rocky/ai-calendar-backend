// src/components/CalendarDashboard.jsx
// Complete calendar dashboard using both public and personal calendars
import React, { useState } from 'react';
import { useCalendars } from '../hooks/useCalendars';

const CalendarDashboard = () => {
  const {
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
    getEventsForDate,
  } = useCalendars();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');

  // Get events for selected date
  const eventsForSelectedDate = getEventsForDate(selectedDate);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'All day';
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get event type indicator
  const getEventType = (event) => {
    // Check if it's a public holiday (simple heuristic)
    if (event.summary && (
      event.summary.toLowerCase().includes('holiday') ||
      event.organizer?.displayName === 'Google Calendar'
    )) {
      return 'public';
    }
    return 'personal';
  };

  const renderEvent = (event, index) => {
    const eventType = getEventType(event);
    const isPublic = eventType === 'public';

    return (
      <div
        key={index}
        className={`event-card ${isPublic ? 'public-event' : 'personal-event'}`}
      >
        <div className="event-header">
          <h4>{event.summary}</h4>
          <span className={`event-type ${eventType}`}>
            {isPublic ? '🏛️ Public' : '👤 Personal'}
          </span>
        </div>

        {event.description && (
          <p className="event-description">{event.description}</p>
        )}

        <div className="event-time">
          <div className="time-info">
            <span>Start: {formatTime(event.start.dateTime)}</span>
            {event.end?.dateTime && (
              <span>End: {formatTime(event.end.dateTime)}</span>
            )}
          </div>
          {event.location && (
            <div className="event-location">📍 {event.location}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-dashboard">
      <h2>📅 Calendar Dashboard</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Events ({allEvents.length})
        </button>
        <button
          className={activeTab === 'public' ? 'active' : ''}
          onClick={() => setActiveTab('public')}
        >
          Public Holidays ({publicEvents.length})
        </button>
        <button
          className={activeTab === 'personal' ? 'active' : ''}
          onClick={() => setActiveTab('personal')}
        >
          Personal ({personalEvents.length})
        </button>
      </div>

      {/* Google Sign-in Section */}
      {!googleSignedIn && (
        <div className="signin-section">
          <h3>Connect Google Calendar</h3>
          <p>Sign in to access your personal calendar events</p>
          <button
            onClick={signInToGoogle}
            className="signin-button"
          >
            🔗 Connect Google Calendar
          </button>
          {personalError && (
            <div className="error-message">
              {personalError}
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      {googleSignedIn && (
        <div className="refresh-section">
          <button
            onClick={refreshPersonalEvents}
            disabled={personalLoading}
            className="refresh-button"
          >
            {personalLoading ? 'Refreshing...' : '🔄 Refresh Personal Events'}
          </button>
        </div>
      )}

      {/* Loading States */}
      {(publicLoading || personalLoading) && (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Loading calendar events...</p>
        </div>
      )}

      {/* Error States */}
      {(publicError || personalError) && (
        <div className="error-section">
          <h4>⚠️ Some calendar data couldn't be loaded:</h4>
          <ul>
            {publicError && <li><strong>Public Holidays:</strong> {publicError}</li>}
            {personalError && <li><strong>Personal Calendar:</strong> {personalError}</li>}
          </ul>
        </div>
      )}

      {/* Date Selector */}
      <div className="date-selector">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
        <span className="selected-date">{formatDate(selectedDate)}</span>
      </div>

      {/* Events Display */}
      <div className="events-section">
        <h3>
          Events {activeTab !== 'all' ? `(${activeTab})` : ''} - {formatDate(selectedDate)}
        </h3>

        {eventsForSelectedDate.length === 0 ? (
          <div className="no-events">
            <p>No events scheduled for {formatDate(selectedDate)}</p>
          </div>
        ) : (
          <div className="events-grid">
            {eventsForSelectedDate.map((event, index) => renderEvent(event, index))}
          </div>
        )}
      </div>

      {/* Calendar Statistics */}
      <div className="stats-section">
        <h4>📊 Calendar Statistics</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <h5>Total Events</h5>
            <span className="stat-number">{allEvents.length}</span>
          </div>
          <div className="stat-card">
            <h5>Public Holidays</h5>
            <span className="stat-number">{publicEvents.length}</span>
          </div>
          <div className="stat-card">
            <h5>Personal Events</h5>
            <span className="stat-number">{personalEvents.length}</span>
          </div>
          <div className="stat-card">
            <h5>Today's Events</h5>
            <span className="stat-number">{getEventsForDate(new Date()).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDashboard;
