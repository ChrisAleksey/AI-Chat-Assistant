import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

export default function AuthStatus({ isPuterReady }) {
  const [authStatus, setAuthStatus] = useState('checking');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!isPuterReady || !window.puter) {
        setAuthStatus('not-ready');
        return;
      }

      try {
        // Check if auth methods are available
        if (!window.puter.auth) {
          setAuthStatus('not-authenticated');
          return;
        }

        // Check if user is signed in
        if (window.puter.auth.isSignedIn) {
          setAuthStatus('authenticated');
          // Try to get user info
          try {
            const user = await window.puter.auth.getUser();
            setUserInfo(user);
          } catch (error) {
            console.warn('Could not get user info:', error);
            // Still consider authenticated if isSignedIn is true
          }
        } else {
          setAuthStatus('not-authenticated');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus('error');
      }
    };

    checkAuthStatus();
  }, [isPuterReady]);

  const handleSignIn = async () => {
    try {
      if (!window.puter || !window.puter.auth) {
        throw new Error('Puter auth not available');
      }
      await window.puter.auth.signIn();
      setAuthStatus('authenticated');
    } catch (error) {
      console.error('Sign in failed:', error);
      setAuthStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'authenticated':
        return <CheckCircle sx={{ color: '#00ff9d' }} />;
      case 'not-authenticated':
        return <Warning sx={{ color: '#ffa500' }} />;
      case 'error':
        return <Error sx={{ color: '#ff4444' }} />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (authStatus) {
      case 'checking':
        return 'Checking authentication...';
      case 'not-ready':
        return 'Puter is loading...';
      case 'authenticated':
        return userInfo ? `Signed in as ${userInfo.username || userInfo.email || 'User'}` : 'Authenticated';
      case 'not-authenticated':
        return 'Not signed in to Puter';
      case 'error':
        return 'Authentication error';
      default:
        return 'Unknown status';
    }
  };

  const getSeverity = () => {
    switch (authStatus) {
      case 'authenticated':
        return 'success';
      case 'not-authenticated':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity={getSeverity()}
        icon={getStatusIcon()}
        action={
          authStatus === 'not-authenticated' ? (
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleSignIn}
              sx={{ 
                color: '#ffa500',
                '&:hover': {
                  backgroundColor: 'rgba(255, 165, 0, 0.1)'
                }
              }}
            >
              Sign In
            </Button>
          ) : null
        }
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          border: `1px solid ${
            authStatus === 'authenticated' ? '#00ff9d' : 
            authStatus === 'not-authenticated' ? '#ffa500' : '#ff4444'
          }`,
          '& .MuiAlert-message': {
            color: '#ffffff'
          }
        }}
      >
        <Typography variant="body2">
          {getStatusMessage()}
        </Typography>
      </Alert>
    </Box>
  );
}