// CG Chillcation API Configuration & Live Router
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const setupApi = () => {
  if (API_BASE_URL) {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      let url = typeof input === 'string' ? input : (input?.url || '');
      
      if (url.startsWith('/api')) {
        const fullUrl = `${API_BASE_URL}${url}`;
        return originalFetch(fullUrl, init);
      }
      
      return originalFetch(input, init);
    };
    console.log(`[API Gateway] Connected to live Railway backend at: ${API_BASE_URL}`);
  }
};
