const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const openaiRoutes = require('./routes/openai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/v1', openaiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'OpenAI compatible API server is running' });
});

app.listen(PORT, () => {
  console.log(`OpenAI compatible API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`OpenAI endpoint: http://localhost:${PORT}/v1/chat/completions`);
});