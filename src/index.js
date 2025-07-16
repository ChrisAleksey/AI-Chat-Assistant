import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupErrorHandlers } from './utils/errorHandler';

// Setup enhanced error handling
setupErrorHandlers();

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the error from propagating and causing the generic "Script error"
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the error from propagating
  event.preventDefault();
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// Temporarily disable StrictMode to avoid React 19 compatibility issues
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
