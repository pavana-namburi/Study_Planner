import axios from 'axios';

export const TOKEN_KEY = 'studyplanner_token';
let unauthorizedHandler = null;

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

setAuthToken(localStorage.getItem(TOKEN_KEY));

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isLoginOrRegister =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register');

    if (status === 401 && !isLoginOrRegister && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);

export const getTest = async () => {
  const response = await api.get('/api/test');
  return response.data;
};

export default api;
