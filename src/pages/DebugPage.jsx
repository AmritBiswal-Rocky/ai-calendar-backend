// ─────────────────────────────────────────────
// src/pages/DebugPage.jsx
// Manual health check runner
// ─────────────────────────────────────────────

import React from 'react';
import { runHealthCheck } from '@/utils/healthCheck';

function DebugPage() {
  const runTest = async () => {
    const results = await runHealthCheck();
    console.log('FINAL RESULTS:', results);
    alert('Health check complete — check console!');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">System Health Check</h1>

      <button
        onClick={runTest}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        Run Health Check
      </button>
    </div>
  );
}

export default DebugPage;
