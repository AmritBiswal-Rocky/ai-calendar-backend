import { useEffect, useMemo } from "react";
import { useSocket } from "@/context/SocketContext";
import { useNotes } from "@/context/NoteContext";

export default function NoteListener() {
  const { socket } = useSocket() || {};
  const { addNote, updateNote, deleteNote } = useNotes();

  const handlers = useMemo(() => ({
    created: (note) => addNote(note),
    updated: (note) => updateNote(note),
    deleted: (payload) => {
      const id = payload?.id ?? payload?._id ?? payload?.noteId ?? payload;
      if (id) deleteNote(id);
    },
  }), [addNote, updateNote, deleteNote]);

  useEffect(() => {
    if (!socket) return;

    socket.on("note_created", handlers.created);
    socket.on("note_updated", handlers.updated);
    socket.on("note_deleted", handlers.deleted);

    return () => {
      socket.off("note_created", handlers.created);
      socket.off("note_updated", handlers.updated);
      socket.off("note_deleted", handlers.deleted);
    };
  }, [socket, handlers]);

  return null;
}
