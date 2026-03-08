import { getAuth } from 'firebase/auth';
import supabase from '@/lib/supabaseClient';
import { ensureAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import axios from 'axios';

export const fetchEvents = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const token = await ensureAuth(user);
  if (!token) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.firebase_uid);
    
  if (error) throw error;
  return data || [];
};

export const createEvent = async (event) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const token = await ensureAuth(user);
  if (!token) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('events')
    .insert([{ ...event, user_id: user.firebase_uid }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Lightweight hook that safely returns an events array
export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/events');
        setEvents(res.data || []);
      } catch (err) {
        console.error('Events fetch failed:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, setEvents };
}
