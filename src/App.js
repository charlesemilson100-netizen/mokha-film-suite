import React, { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadApp = async () => {
      try {
        const response = await fetch('/mokha-suite-pro.html');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        if (containerRef.current) {
          containerRef.current.innerHTML = doc.body.innerHTML;

          const scripts = doc.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
              newScript.src = script.src;
            } else {
              newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load app:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadApp();
  }, []);

  if (error) {
    return (
      <div className="loading-container">
        <p>Failed to load application: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading MOKHA FILM Suite...</p>
      </div>
    );
  }

  return <div ref={containerRef} className="app-container" />;
}

export default App;
