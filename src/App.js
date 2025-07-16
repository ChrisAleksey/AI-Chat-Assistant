import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import ErrorBoundary from './components/ErrorBoundary';
import theme from './styles/theme'; // Use the new theme we created

const App = () => (
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<ChatPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;