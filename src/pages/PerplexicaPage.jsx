import React from 'react';

export default function PerplexicaPage() {
  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <iframe
        src="http://localhost:3000"
        title="Perplexica"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '0px',
        }}
      />
    </div>
  );
}
