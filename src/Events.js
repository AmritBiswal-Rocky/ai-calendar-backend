import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User data:", user);

      if (!user) {
        console.log("No user logged in.");
        return;
      }

      // Query the events table
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);

      console.log("Fetched events:", data);
      console.log("Error (if any):", error);

      if (error) {
        console.error(error);
      } else {
        setEvents(data);
      }
    };

    fetchEvents();
  }, []);

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



