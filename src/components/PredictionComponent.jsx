// src/components/PredictionComponent.jsx
import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, generateFirebaseToken } from '../firebaseClient';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSpinner, FaRedoAlt, FaTrashAlt } from 'react-icons/fa';

const LOCAL_STORAGE_KEY = 'ai_predictions_history';

const PredictionComponent = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(Array.isArray(parsed) ? parsed : [parsed]);
      setResult(Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed);
    }
  }, []);

  // Detect login state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      setUser(fbUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success('✅ Logged in!');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('❌ Login failed');
    }
  };

  const handlePredict = async () => {
    if (!input.trim() || input.trim().length < 5) {
      toast.error('Please enter a more detailed description.');
      return;
    }

    try {
      setErrorMsg(null);
      setLoading(true);
      const idToken = await generateFirebaseToken();

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/predict`,
        { task_description: input.trim() },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setResult(response.data);

      // Update history
      const newHistory = [...history, response.data];
      setHistory(newHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));

      // after receiving predictions
      toast.success('AI prediction loaded!');
    } catch (err) {
      const backendError = err.response?.data?.error || 'Prediction failed.';
      setErrorMsg(backendError);
      // if API/ML call fails
      toast.error('Prediction request failed. Please retry.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setHistory([]);
    setResult(null);
    toast.success('🗑️ History cleared');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
        🔮 AI Task Prediction
      </h2>

      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
        >
          🔑 Login with Google to Predict
        </button>
      ) : (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="w-full border rounded p-3 dark:bg-gray-900 dark:text-white"
            placeholder="Describe your task... e.g. Final year project deadline submission"
          />

          <button
            disabled={!input || loading}
            onClick={handlePredict}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition"
          >
            {loading ? <FaSpinner className="animate-spin" /> : '🎯 Predict'}
          </button>
        </>
      )}

      {errorMsg && (
        <div className="bg-red-100 text-red-800 p-3 rounded text-sm flex justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={handlePredict}
            disabled={loading}
            className="text-red-600 hover:underline flex items-center gap-1"
          >
            <FaRedoAlt /> Retry
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">📜 Prediction History</h3>
            <button
              onClick={handleClearHistory}
              className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
            >
              <FaTrashAlt /> Clear
            </button>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
            {history.map((item, idx) => (
              <li key={idx} className="border-b pb-1 last:border-none">
                {item.gemini || 'No summary'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <div className="bg-gray-200 animate-pulse h-24 rounded"></div>}

      {result && !loading && (
        <div className="mt-4 space-y-4 bg-gray-100 dark:bg-gray-800 p-4 rounded text-gray-900 dark:text-white">
          <div>
            <h4 className="font-semibold mb-1">🧠 spaCy Entities:</h4>
            {result.spaCy?.entities?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.spaCy.entities.map(([text, label], i) => (
                  <span
                    key={i}
                    className="bg-green-200 dark:bg-green-700 px-2 py-1 rounded text-sm"
                  >
                    {text} ({label})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No entities found.</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-1">🔑 spaCy Keywords:</h4>
            <p className="text-sm">
              {result.spaCy?.keywords?.length
                ? result.spaCy.keywords.join(', ')
                : 'No keywords extracted.'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">📜 Gemini Summary:</h4>
            <pre className="whitespace-pre-wrap text-sm bg-white dark:bg-gray-900 p-3 rounded border dark:border-gray-700">
              {result.gemini || 'No Gemini response.'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionComponent;
