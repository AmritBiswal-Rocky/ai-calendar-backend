// src/pages/Thewerup.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function Thewerup() {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    try {
      setLoading(true);
      setVideoUrl('');
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/ai/thewerup/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generate failed');
      setVideoUrl(data.video_url);
    } catch (e) {
      toast.error(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Thewerup</h1>
        <p className="text-sm text-gray-500">AI video generation (coming soon)</p>
      </header>

      <div className="rounded-2xl border shadow-sm p-6 bg-white">
        <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center mb-4 overflow-hidden">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full" />
          ) : (
            <span className="text-gray-400">Video Preview</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            type="text"
            placeholder="Describe your video..."
            className="px-3 py-2 border rounded-lg md:col-span-2"
          />
          <button
            onClick={generate}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
