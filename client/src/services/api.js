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

export const getApiData = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  return (
    error.response.data?.message ||
    error.response.data?.error ||
    error.message ||
    fallback
  );
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isLoginOrRegister =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register');

    if (status === 401 && !isLoginOrRegister) {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);

      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }

    return Promise.reject(error);
  },
);

export const getTest = async () => {
  const response = await api.get('/api/test');
  return getApiData(response.data);
};

export default api;
