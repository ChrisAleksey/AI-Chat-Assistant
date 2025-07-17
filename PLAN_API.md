# 📋 Plan: API OpenAI Compatible SIMPLIFICADA

## 🎯 Objetivo
Crear un endpoint OpenAI `/v1/chat/completions` que reutilice EXACTAMENTE la lógica del frontend que ya funciona perfecto. Cline será como otro "usuario" del chat.

## 🏗️ Arquitectura SIMPLE

### Concepto: **Reutilizar Todo lo que Funciona**
- **Frontend YA funciona** ✅ - Streaming, contexto, autenticación, todo perfecto
- **API = Frontend logic** 🔄 - Usar misma función que usa el chat
- **Solo formatear respuesta** 📝 - Convertir respuesta Puter → formato OpenAI
- **Un modelo: Claude Sonnet 4** 🎯 - Sin complicaciones

## 🔄 Flujo REAL

```
1. Usuario autentica en frontend → Puter session ready
2. Cline hace request → API usa MISMA session
3. API llama window.puter.ai.chat() → Misma función del frontend
4. Respuesta Puter → Convertir a formato OpenAI → Enviar a Cline
```

## 📋 Especificaciones OpenAI (Simplificadas)

### Request que recibiremos de Cline
```javascript
POST /v1/chat/completions
{
  "model": "claude-sonnet-4",
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "How are you?"}
  ],
  "stream": true,        // o false
  "temperature": 0.1,    // opcional
  "max_tokens": 4000     // opcional
}
```

### Response que enviaremos a Cline

**Streaming:**
```javascript
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"claude-sonnet-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"claude-sonnet-4","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"claude-sonnet-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

**Non-streaming:**
```javascript
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "claude-sonnet-4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello there! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## 🛠️ Implementación REAL (Simple)

### setupProxy.js - TODO EN UN ARCHIVO
```javascript
module.exports = function(app) {
  const express = require('express');
  app.use(express.json());

  // Endpoint principal - SOLO esto necesitamos
  app.post('/v1/chat/completions', async (req, res) => {
    try {
      const { messages, stream = false } = req.body;
      
      console.log('🔥 Cline request:', { messages: messages.length, stream });
      
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
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      authenticated: !!global.puterSession,
      model: 'claude-sonnet-4'
    });
  });

  // Models endpoint para Cline
  app.get('/v1/models', (req, res) => {
    res.json({
      object: "list",
      data: [{
        id: "claude-sonnet-4",
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "puter"
      }]
    });
  });
};
```

### Session Sharing (1 línea en ChatPage.js)
```javascript
// En handleSimulateAuth, después de setIsAuthenticated(true):
global.puterSession = window.puter;  // ¡Solo esto!
```

## 🎮 Configuración para Cline

```json
{
  "apiProvider": "openai",
  "baseURL": "http://localhost:3000",
  "apiKey": "sk-dummy-key",
  "model": "claude-sonnet-4"
}
```

## 📊 Beneficios del Enfoque Simplificado

1. **Reutiliza código probado** ✅ - Frontend ya funciona perfecto
2. **Implementación rápida** ⚡ - Solo 1 archivo, ~100 líneas
3. **Misma funcionalidad** 🎯 - Streaming, contexto, todo igual
4. **Fácil debugging** 🔍 - Console logs simples
5. **Claude Sonnet 4 siempre** 🤖 - Sin confusión de modelos

## ⏱️ Tiempo estimado: 30 minutos

1. **Crear setupProxy.js** (20 min)
2. **Agregar global.puterSession** (2 min)  
3. **Test con Cline** (8 min)

## ❓ Próximo Paso

¿Empezamos directo con la implementación? Solo necesitamos crear `setupProxy.js` y una línea en `ChatPage.js`. 🚀

---

*Plan simplificado - reutilizar lo que funciona, agregar solo formateo OpenAI*