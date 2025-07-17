import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, CircularProgress } from '@mui/material';

const Chatbox = ({ onNewMessage }) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('model1');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  // Dynamically load the puter script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSend = async () => {
    if (!input) return; // Prevent sending empty messages

    setLoading(true);
    setResponse(''); // Clear the previous response before fetching a new one

    try {
      if (window.puter) {
        const options = {
          stream: true,
          model: model === 'model1' ? 'claude-sonnet-4' : undefined, // Specify 'claude-sonnet-4' for model1, leave undefined for model2
        };

        const responseStream = await window.puter.ai.chat(input, options);

        let result = '';
        for await (const part of responseStream) {
          result += part?.text || '';
          setResponse(result); // Update response in real-time
        }

        // Notify parent component about the new message
        onNewMessage({ input, response: result });
      } else {
        console.error('Puter AI script not loaded.');
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      setResponse('Error: Unable to fetch a response from the selected model.');
    }

    setLoading(false);
    setInput(''); // Clear the input field after sending
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {/* Input Box */}
      <TextField
        label="Enter your message"
        variant="outlined"
        fullWidth
        multiline
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading} // Disable input while fetching response
      />

      {/* Model Selector and Send Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading} // Prevent changing models while loading
        >
          <MenuItem value="model1">Model 1 (Claude)</MenuItem>
          <MenuItem value="model2">Model 2 (Default)</MenuItem>
        </Select>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Send'}
        </Button>
      </Box>

      {/* Response Box */}
      {response && (
        <Box
          sx={{
            p: 2,
            mt: 2,
            border: '1px solid #555',
            borderRadius: '4px',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            whiteSpace: 'pre-wrap',
          }}
        >
          {response}
        </Box>
      )}
    </Box>
  );
};

export default Chatbox;
