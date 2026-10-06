import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { setupApi, API_BASE_URL } from './apiConfig.js';
import { initMockApi } from './mockApi.js';

// Auto-switch between live Railway backend API and client demo mode
const isLiveBackend = Boolean(API_BASE_URL || import.meta.env.VITE_USE_LIVE_API === 'true' || import.meta.env.VITE_USE_MOCK === 'false');

if (isLiveBackend) {
  setupApi();
} else {
  initMockApi();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
