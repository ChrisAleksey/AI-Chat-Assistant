// Global storage for pending requests
const pendingRequests = new Map();
let requestCounter = 0;

module.exports = function(app) {
  // Add body parser middleware for this route
  const express = require('express');
  app.use('/api/puter-proxy', express.json());
  
  // Handle Puter proxy requests from backend
  app.post('/api/puter-proxy', (req, res) => {
    try {
      const requestId = ++requestCounter;
      const { input, options, sessionToken } = req.body;
      
      console.log(`Puter proxy request ${requestId}:`, { input, options });
      
      // Don't set streaming headers here anymore - handle normally
      
      // Store the request and response object
      pendingRequests.set(requestId, {
        req: { input, options, sessionToken },
        res,
        timestamp: Date.now(),
        isStreaming: options.stream
      });
      
      // Set timeout to clean up if no response
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          console.log(`Request ${requestId} timed out`);
          const requestData = pendingRequests.get(requestId);
          pendingRequests.delete(requestId);
          
          if (!requestData.res.headersSent) {
            if (requestData.isStreaming) {
              requestData.res.write(`data: ${JSON.stringify({ 
                success: false, 
                error: 'Request timeout - frontend did not respond' 
              })}\n\n`);
              requestData.res.end();
            } else {
              requestData.res.status(408).json({ 
                success: false, 
                error: 'Request timeout - frontend did not respond' 
              });
            }
          }
        }
      }, 120000); // Increase timeout to 2 minutes for streaming
      
    } catch (error) {
      console.error('Proxy setup error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  });
  
  // Endpoint for frontend to get pending requests
  app.get('/api/puter-proxy/pending', (req, res) => {
    const requests = Array.from(pendingRequests.entries()).map(([id, data]) => ({
      id,
      input: data.req.input,
      options: data.req.options,
      timestamp: data.timestamp
    }));
    
    res.json({ requests });
  });
  
  // Endpoint for frontend to submit streaming chunks in real-time
  app.post('/api/puter-proxy/stream/:requestId', (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const { chunk, isFirstChunk, isLastChunk, fullResponse } = req.body;
    
    console.log(`Received stream chunk for request ${requestId}:`, { isFirstChunk, isLastChunk, chunkText: chunk?.text?.substring(0, 50) });
    
    if (pendingRequests.has(requestId)) {
      const requestData = pendingRequests.get(requestId);
      const { res: originalRes } = requestData;
      
      if (!originalRes.headersSent) {
        if (chunk && chunk.text) {
          // Send chunk data via SSE
          originalRes.write(`data: ${JSON.stringify({ 
            success: true, 
            chunk, 
            isStream: true 
          })}\n\n`);
        }
        
        if (isLastChunk) {
          // Complete the stream
          originalRes.write(`data: ${JSON.stringify({ 
            success: true, 
            isStream: true,
            isComplete: true,
            fullResponse 
          })}\n\n`);
          originalRes.end();
          pendingRequests.delete(requestId);
        }
      }
      
      res.json({ success: true });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Request not found or already processed' 
      });
    }
  });

  // Endpoint for frontend to submit non-streaming responses
  app.post('/api/puter-proxy/response/:requestId', (req, res) => {
    const requestId = parseInt(req.params.requestId);
    const responseData = req.body;
    
    console.log(`Received response for request ${requestId}:`, responseData);
    
    if (pendingRequests.has(requestId)) {
      const { res: originalRes } = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
      
      if (!originalRes.headersSent) {
        originalRes.json(responseData);
      }
      
      res.json({ success: true });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Request not found or already processed' 
      });
    }
  });
};