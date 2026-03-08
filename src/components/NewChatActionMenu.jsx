import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File, Brain, Search, Book, Globe } from "lucide-react";

const NewChatActionMenu = ({ onFilesSelected, onThinkingSelected, onDeepResearchSelected }) => {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  const actions = [
    {
      id: "upload",
      label: "Add photos & files",
      Icon: File,
      gradient: "bg-gradient-to-r from-purple-400 to-pink-500",
      onClick: () => {
        const input = fileInputRef.current;
        if (input) {
          input.click();
        }
      },
    },
    {
      id: "thinking",
      label: "Thinking",
      Icon: Brain,
      gradient: "bg-gradient-to-r from-yellow-400 to-orange-500",
      onClick: () => {
        onThinkingSelected?.();
      },
    },
    {
      id: "research",
      label: "Deep research",
      Icon: Search,
      gradient: "bg-gradient-to-r from-blue-400 to-teal-500",
      onClick: () => {
        onDeepResearchSelected?.();
      },
    },
    {
      id: "study",
      label: "Study & learn",
      Icon: Book,
      gradient: "bg-gradient-to-r from-green-400 to-lime-500",
      onClick: () => console.log("Study & learn clicked"),
    },
    {
      id: "web",
      label: "Web search",
      Icon: Globe,
      gradient: "bg-gradient-to-r from-indigo-400 to-purple-500",
      onClick: () => console.log("Web search clicked"),
    },
  ];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-110"
        type="button"
        aria-label="Radeles quick actions"
      >
        +
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 rounded-xl bg-white p-2 shadow-xl dark:bg-gray-800"
          >
            {actions.map(({ id, Icon, gradient, onClick, label }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClick();
                  if (id !== "upload") {
                    setOpen(false);
                  }
                }}
                className={`${gradient} flex min-w-[190px] items-center gap-3 rounded-xl px-5 py-3 text-base font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900`}
                type="button"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onFilesSelected?.(files);
          }
          if (event.target) {
            event.target.value = "";
          }
          setOpen(false);
        }}
      />
    </div>
  );
};

export default NewChatActionMenu;
