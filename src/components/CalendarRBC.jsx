import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import TimelineModal from './modals/TimelineModal';
import AddTitleModal from './modals/AddTitleModal';

import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';
import hotToast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const localizer = momentLocalizer(moment);

const CalendarView = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showAddTitleModal, setShowAddTitleModal] = useState(false);
  const [events, setEvents] = useState([]);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    if (!user?.firebase_uid) {
      console.warn('No user authenticated when fetching events');
      return;
    }

    try {
      const token = await ensureAuth(user);
      if (!token) throw new Error('Authentication failed');

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('firebase_uid', user.firebase_uid);

      if (error) {
        console.error('Failed to fetch events:', error);
        return;
      }

      // Transform to BigCalendar format
      const transformed = (data || []).map((ev) => ({
        ...ev,
        start: new Date(`${ev.date} ${ev.time || '00:00'}`),
        end: new Date(`${ev.date} ${ev.time || '00:00'}`),
        title: ev.title,
      }));
      setEvents(transformed);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle slot click → open TimelineModal
  const handleSelectSlot = (slotInfo) => {
    const dateStr = moment(slotInfo.start).format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    setShowTimelineModal(true);
  };

  // Handle time confirm → open AddTitleModal
  const handleTimeConfirm = (time) => {
    setSelectedTime(time);
    setShowTimelineModal(false);
    setShowAddTitleModal(true);
  };

  // Custom event renderer with subtle hover effect
  const EventCard = ({ event }) => (
    <HoverWrapper>
      <div className="calendar-event p-2 bg-blue-100 rounded-lg">{event.title}</div>
    </HoverWrapper>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Calendar</h1>

      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        components={{ event: EventCard }}
        style={{ height: 600, margin: '20px 0' }}
      />

      {/* TimelineModal */}
      <TimelineModal
        isOpen={showTimelineModal}
        selectedDate={selectedDate}
        onClose={() => setShowTimelineModal(false)}
        onConfirm={handleTimeConfirm}
      />

      {/* AddTitleModal */}
      <AddTitleModal
        isOpen={showAddTitleModal}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onClose={() => setShowAddTitleModal(false)}
        refreshCalendar={fetchEvents}
      />
    </div>
  );
};

export default CalendarView;
