// API Configuration
// For local development: uses localhost
// For production: uses current hostname with port 8001
const getApiBaseUrl = () => {
  // Check if running in development (Vite dev server)
  if (import.meta.env.DEV) {
    return 'http://localhost:8001';
  }

  // Production: use current host (AWS EC2 IP or domain)
  const hostname = window.location.hostname;
  return `http://${hostname}:8001`;
};

export const API_BASE_URL = getApiBaseUrl();
