// ─────────────────────────────────────────────
// src/components/MessageBar.jsx
// Normal message/chat bar with a Thinking button
// ─────────────────────────────────────────────
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MessageBar({ onThinkingClick }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    console.log("Sending message:", message);
    setMessage("");
  };

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 border-t bg-white/80 backdrop-blur-md"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-grow"
      />
      <Button variant="default" onClick={handleSend}>
        Send
      </Button>
      <Button variant="outline" onClick={onThinkingClick}>
        Thinking
      </Button>
    </motion.div>
  );
}
