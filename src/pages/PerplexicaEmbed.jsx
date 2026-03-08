import React, { useRef, useEffect } from "react";
import useThemeSync from "../hooks/useThemeSync";

export default function PerplexicaEmbed({ theme = "light" }) {
  const iframeRef = useRef(null);

  // 🔄 Sync theme with Perplexica
  useThemeSync(iframeRef, theme);

  // ✅ Listen for messages from Perplexica (optional)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:3000") return; // security check
      console.log("📩 Message received from Perplexica:", event.data);
      // You can trigger internal UI changes here if needed
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      className={`h-screen w-full transition-all duration-500 ${
        theme === 'dark'
          ? 'bg-background text-text-primary'
          : 'bg-white text-gray-900'
      }`}
    >
      <iframe
        ref={iframeRef}
        src="http://localhost:3000"
        title="Perplexica"
        className="w-full h-full rounded-2xl border-none shadow-glow"
      />
    </div>
  );
}
