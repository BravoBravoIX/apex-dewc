// API Configuration for Team Dashboard
// Dynamically determines the orchestration service URL based on current hostname
const getApiHost = () => {
  const hostname = window.location.hostname;

  // For localhost development, use localhost:8001
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }

  // For production (AWS), use current hostname with port 8001
  return `http://${hostname}:8001`;
};

export const API_HOST = getApiHost();
