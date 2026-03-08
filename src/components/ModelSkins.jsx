// ─────────────────────────────────────────────
// src/components/ModelSkins.jsx
// UI skin toggles for Radeles (ChatGPT, Perplexity, Grok, Gemini)
// ─────────────────────────────────────────────

import React from "react";

function ModelSkins({ onSelect }) {
  const skins = ["ChatGPT", "Perplexity", "Grok", "Gemini"];

  return (
    <div className="px-6 py-4 border-b bg-white flex gap-3 justify-center">
      {skins.map((skin) => (
        <button
          key={skin}
          onClick={() => onSelect && onSelect(skin)}
          className="px-4 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 text-sm"
        >
          {skin}
        </button>
      ))}
    </div>
  );
}

export default ModelSkins;
