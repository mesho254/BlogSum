import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Spin, Card, Button, notification as antNotification } from 'antd';
import Navbar from './NavBar';

const Notification = () => {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRead, setIsRead] = useState(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/notifications/${id}`);
        setNotification(data);
        setIsRead(data.read);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notification:', error);
      }
    };

    fetchNotification();
  }, [id]);

  const handleMarkAsRead = async () => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`);
      setIsRead(true);
      antNotification.success({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async () => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/unread`);
      setIsRead(false);
      antNotification.success({ message: 'Notification marked as unread' });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  if (loading) {
    return <Spin />;
  }

  if (!notification) {
    return <div>Notification not found.</div>;
  }

  return (
    <>
    <Navbar/>
    <Card title="Notification Details" style={{margin:"240px auto", minWidth:"400px", maxWidth:"800px"}}>
      <p>{notification.message}</p>
      <p>{new Date(notification.createdAt).toLocaleString()}</p>
      {isRead ? (
        <Button type="primary" onClick={handleMarkAsUnread}>
          Mark as Unread
        </Button>
      ) : (
        <Button type="primary" onClick={handleMarkAsRead}>
          Mark as Read
        </Button>
      )}
    </Card>
    </>
  );
};

export default Notification;
