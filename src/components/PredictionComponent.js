import React, { useState } from "react";

const PredictionComponent = () => {
  const [features, setFeatures] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setError("");
    setPrediction(null);
    setLoading(true);

    try {
      const parsedFeatures = JSON.parse(features); // input must be an array
      if (!Array.isArray(parsedFeatures)) {
        throw new Error("Input must be a JSON array.");
      }

      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: parsedFeatures }),
      });

      const data = await response.json();

      if (response.ok) {
        setPrediction(data.prediction);
      } else {
        setError(data.error || "Prediction failed.");
      }
    } catch (err) {
      setError("Invalid input. Please enter a valid JSON array (e.g. [1.2, 3.4]).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-xl shadow-md bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-center">ML Prediction</h2>

      <textarea
        className="w-full border p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        placeholder='Enter features as JSON array (e.g. [1.2, 3.4, 5.6])'
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
      />

      <button
        className="w-full bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
        onClick={handlePredict}
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict"}
      </button>

      {prediction !== null && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded shadow-sm">
          Prediction: <strong>{prediction}</strong>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded shadow-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default PredictionComponent;

