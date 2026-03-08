// ─────────────────────────────────────────────
// src/pages/Radeles/index.jsx
// ─────────────────────────────────────────────
import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Radeles() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDeepResearch = location.pathname.includes("deep-research");

  // Dynamically show the page title based on path
  const pageTitle = isDeepResearch ? "Deep Research" : "New Chat";

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Radeles Chat</h1>
          <h2 className="text-lg text-gray-300">{pageTitle}</h2>
        </div>
        {isDeepResearch && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}
      </div>

      {/* 👇 Render either NewChat or DeepResearch here */}
      <Outlet />
    </div>
  );
}
