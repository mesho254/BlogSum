import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://blog-sum-3iej-d7dknd8oo-mesho254s-projects.vercel.app',
});

axiosInstance.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
});

export default axiosInstance;