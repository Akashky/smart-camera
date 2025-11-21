import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if this is a WASM initialization error
    const isWasmError = error.message?.includes('Module.arguments') || 
                       error.message?.includes('WASM') ||
                       error.message?.includes('Aborted');
    
    if (isWasmError) {
      this.setState(prev => ({
        errorCount: prev.errorCount + 1
      }));
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorCount: 0
    });
    // Hard refresh the page
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      const isWasmError = this.state.error?.message?.includes('Module.arguments') || 
                         this.state.error?.message?.includes('WASM') ||
                         this.state.error?.message?.includes('Aborted');

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 2,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              mb={2}
              sx={{ color: '#d32f2f' }}
            >
              {isWasmError ? 'WASM Module Error' : 'Application Error'}
            </Typography>

            <Typography variant="body1" mb={3} color="text.secondary">
              {isWasmError
                ? 'Failed to initialize the camera module. This might be due to browser compatibility or cache issues.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </Typography>

            <Box
              sx={{
                background: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                mb: 3,
                textAlign: 'left',
                maxHeight: 150,
                overflow: 'auto',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            >
              <Typography variant="caption" component="div">
                {this.state.error?.message || 'Unknown error'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleReset}
                fullWidth
              >
                {isWasmError ? 'Hard Refresh & Retry' : 'Refresh Page'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/'}
                fullWidth
              >
                Go Home
              </Button>
            </Box>

            {this.state.errorCount > 2 && (
              <Typography
                variant="caption"
                display="block"
                mt={2}
                sx={{ color: '#ff6f00' }}
              >
                ⚠️ Multiple errors detected. Try clearing browser cache or using an incognito window.
              </Typography>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
