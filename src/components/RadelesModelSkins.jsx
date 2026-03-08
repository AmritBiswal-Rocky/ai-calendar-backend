// ─────────────────────────────────────────────
// src/components/RadelesModelSkins.jsx
// Toggle buttons for AI model skins
// ─────────────────────────────────────────────

import React from "react";

function RadelesModelSkins({ activeSkin, setActiveSkin }) {
  const models = ["ChatGPT", "Perplexity", "Grok", "Gemini"];

  return (
    <section className="px-6 py-3 bg-white border-b flex gap-3">
      {models.map((skin) => (
        <button
          key={skin}
          onClick={() => setActiveSkin(skin)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSkin === skin
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {skin}
        </button>
      ))}
    </section>
  );
}

export default RadelesModelSkins;
