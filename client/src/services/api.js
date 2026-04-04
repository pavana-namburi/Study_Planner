import axios from 'axios';

// Create axios instance with base URL
// In development, Vite proxy handles /api routes
// In production, use the full backend URL
const api = axios.create({
  baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'),
});

// Function to call GET /api/test
export const testServer = async () => {
  try {
    const response = await api.get('/api/test');
    return response.data;
  } catch (error) {
    console.error('Error testing server:', error);
    throw error;
  }
};

// Export the axios instance for future API calls
export default api;