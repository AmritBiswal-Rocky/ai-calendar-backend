import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function DeepResearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/deep_research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to complete deep research request.');
      }

      const entry = {
        id: Date.now(),
        query,
        summary: payload.summary || 'No summary available.',
        sources: payload.sources || [],
      };

      setResults(entry);
      setHistory((prev) => [entry, ...prev]);
    } catch (err) {
      console.error('Deep Research error:', err);
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry) => {
    setResults(entry);
    setQuery(entry.query);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <aside className="hidden w-64 bg-gray-950 border-r border-gray-800 p-4 md:block">
        <h2 className="text-xl font-semibold mb-4">History</h2>
        <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-6rem)] pr-1">
          {history.length === 0 && <li className="text-sm text-gray-500">No searches yet</li>}
          {history.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleHistorySelect(item)}
                className={`w-full text-left p-2 rounded-md transition ${
                  results?.id === item.id ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <span className="block truncate text-sm">{item.query}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold">Deep Research</h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="flex-1 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg"
            >
              {loading ? 'Searching...' : 'Ask'}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading && !results && (
            <p className="animate-pulse text-gray-400">Searching...</p>
          )}

          {results && (
            <motion.div
              key={results.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-gray-900 p-4 rounded-lg shadow-lg transition hover:shadow-xl">
                <h2 className="text-xl font-semibold mb-2">Summary</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {results.summary || 'No summary available.'}
                </p>
              </div>

              {results.sources.length > 0 && (
                <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-2">Sources</h2>
                  <ul className="space-y-2">
                    {results.sources
                      .filter(Boolean)
                      .map((source, index) => (
                        <li key={`${source.url || source.title || index}-${index}`}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {source.title || `Source ${index + 1}`}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {!loading && !results && history.length === 0 && (
            <p className="text-gray-500">Start your first deep research by asking a question above.</p>
          )}
        </main>

        <footer className="border-t border-gray-800 p-4 bg-gray-950">
          <input
            type="text"
            placeholder="Ask a follow-up..."
            className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </footer>
      </div>
    </div>
  );
}
