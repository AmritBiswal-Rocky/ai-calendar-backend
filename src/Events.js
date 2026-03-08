import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.firebase_uid) {
        console.warn('No user authenticated when fetching events');
        return;
      }

      try {
        const token = await ensureAuth(user);
        if (!token) throw new Error('Authentication failed');

        // Query the events table
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.firebase_uid);

        console.log('Fetched events:', data);
        console.log('Error (if any):', error);

        if (error) {
          console.error('Error fetching events:', error);
        } else {
          setEvents(data || []);
        }
      } catch (authError) {
        console.error('Authentication error:', authError);
      }
    };

    fetchEvents();
  }, [user]);

  return (
    <div>
      <h2>Your Events</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>{event.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Events;
