module.exports = function(app) {
  const express = require('express');
  app.use(express.json());

  // Handler function para ambas rutas
  const handleChatCompletions = async (req, res) => {
    try {
      const { messages, stream = false } = req.body;
      
      console.log('🔥 Cline request:', { 
        path: req.path,
        messages: messages?.length || 0, 
        stream,
        hasGlobalSession: !!global.puterSession 
      });
      
      // Verificar que Puter esté disponible (mismo check del frontend)
      if (!global.puterSession) {
        return res.status(401).json({
          error: {
            message: "Puter session not available. Please authenticate in the chat first.",
            type: "authentication_error"
          }
        });
      }

      // Usar EXACTAMENTE la misma lógica del frontend
      const options = {
        stream: stream,
        model: 'claude-sonnet-4'  // Siempre Claude Sonnet 4
      };

      if (stream) {
        // Streaming response - igual que el frontend
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const responseStream = await global.puterSession.ai.chat(messages, options);
        let isFirstChunk = true;
        const requestId = 'chatcmpl-' + Date.now();

        for await (const part of responseStream) {
          const chunk = {
            id: requestId,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "claude-sonnet-4",
            choices: [{
              index: 0,
              delta: isFirstChunk 
                ? { role: "assistant", content: part.text || "" }
                : { content: part.text || "" },
              finish_reason: null
            }]
          };
          
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          isFirstChunk = false;
        }

        // Final chunk
        const finalChunk = {
          id: requestId,
          object: "chat.completion.chunk", 
          created: Math.floor(Date.now() / 1000),
          model: "claude-sonnet-4",
          choices: [{
            index: 0,
            delta: {},
            finish_reason: "stop"
          }]
        };
        
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();

      } else {
        // Non-streaming - también igual que el frontend
        const responseStream = await global.puterSession.ai.chat(messages, options);
        let fullResponse = '';
        
        for await (const part of responseStream) {
          fullResponse += part?.text || '';
        }

        const response = {
          id: 'chatcmpl-' + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "claude-sonnet-4",
          choices: [{
            index: 0,
            message: {
              role: "assistant",
              content: fullResponse
            },
            finish_reason: "stop"
          }],
          usage: {
            prompt_tokens: JSON.stringify(messages).length / 4, // Aproximado
            completion_tokens: fullResponse.length / 4,
            total_tokens: (JSON.stringify(messages).length + fullResponse.length) / 4
          }
        };

        res.json(response);
      }

    } catch (error) {
      console.error('❌ API Error:', error);
      res.status(500).json({
        error: {
          message: error.message,
          type: "api_error"
        }
      });
    }
  };

  // Registrar ambas rutas para compatibilidad
  app.post('/v1/chat/completions', handleChatCompletions);
  app.post('/chat/completions', handleChatCompletions);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      authenticated: !!global.puterSession,
      model: 'claude-sonnet-4'
    });
  });

  // Models endpoint para Cline (ambas rutas)
  const handleModels = (req, res) => {
    res.json({
      object: "list",
      data: [{
        id: "claude-sonnet-4",
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "puter"
      }]
    });
  };
  
  app.get('/v1/models', handleModels);
  app.get('/models', handleModels);
};