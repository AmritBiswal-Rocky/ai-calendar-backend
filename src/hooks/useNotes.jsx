// src/hooks/useNotes.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "../context/SocketContext";
const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

function useNotesBase() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // Replace with your actual fetch logic
        // const res = await fetch("/api/notes");
        // const data = await res.json();
        const data = []; // fallback empty
        setNotes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Notes fetch failed:", err);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return { notes, loading };
}

// Default export keeps full shape for existing imports
export default useNotesBase;

// Named export that always returns an object with `notes` only
export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const socket = useSocket();

  const fetchNotes = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/notes");
      setNotes(res.data || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
  };

  useEffect(() => {
    fetchNotes();

    if (!socket) return;

    const handler = (data) => {
      setNotes((prev) => {
        const index = prev.findIndex((n) => n.id === data?.note?.id);
        if (index !== -1) {
          const newNotes = [...prev];
          newNotes[index] = data.note;
          return newNotes;
        } else {
          return [...prev, data.note];
        }
      });
    };

    socket.on("note_update", handler);
    return () => socket.off("note_update", handler);
  }, [socket]);

  return { notes };
};

// Simple unauthenticated variant matching the requested shape/signature
export const useNotesSimple = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/notes"); // correct Flask endpoint
        setNotes(response.data || []);
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return { notes, loading, error };
};
