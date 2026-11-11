import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && (userInfo.accessToken || userInfo.token)) {
    config.headers.Authorization = `Bearer ${userInfo.accessToken || userInfo.token}`;
  }
  return config;
});

// Flag and subscriber queue for handling concurrent requests during silent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints (login, register, refresh-token, 2fa)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/register') ||
      originalRequest?.url?.includes('/api/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const refreshToken = userInfo?.refreshToken;

      try {
        const { data } = await axios.post(
          `${baseURL}/api/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken || refreshToken;

        // Persist fresh tokens in localStorage
        const updatedUserInfo = {
          ...(userInfo || {}),
          ...(data.user || {}),
          token: newAccessToken,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

        // Update default and current request headers
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('userInfo');
        // Only redirect to login if currently on a protected route
        if (
          typeof window !== 'undefined' &&
          !['/login', '/register', '/password-reset', '/'].some((path) =>
            window.location.pathname.startsWith(path)
          )
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
