// Middleware to handle Puter AI integration using frontend proxy
const axios = require('axios');

class PuterAIIntegration {
  constructor() {
    this.sessionToken = null;
    this.isInitialized = false;
    this.frontendProxyUrl = 'http://localhost:3000/api/puter-proxy';
  }

  setSessionToken(token) {
    this.sessionToken = token;
    this.isInitialized = true;
    console.log('Session token set:', token);
  }

  async callPuterAI(input, options = {}) {
    if (!this.sessionToken) {
      throw new Error('No Puter session token available');
    }

    try {
      console.log('Making Puter AI call via frontend proxy...');
      
      // Make call to frontend proxy that will use window.puter.ai.chat()
      const requestBody = {
        input: input,
        options: {
          stream: options.stream || false,
          model: options.model || 'claude-sonnet-4',
        },
        sessionToken: this.sessionToken
      };

      const response = await axios.post(this.frontendProxyUrl, requestBody, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (options.stream) {
        // Return streaming generator from collected chunks
        return this.createStreamingGenerator(response.data.chunks || []);
      } else {
        return response.data.response || response.data.fullResponse;
      }
      
    } catch (error) {
      console.error('Frontend proxy call failed:', error.message);
      throw new Error(`Failed to get response from Puter AI: ${error.message}`);
    }
  }

  async* createRealTimeStreamingGenerator(requestBody) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let completed = false;
      
      console.log('Starting real-time streaming request to frontend proxy...');
      
      // Make the streaming request to the frontend proxy
      axios.post(this.frontendProxyUrl, requestBody, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }).then(response => {
        console.log('Streaming response received, setting up data handlers...');
        
        let buffer = '';
        
        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          
          // Process complete lines (SSE format)
          while (buffer.includes('\n\n')) {
            const lineEnd = buffer.indexOf('\n\n');
            const line = buffer.substring(0, lineEnd);
            buffer = buffer.substring(lineEnd + 2);
            
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              try {
                const data = JSON.parse(dataStr);
                
                if (data.success && data.chunk && data.chunk.text) {
                  chunks.push(data.chunk);
                } else if (data.isComplete) {
                  completed = true;
                  resolve(this.createStreamingGenerator(chunks));
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          }
        });
        
        response.data.on('end', () => {
          if (!completed) {
            console.log('Stream ended, resolving with collected chunks');
            resolve(this.createStreamingGenerator(chunks));
          }
        });
        
        response.data.on('error', (error) => {
          console.error('Stream data error:', error);
          reject(error);
        });
        
      }).catch(error => {
        console.error('Real-time streaming error:', error);
        reject(error);
      });
    });
  }

  async* createStreamingGenerator(chunks) {
    for (const chunk of chunks) {
      yield chunk;
      // Add small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  isReady() {
    return this.isInitialized && this.sessionToken !== null;
  }
}

// Create singleton instance
const puterAI = new PuterAIIntegration();

module.exports = puterAI;