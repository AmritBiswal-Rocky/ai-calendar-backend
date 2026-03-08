// src/components/CorsTest.jsx
import { useEffect } from 'react';

export default function CorsTest() {
  useEffect(() => {
    // Replace with your actual backend URL/port if different
    fetch('http://localhost:5000/api/events')
      .then((res) => res.json())
      .then((data) => console.log('CORS test success:', data))
      .catch((err) => console.error('CORS test failed:', err));
  }, []);

  return <div className="text-xs text-gray-500">Testing CORS... check browser console</div>;
}
