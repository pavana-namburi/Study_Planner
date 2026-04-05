import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTest = async () => {
  const response = await api.get('/api/test');
  return response.data;
};

export default api;
