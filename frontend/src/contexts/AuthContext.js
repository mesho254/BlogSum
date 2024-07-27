import { createContext, useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';  // import the custom Axios instance

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await axiosInstance.post('/api/auth/login', { email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
  };

  const register = async (username, email, password) => {
    const { data } = await axiosInstance.post('/api/auth/register', { username, email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };