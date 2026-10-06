// CG Chillcation Live Railway Backend API Gateway
const DEFAULT_RAILWAY_BACKEND = 'https://web-production-578d3.up.railway.app';

export const getApiBaseUrl = () => {
  // 1. Explicit environment variable override if provided
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. In browser environment
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';

    // If running locally in development, use local server or relative proxy
    if (isLocalhost) {
      return '';
    }

    // When deployed on Vercel or any live domain, direct all data requests to Railway backend
    return DEFAULT_RAILWAY_BACKEND;
  }

  return DEFAULT_RAILWAY_BACKEND;
};

export const API_BASE_URL = getApiBaseUrl();

export const setupApi = () => {
  // Clean up any legacy mock database in localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('cg_chillcation_mock_db_v3');
      localStorage.removeItem('cg_chillcation_mock_db_v2');
      localStorage.removeItem('cg_chillcation_mock_db');
    } catch (e) {
      // Ignore
    }
  }

  // Patch window.fetch to route all /api requests to Railway backend
  if (typeof window !== 'undefined' && API_BASE_URL) {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      let url = typeof input === 'string' ? input : (input?.url || '');

      if (url.startsWith('/api')) {
        const fullUrl = `${API_BASE_URL}${url}`;
        return originalFetch(fullUrl, init);
      }

      return originalFetch(input, init);
    };
    console.log(`[CG Chillcation] Connected directly to live Railway backend: ${API_BASE_URL}`);
  }
};
