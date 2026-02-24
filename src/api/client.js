import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/.netlify/functions';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Add JWT to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (invalid token)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Authentication failed. Clearing token.');
      localStorage.removeItem('auth_token');
      // Could redirect to login here if needed
    }
    return Promise.reject(error);
  }
);

export default client;
