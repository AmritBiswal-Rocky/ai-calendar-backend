import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useNotes } from "@/context/NoteContext";

export default function FloatingAddNoteButton() {
  const { addNote } = useNotes();

  return (
    <motion.button
      onClick={() => addNote("New Note", "Write something...")}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="
        fixed bottom-6 right-6 
        w-14 h-14 rounded-full 
        bg-blue-600 text-white 
        shadow-lg shadow-blue-400/40 
        flex items-center justify-center
        hover:bg-blue-700 transition-colors
      "
    >
      <Plus size={30} strokeWidth={2.5} />
    </motion.button>
  );
}
