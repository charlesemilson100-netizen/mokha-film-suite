import React, { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    // Load the main HTML file and inject it
    const loadApp = async () => {
      try {
        const response = await fetch('/mokha-suite-pro.html');
        const html = await response.text();
        
        // Extract just the body content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;
        
        // Inject into root
        const root = document.getElementById('root');
        if (root) {
          root.innerHTML = bodyContent;
          
          // Re-execute scripts
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
      } catch (error) {
        console.error('Failed to load app:', error);
      }
    };

    loadApp();
  }, []);

  return <div id="root" style={{ width: '100%', height: '100vh' }} />;
}

export default App;
