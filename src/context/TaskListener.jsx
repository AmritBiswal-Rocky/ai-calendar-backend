import { useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useTasks } from "./TaskContext";

// Named export to match the requested import style
export const TaskListener = () => {
  const { socket } = useSocket() || {}; // our context provides { socket, ... }
  const { setTasks } = useTasks();

  useEffect(() => {
    if (!socket) return;

    const handler = (tasks) => {
      // Expecting an array of tasks from the server
      if (Array.isArray(tasks)) setTasks(tasks);
    };

    socket.on("task_updated", handler);

    return () => {
      socket.off("task_updated", handler);
    };
  }, [socket, setTasks]);

  return null; // headless listener component
};
