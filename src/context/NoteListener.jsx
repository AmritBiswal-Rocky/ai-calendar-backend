import { useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useNotes } from "./NoteContext";

// Named export to match the requested import style
export const NoteListener = () => {
  const { socket } = useSocket() || {}; // our context provides { socket, ... }
  const { setNotes } = useNotes();

  useEffect(() => {
    if (!socket) return;

    const handler = (notes) => {
      if (Array.isArray(notes)) setNotes(notes);
    };

    socket.on("note_updated", handler);

    return () => {
      socket.off("note_updated", handler);
    };
  }, [socket, setNotes]);

  return null; // headless listener component
};
