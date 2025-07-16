import React from 'react';
import { Box, Button, Alert, Typography, CircularProgress } from '@mui/material';
import { Login, CheckCircle } from '@mui/icons-material';

export default function AuthButton({ 
  isPuterReady, 
  isAuthenticated, 
  isAuthenticating, 
  onSignIn 
}) {
  if (!isPuterReady) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert 
          severity="info"
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid #2196f3',
            '& .MuiAlert-message': { color: '#ffffff' }
          }}
        >
          <Typography variant="body2">
            Loading Puter...
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (isAuthenticated) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert 
          severity="success"
          icon={<CheckCircle sx={{ color: '#00ff9d' }} />}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid #00ff9d',
            '& .MuiAlert-message': { color: '#ffffff' }
          }}
        >
          <Typography variant="body2">
            ✅ Authenticated! You can now chat with the AI.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity="warning"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid #ffa500',
          '& .MuiAlert-message': { color: '#ffffff' }
        }}
        action={
          <Button
            variant="contained"
            startIcon={isAuthenticating ? <CircularProgress size={16} color="inherit" /> : <Login />}
            onClick={onSignIn}
            disabled={isAuthenticating}
            sx={{
              backgroundColor: '#00ff9d',
              color: '#000000',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#00cc7d',
                boxShadow: '0 0 15px rgba(0, 255, 157, 0.3)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(0, 255, 157, 0.5)',
                color: 'rgba(0, 0, 0, 0.5)',
              }
            }}
          >
            {isAuthenticating ? 'Signing In...' : 'Sign In'}
          </Button>
        }
      >
        <Typography variant="body2">
          {isAuthenticating 
            ? 'Establishing authentication...' 
            : 'Click "Sign In" to authenticate and start chatting'
          }
        </Typography>
      </Alert>
    </Box>
  );
}