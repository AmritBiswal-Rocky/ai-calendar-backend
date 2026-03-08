// src/hooks/useEvents.jsx
import { useState, useEffect } from "react";
import api from "../api";

function useEventsBase() {
  const [events, setEvents] = useState([]);
  // Optional placeholder/no-op to preserve shape
  useEffect(() => {
    // no-op base
  }, []);
  return { events };
}

// Default export keeps simple base shape for backward compatibility
export default useEventsBase;

// Named export that fetches via Axios and returns only { events }
export const useEvents = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data || []);
      } catch (err) {
        console.error("Events fetch failed:", err);
        setEvents([]);
      }
    };
    fetchEvents();
  }, []);

  return { events };
};
