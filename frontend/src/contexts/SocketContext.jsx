import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { notification as antNotification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.REACT_APP_API_URL ||
      'http://localhost:5000';

    const newSocket = io(socketUrl, {
      withCredentials: true,
      extraHeaders: {
        'my-custom-header': 'abcd',
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', user._id);
      newSocket.emit('getOnlineUsers');
    });

    newSocket.on('onlineUsers', (activeUserIds) => {
      setOnlineUsers(Array.isArray(activeUserIds) ? activeUserIds : []);
    });

    newSocket.on('newNotification', (notifData) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      antNotification.open({
        message: 'New Notification',
        description: notifData?.message || 'You have received a new notification.',
        icon: <BellOutlined style={{ color: '#4f46e5' }} />,
        placement: 'topRight',
        duration: 4.5,
      });
    });

    newSocket.on('scheduledBlogPublished', () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

