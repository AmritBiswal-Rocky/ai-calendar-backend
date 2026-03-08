// ─────────────────────────────────────────────
// src/components/APIBar.jsx
// Simple input bar for entering GPT API keys
// ─────────────────────────────────────────────
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function APIBar({ apiKey, onApiKeyChange, onSubmit, onClose }) {
  return (
    <motion.div
      className="w-full flex items-center justify-between gap-2 p-3 bg-gray-100 border-t border-gray-300 rounded-t-2xl"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* API Key Input */}
      <input
        type="password"
        placeholder="Enter your GPT API key..."
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        className="flex-grow p-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Submit */}
      <Button
        onClick={onSubmit}
        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
      >
        Connect
      </Button>

      {/* Close */}
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-gray-200 transition"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
    </motion.div>
  );
}
