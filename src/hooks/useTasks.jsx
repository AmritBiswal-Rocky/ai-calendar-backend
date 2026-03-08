// src/hooks/useTasks.jsx
import { useState, useEffect } from "react";
import api from "../api";

function useTasksBase() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Replace with your actual fetch logic or keep as placeholder
        const data = [];
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Tasks fetch failed:", err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, loading };
}

// Default export keeps full shape for existing imports
export default useTasksBase;

// Named export that always returns an object with `tasks` only and uses Axios instance
export const useTasks = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get("/tasks");
        setTasks(res.data || []);
      } catch (err) {
        console.error("Tasks fetch failed:", err);
        setTasks([]);
      }
    };
    fetchTasks();
  }, []);

  return { tasks };
};
