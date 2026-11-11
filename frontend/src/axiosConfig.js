import axios from 'axios';

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    'http://localhost:5000',
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
});

// Response interceptor for auto-logout on 401 (expired token)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
