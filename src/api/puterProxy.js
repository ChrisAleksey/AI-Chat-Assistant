// Puter proxy API to handle server requests using real window.puter.ai.chat()

export const handlePuterProxy = async (req, res) => {
  try {
    const { input, options, sessionToken } = req.body;
    
    console.log('Puter proxy request received:', { input, options, sessionToken });
    
    // Verify Puter is available
    if (!window.puter || !window.puter.ai) {
      throw new Error('Puter AI not available in frontend');
    }
    
    // Configure options for Puter
    const puterOptions = {
      stream: options.stream || false,
      model: options.model || 'claude-3-5-sonnet',
    };
    
    console.log('Making real Puter AI call with options:', puterOptions);
    
    // Make the real Puter AI call
    const responseStream = await window.puter.ai.chat(input, puterOptions);
    
    if (options.stream) {
      // For streaming, collect all chunks
      let fullResponse = '';
      const chunks = [];
      
      for await (const part of responseStream) {
        const text = part?.text || '';
        fullResponse += text;
        chunks.push({ text });
      }
      
      console.log('Puter AI streaming response completed:', fullResponse.substring(0, 100) + '...');
      
      return {
        success: true,
        isStream: true,
        chunks,
        fullResponse
      };
    } else {
      // For non-streaming, collect full response
      let fullResponse = '';
      for await (const part of responseStream) {
        fullResponse += part?.text || '';
      }
      
      console.log('Puter AI response received:', fullResponse.substring(0, 100) + '...');
      
      return {
        success: true,
        isStream: false,
        response: fullResponse,
        fullResponse
      };
    }
    
  } catch (error) {
    console.error('Puter proxy error:', error);
    throw new Error(`Puter proxy failed: ${error.message}`);
  }
};