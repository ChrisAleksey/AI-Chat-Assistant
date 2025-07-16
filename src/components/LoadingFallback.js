import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingFallback({ message = "Loading..." }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#343541',
        color: '#ffffff',
        gap: 2,
      }}
    >
      <CircularProgress 
        sx={{ 
          color: '#00ff9d',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} 
        size={60}
        thickness={4}
      />
      <Typography variant="h6" sx={{ color: '#00ff9d' }}>
        {message}
      </Typography>
    </Box>
  );
}