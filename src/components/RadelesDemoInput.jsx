// ─────────────────────────────────────────────
// src/components/RadelesDemoInput.jsx
// Demo input bar (quick question preview)
// ─────────────────────────────────────────────

import React, { useState } from "react";

function RadelesDemoInput({ onSubmit }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit?.(query);
    setQuery("");
  };

  return (
    <section className="flex flex-col items-center justify-center px-6 py-10 bg-gray-50 border-b">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Try a quick question</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-lg flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something..."
          className="flex-1 border rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Go
        </button>
      </form>
    </section>
  );
}

export default RadelesDemoInput;
