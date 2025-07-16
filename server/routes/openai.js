const express = require('express');
const router = express.Router();
const puterAI = require('../middleware/puter');

// Endpoint to set the Puter session token
router.post('/auth/puter', (req, res) => {
  const { token } = req.body;
  puterAI.setSessionToken(token);
  res.json({ success: true, message: 'Puter session token set' });
});

// OpenAI compatible chat completions endpoint
router.post('/chat/completions', async (req, res) => {
  try {
    const { model, messages, stream = false, max_tokens = 512, temperature = 0.1 } = req.body;

    // Check if we have a Puter session
    if (!puterAI.isReady()) {
      return res.status(401).json({
        error: {
          message: 'No Puter session available. Please authenticate first.',
          type: 'authentication_error'
        }
      });
    }

    // Extract the last user message (OpenAI sends conversation history)
    const userMessage = messages.filter(msg => msg.role === 'user').pop();
    if (!userMessage) {
      return res.status(400).json({
        error: {
          message: 'No user message found in the conversation',
          type: 'invalid_request_error'
        }
      });
    }

    // Configure Puter AI options
    const puterOptions = {
      stream: stream,
      model: model === 'gpt-3.5-turbo' || model === 'gpt-4' ? 'claude-sonnet-4' : undefined,
    };

    if (stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const response = await puterAI.callPuterAI(userMessage.content, puterOptions);
        
        // Check if response is streaming generator or direct response
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
          // Handle async generator (streaming)
          let isFirstChunk = true;
          
          for await (const part of response) {
            const chunk = {
              id: 'chatcmpl-' + Date.now(),
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: model,
              choices: [{
                index: 0,
                delta: isFirstChunk 
                  ? { role: 'assistant', content: part.text || '' }
                  : { content: part.text || '' },
                finish_reason: null
              }]
            };
            
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            isFirstChunk = false;
          }
        } else {
          // Handle direct response - split into chunks for streaming
          const responseText = response || '';
          const words = responseText.split(' ');
          let isFirstChunk = true;
          
          for (let i = 0; i < words.length; i++) {
            const chunk = {
              id: 'chatcmpl-' + Date.now(),
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: model,
              choices: [{
                index: 0,
                delta: isFirstChunk 
                  ? { role: 'assistant', content: words[i] + ' ' }
                  : { content: words[i] + ' ' },
                finish_reason: null
              }]
            };
            
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            isFirstChunk = false;
            
            // Add small delay between words
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        // Send final chunk
        const finalChunk = {
          id: 'chatcmpl-' + Date.now(),
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }]
        };
        
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        
      } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: {"error": "${error.message}"}\n\n`);
        res.end();
      }
    } else {
      // Handle non-streaming response
      try {
        const response = await puterAI.callPuterAI(userMessage.content, puterOptions);
        
        const completion = {
          id: 'chatcmpl-' + Date.now(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: response
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: userMessage.content.length,
            completion_tokens: response.length,
            total_tokens: userMessage.content.length + response.length
          }
        };
        
        res.json(completion);
      } catch (error) {
        console.error('Non-streaming error:', error);
        res.status(500).json({
          error: {
            message: error.message,
            type: 'server_error'
          }
        });
      }
    }
  } catch (error) {
    console.error('General error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'server_error'
      }
    });
  }
});

// Health check endpoint
router.get('/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'puter'
      },
      {
        id: 'gpt-4',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'puter'
      }
    ]
  });
});

module.exports = router;