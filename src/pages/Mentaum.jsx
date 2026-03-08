// src/pages/Mentaum.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function Mentaum() {
  const [prompt, setPrompt] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    try {
      setLoading(true);
      setImgUrl('');
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/ai/mentaum/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: 1024, height: 768 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generate failed');
      setImgUrl(data.image_url);
    } catch (e) {
      toast.error(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Mentaum</h1>
        <p className="text-sm text-gray-500">AI image generation playground</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border shadow-sm p-4 bg-white">
          <div className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
            {imgUrl ? (
              <img src={imgUrl} alt="generated" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">Preview</span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              type="text"
              placeholder="Describe your image..."
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={generate}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
        <aside className="rounded-2xl border shadow-sm p-4 bg-white">
          <div className="font-medium mb-3">Styles</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Portrait', 'Landscape', '3D', 'Sketch', 'Anime', 'Realistic'].map((s) => (
              <button key={s} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
                {s}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
