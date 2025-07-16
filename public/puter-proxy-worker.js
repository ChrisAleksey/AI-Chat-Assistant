// Service Worker to handle Puter proxy requests
// This runs in the browser context where window.puter is available

let puterReady = false;

// Initialize Puter
const initializePuter = async () => {
  if (puterReady) return true;
  
  try {
    // Load Puter script if not already loaded
    if (!self.puter) {
      const script = await import('https://js.puter.com/v2/');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for initialization
    }
    
    if (self.puter && self.puter.ai) {
      puterReady = true;
      console.log('Puter initialized in service worker');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to initialize Puter in service worker:', error);
    return false;
  }
};

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;
  
  if (type === 'PUTER_AI_CALL') {
    try {
      await initializePuter();
      
      if (!puterReady) {
        throw new Error('Puter not ready in service worker');
      }
      
      const { input, options } = data;
      
      console.log('Service worker making Puter AI call:', { input, options });
      
      const responseStream = await self.puter.ai.chat(input, options);
      
      if (options.stream) {
        let fullResponse = '';
        const chunks = [];
        
        for await (const part of responseStream) {
          const text = part?.text || '';
          fullResponse += text;
          chunks.push({ text });
        }
        
        self.postMessage({
          type: 'PUTER_AI_RESPONSE',
          id,
          data: {
            success: true,
            isStream: true,
            chunks,
            fullResponse
          }
        });
      } else {
        let fullResponse = '';
        for await (const part of responseStream) {
          fullResponse += part?.text || '';
        }
        
        self.postMessage({
          type: 'PUTER_AI_RESPONSE',
          id,
          data: {
            success: true,
            isStream: false,
            response: fullResponse,
            fullResponse
          }
        });
      }
      
    } catch (error) {
      console.error('Service worker Puter AI call failed:', error);
      self.postMessage({
        type: 'PUTER_AI_RESPONSE',
        id,
        data: {
          success: false,
          error: error.message
        }
      });
    }
  }
});