// src/components/CreateNoteButton.jsx
import React from "react";
import { useNotes } from "@/context/NoteContext";

export default function CreateNoteButton() {
  const { addNote } = useNotes();

  return (
    <button
      onClick={() => addNote("Hello", "Content")}
      className="px-3 py-2 bg-blue-500 text-white rounded"
    >
      Add Note
    </button>
  );
}
