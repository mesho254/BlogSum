import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'https://blog-sum-rna1.vercel.app/',
  baseURL: 'https://blogsum123.onrender.com',
  // baseURL: 'http://localhost:5000',
});

axiosInstance.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
});

// New: Response interceptor for auto-logout on 401 (expired token)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userInfo');
      // Note: Cookie will expire automatically or be cleared on manual logout
      window.location.href = '/login';  // Optional: Redirect to login
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
