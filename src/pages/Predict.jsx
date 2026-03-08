// src/pages/Predict.jsx
import React, { useState } from 'react';

export default function Predict() {
  const [text, setText] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async () => {
    if (!text.trim()) {
      setError('Please enter some text to predict.');
      return;
    }

    setError('');
    setLoading(true);
    setPrediction(null);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
      setError('Error fetching prediction.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setPrediction(null);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePredict();
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Predict</h1>
      <p>
        This is the Predict page. You can integrate AI predictions or other features here later.
      </p>

      {/* Enhanced AI Prediction Interface */}
      <div className="max-w-4xl mx-auto mt-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            AI Prediction Engine
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get intelligent predictions and insights from your text input
          </p>
        </div>

        {/* Main Prediction Interface */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          {/* Input Area */}
          <div className="mb-6">
            <label
              htmlFor="input-text"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Input Text
            </label>
            <textarea
              id="input-text"
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 resize-none"
              rows="4"
              placeholder="Enter text here... (Use Ctrl+Enter to predict)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {text.length} characters
              </span>
              <button
                onClick={handleClear}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={handlePredict}
            disabled={loading || !text.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Predicting...
              </>
            ) : (
              <>Get Prediction</>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Prediction Result */}
          {prediction && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Prediction Result
              </h3>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Input Text:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                      {prediction.input_text}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">
                      {prediction.predicted_category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Confidence:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {getConfidenceLabel(prediction.confidence)}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        ({(prediction.confidence * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            💡 Pro Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Quick Access</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use Ctrl+Enter to quickly get predictions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Backend Connection</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ensure your backend is running on localhost:5000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
