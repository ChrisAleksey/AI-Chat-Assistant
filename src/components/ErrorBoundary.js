import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
            padding: 3,
          }}
        >
          <Alert 
            severity="error" 
            icon={<BugReport />}
            sx={{
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid #ff4444',
              color: '#ffffff',
              mb: 3,
              maxWidth: '600px',
              '& .MuiAlert-message': {
                color: '#ffffff'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The application encountered an unexpected error. This might be due to:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Script loading conflicts (Puter script loaded multiple times)</li>
              <li>Authentication issues with Puter API</li>
              <li>Network connectivity problems</li>
            </ul>
          </Alert>

          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={this.handleReload}
            sx={{
              backgroundColor: '#00ff9d',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#00cc7d',
                boxShadow: '0 0 15px rgba(0, 255, 157, 0.3)',
              }
            }}
          >
            Reload Application
          </Button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 1,
                maxWidth: '800px',
                overflow: 'auto',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#ff4444', mb: 1 }}>
                Error Details (Development Mode):
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;