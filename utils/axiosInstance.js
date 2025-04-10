// 📁 utils/axiosInstance.js

import axios from 'axios';

// Token retrieval helper (only works on client side)
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  timeout: 60000,
  withCredentials: true, // 🔒 Needed for cross-origin requests that include cookies
});

// ✅ Add request interceptor for Authorization header
axiosInstance.interceptors.request.use(config => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("📡 Request:", config.method?.toUpperCase(), config.url);
  console.log("📬 Headers:", config.headers);

  return config;
}, error => {
  return Promise.reject(error);
});

// ✅ Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('🔒 Authentication failed');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

