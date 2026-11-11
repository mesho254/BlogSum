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
    if (data.requires2FA) {
      return data;
    }
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const verify2FALogin = async (temp2FAToken, code) => {
    const { data } = await axiosInstance.post('/api/auth/login/2fa', { temp2FAToken, code });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await axiosInstance.post('/api/auth/register', { username, email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

 const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');  // Clears cookie on backend
    } catch (error) {
      console.error('Logout failed:', error);
    }
    localStorage.removeItem('userInfo');  // Clears localStorage
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verify2FALogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };