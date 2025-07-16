import { useEffect, useRef } from 'react';

const usePuterScript = () => {
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const loadScript = () => {
      // Check if the script is already present or if Puter is already loaded
      if (window.puter || document.querySelector('script[src="https://js.puter.com/v2/"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.id = 'puter-script'; // Add an ID for easier identification
      
      // Add success handling
      script.onload = () => {
        console.log('Puter script loaded successfully');
        retryCountRef.current = 0; // Reset retry count on success
      };
      
      // Add error handling with retry logic
      script.onerror = (error) => {
        console.error('Failed to load Puter script:', error);
        
        // Remove the failed script
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        
        // Retry loading if we haven't exceeded max retries
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying Puter script load (attempt ${retryCountRef.current}/${maxRetries})`);
          setTimeout(loadScript, 2000 * retryCountRef.current); // Exponential backoff
        } else {
          console.error('Max retries exceeded for Puter script loading');
        }
      };

      document.body.appendChild(script);
    };

    loadScript();

    return () => {
      // Clean up script when component unmounts
      try {
        const existingScript = document.getElementById('puter-script');
        if (existingScript && existingScript.parentNode) {
          existingScript.parentNode.removeChild(existingScript);
        }
      } catch (error) {
        console.warn('Error cleaning up Puter script:', error);
      }
    };
  }, []);
};

export default usePuterScript;
