import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import axiosInstance from '../axiosConfig';
import Navbar from './NavBar';
import { List, Input, Button, Layout, Typography, Avatar, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import moment from 'moment';

const { Sider, Content } = Layout;
const { Title } = Typography;

const Message = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/allUsers', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (user && user.token) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        extraHeaders: {
          "my-custom-header": "abcd"
        }
      });
      setSocket(newSocket);

      newSocket.on('message', (newMessage) => {
        if (newMessage.sender._id === selectedUser._id || newMessage.receiver._id === selectedUser._id) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          if (newMessage.sender._id !== user._id) {
            markMessagesAsRead(selectedUser._id);  // Mark the messages as read
          }
        }
      });

      newSocket.on('read', ({ userId }) => {
        setMessages((prevMessages) => prevMessages.map(msg => 
          msg.sender._id === userId ? { ...msg, read: true } : msg
        ));
      });

      return () => {
        newSocket.off('message');
        newSocket.off('read');
        newSocket.close();
      };
    }
  }, [user, selectedUser]);

  const fetchMessages = async (userId) => {
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(res.data);

      // Mark messages as read
      await markMessagesAsRead(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const markMessagesAsRead = async (userId) => {
    try {
      await axiosInstance.post('/api/messages/markAsRead', { userId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      console.error('No user selected for messaging.');
      return;
    }

    const newMessage = {
      receiverId: selectedUser._id,
      message,
    };

    try {
      const { data } = await axiosInstance.post('/api/messages', newMessage, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (socket) {
        socket.emit('message', data);
      }

      // Add the new message to the local state
      setMessages((prevMessages) => [...prevMessages, data]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchMessages(user._id);
    localStorage.setItem('selectedUserId', user._id);
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem('selectedUserId');
    if (savedUserId && users.length > 0) {
      const user = users.find(u => u._id === savedUserId);
      if (user) {
        setSelectedUser(user);
        fetchMessages(savedUserId);
      }
    }
  }, [users]);

  const renderMessageStatus = (message) => {
    if (message.read) {
      return 'Read';
    } else if (message.delivered) {
      return 'Delivered';
    } else {
      return 'Unread';
    }
  };

  const groupMessagesByDate = (messages) => {
    const groupedMessages = {};

    messages.forEach((msg) => {
      const date = moment(msg.createdAt).startOf('day').format('YYYY-MM-DD');
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(msg);
    });

    return groupedMessages;
  };

  const renderMessages = () => {
    const groupedMessages = groupMessagesByDate(messages);

    return Object.keys(groupedMessages).map((date) => {
      let header = moment(date).calendar(null, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        lastWeek: 'dddd',
        sameElse: 'MMMM Do YYYY'
      });

      return (
        <div key={date}>
          <div style={{ textAlign: 'center', margin: '10px 0', fontWeight: 'bold' }}>{header}</div>
          {groupedMessages[date].map((msg) => (
            <div key={msg._id} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start'
            }}>
              <Avatar src={msg.sender.profilePicture} icon={<UserOutlined />} />
              <div style={{
                maxWidth: '60%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: msg.sender._id === user._id ? '#1890ff' : '#f0f0f0',
                color: msg.sender._id === user._id ? '#fff' : '#000',
                marginLeft: msg.sender._id === user._id ? '0' : '10px',
                marginRight: msg.sender._id === user._id ? '10px' : '0'
              }}>
                <span style={{ fontWeight: 'bold', marginBottom: '5px' }}>{msg.sender._id === user._id ? 'You' : msg.sender.username}</span>
                <p style={{ margin: '0' }}>{msg.message}</p>
                <small>{moment(msg.createdAt).format('MMMM Do YYYY, h:mm:ss a')}</small>
                <Badge count={renderMessageStatus(msg)} style={{ backgroundColor: msg.read ? '#52c41a' : '#faad14', marginLeft: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout style={{ marginTop: "90px" }}>
        <Sider width={200} style={{ backgroundColor: '#f0f2f5', maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}>
          <Title level={3} style={{ padding: '16px' }}>Users</Title>
          <List
            itemLayout="horizontal"
            dataSource={users}
            renderItem={(userItem) => (
              <List.Item onClick={() => handleUserClick(userItem)} style={{ cursor: 'pointer' }}>
                <List.Item.Meta
                  avatar={<Avatar src={userItem.profilePicture} icon={<UserOutlined />} />}
                  title={userItem._id === user._id ? 'You' : userItem.username}
                  description={messages.find(msg => (msg.sender._id === userItem._id || msg.receiver._id === userItem._id))?.message || 'No messages yet'}
                />
              </List.Item>
            )}
          />
        </Sider>
        <Layout style={{ padding: '24px', flex: 1 }}>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div style={{ padding: '24px', minHeight: 360 }}>
              {selectedUser && (
                <>
                  <Title level={4}>Chat with {selectedUser._id === user._id ? 'yourself' : selectedUser.username}</Title>
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '4px',
                    backgroundColor: '#fff'
                  }}>
                    {renderMessages()}
                  </div>
                  <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: '20px' }}>
                    <Input
                      type="text"
                      placeholder="Message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      style={{ marginRight: '10px' }}
                    />
                    <Button type="primary" htmlType="submit">Send</Button>
                  </form>
                </>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Message;
