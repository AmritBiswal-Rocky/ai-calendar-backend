// src/TaskListener.jsx
import { useEffect } from "react";
import { useSocket } from "./context/SocketContext";

// Named export to match user's import style
export const TaskListener = () => {
  const { socket } = useSocket() || {}; // our SocketContext provides an object with { socket, ... }

  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdate = (task) => {
      console.log("[TaskListener] Task updated:", task);
      // TODO: Update your TaskContext state here
    };

    socket.on("task_update", handleTaskUpdate);

    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socket]);

  return null; // this component just listens
};
