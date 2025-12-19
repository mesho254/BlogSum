import React, { useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import axiosInstance from '../axiosConfig';
import Navbar from './NavBar';
import { List, Input, Button, Layout, Typography, Avatar, Tabs, Modal, Popover, Popconfirm } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckOutlined, PlusOutlined, SmileOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import moment from 'moment';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const { Sider, Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const Message = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelMembers, setChannelMembers] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/allUsers', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setUsers(res.data.map(u => ({ ...u, type: 'user' })));
      } catch (err) {
        console.error(err);
      }
    };

    const fetchChannels = async () => {
      try {
        const res = await axiosInstance.get('/api/channels', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setChannels(res.data.map(c => ({ ...c, type: 'channel' })));
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
    fetchChannels();
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

      newSocket.emit('join', user._id);

      newSocket.on('message', (newMessage) => {
        const isChannel = !!newMessage.channel;
        const isFromMe = newMessage.sender._id === user._id;

        if (!isFromMe) {
          const targetId = isChannel ? newMessage.channel : newMessage.sender._id;
          markMessagesAsDelivered(targetId, isChannel);
          if (selectedItem && selectedItem._id === (isChannel ? newMessage.channel : newMessage.receiver._id)) {
            markMessagesAsRead(targetId, isChannel);
          }
        }

        const isCurrentChat =
          (isChannel && selectedItem?.type === 'channel' && newMessage.channel === selectedItem?._id) ||
          (!isChannel && selectedItem?.type === 'user' && (
            newMessage.sender._id === selectedItem?._id ||
            newMessage.receiver._id === selectedItem?._id
          ));

        if (!isCurrentChat) return;

        setMessages((prevMessages) => {
          if (prevMessages.some(m => m._id === newMessage._id)) {
            return prevMessages;
          }

          if (!isChannel && isFromMe) {
            return prevMessages;
          }

          return [...prevMessages, newMessage];
        });
      });

      newSocket.on('readUpdate', ({ userId, targetId, isChannel }) => {
        if (selectedItem && selectedItem._id === targetId && selectedItem.type === (isChannel ? 'channel' : 'user')) {
          setMessages((prevMessages) => prevMessages.map(msg => {
            if ((isChannel ? msg.channel : msg.sender._id) === targetId) {
              if (!msg.readBy.includes(userId)) {
                return { ...msg, readBy: [...msg.readBy, userId] };
              }
            }
            return msg;
          }));
        }
      });

      newSocket.on('deliveredUpdate', ({ userId, targetId, isChannel }) => {
        if (selectedItem && selectedItem._id === targetId && selectedItem.type === (isChannel ? 'channel' : 'user')) {
          setMessages((prevMessages) => prevMessages.map(msg => {
            if ((isChannel ? msg.channel : msg.sender._id) === targetId) {
              if (!msg.deliveredTo.includes(userId)) {
                return { ...msg, deliveredTo: [...msg.deliveredTo, userId] };
              }
            }
            return msg;
          }));
        }
      });

      newSocket.on('reaction', ({ messageId, reaction }) => {
        setMessages((prevMessages) => prevMessages.map(msg => {
          if (msg._id === messageId) {
            const index = msg.reactions.findIndex(r => r.user._id === reaction.user._id);
            let newReactions = [...msg.reactions];
            if (index > -1) {
              newReactions[index] = reaction;
            } else {
              newReactions.push(reaction);
            }
            return { ...msg, reactions: newReactions };
          }
          return msg;
        }));
      });

      newSocket.on('deleteMessage', ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
      });

      return () => {
        newSocket.off('message');
        newSocket.off('readUpdate');
        newSocket.off('deliveredUpdate');
        newSocket.off('reaction');
        newSocket.off('deleteMessage');
        newSocket.close();
      };
    }
  }, [user, selectedItem]);

  useEffect(() => {
    if (socket && channels.length > 0) {
      channels.forEach(channel => {
        if (channel.members.some(m => m.toString() === user._id.toString())) {
          socket.emit('joinChannel', channel._id);
        }
      });
    }
  }, [channels, socket]);

  const fetchMessages = async (id, type) => {
    try {
      const url = type === 'user' ? `/api/messages/${id}` : `/api/messages/channel/${id}`;
      const res = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(res.data.map(msg => ({ ...msg, readBy: msg.readBy || [], deliveredTo: msg.deliveredTo || [] })));

      if (type === 'channel') {
        const channelRes = await axiosInstance.get(`/api/channels/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setChannelMembers(channelRes.data.members.map(m => m._id));
      } else {
        setChannelMembers([]);
      }

      await markMessagesAsDelivered(id, type === 'channel');
      await markMessagesAsRead(id, type === 'channel');
    } catch (err) {
      console.error(err);
    }
  };

  const markMessagesAsRead = async (targetId, isChannel = false) => {
    try {
      await axiosInstance.post('/api/messages/markAsRead', { targetId, isChannel }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const markMessagesAsDelivered = async (targetId, isChannel = false) => {
    try {
      await axiosInstance.post('/api/messages/markAsDelivered', { targetId, isChannel }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) {
      console.error('Error marking messages as delivered:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedItem || (!message.trim() && !file)) {
      return;
    }

    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      sender: { _id: user._id, username: 'You', profilePicture: user.profilePicture || null },
      [selectedItem.type === 'channel' ? 'channel' : 'receiver']: { _id: selectedItem._id },
      message,
      createdAt: new Date().toISOString(),
      deliveredTo: [],
      readBy: [],
      status: 'sending',
      fileUrl: filePreview || null,
      reactions: []
    };

    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setMessage('');
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    try {
      const formData = new FormData();
      formData.append(selectedItem.type === 'channel' ? 'channelId' : 'receiverId', selectedItem._id);
      formData.append('message', message);
      if (file) {
        formData.append('attachment', file);
      }
      const { data } = await axiosInstance.post('/api/messages', formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === tempId ? { ...data, status: 'sent' } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const { data } = await axiosInstance.post(`/api/messages/react/${messageId}`, { emoji }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? data : msg
        )
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleItemClick = async (item) => {
    if (item.type === 'channel' && !item.members.some(m => m.toString() === user._id.toString())) {
      return;
    }
    if (item.type === 'channel') {
      const res = await axiosInstance.get(`/api/channels/${item._id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSelectedItem({ ...res.data, type: 'channel' });
      setChannelMembers(res.data.members.map(m => m._id));
      fetchMessages(item._id, 'channel');
    } else {
      setSelectedItem(item);
      setChannelMembers([]);
      fetchMessages(item._id, 'user');
    }
    localStorage.setItem('selectedItem', JSON.stringify(item));
  };

  useEffect(() => {
    const savedItem = localStorage.getItem('selectedItem');
    if (savedItem) {
      const parsed = JSON.parse(savedItem);
      handleItemClick(parsed);
    }
  }, [users, channels]);

  const createChannel = async () => {
    try {
      const res = await axiosInstance.post('/api/channels', { name: channelName }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setChannels(prev => [...prev, { ...res.data, type: 'channel' }]);
      setShowModal(false);
      setChannelName('');
    } catch (err) {
      console.error(err);
    }
  };

  const joinChannel = async (id) => {
    try {
      const res = await axiosInstance.post(`/api/channels/join/${id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setChannels(prev => prev.map(c => c._id === id ? { ...res.data, type: 'channel' } : c));
      socket.emit('joinChannel', id);
    } catch (err) {
      console.error(err);
    }
  };

  const leaveChannel = async (id) => {
    try {
      const res = await axiosInstance.post(`/api/channels/leave/${id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setChannels(prev => prev.map(c => c._id === id ? { ...res.data, type: 'channel' } : c));
      if (selectedItem?._id === id) {
        setSelectedItem(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (msg) => {
    if (msg.status === 'sending') {
      return <ClockCircleOutlined style={{ color: 'grey', fontSize: '12px' }} />;
    }
    const isGroup = !!msg.channel;
    const numMembers = isGroup ? channelMembers.length : 2;
    const deliveredCount = msg.deliveredTo.length;
    const readCount = msg.readBy.length;
    const expected = numMembers - 1;
    if (deliveredCount < expected) {
      return <CheckOutlined style={{ color: 'grey', fontSize: '12px' }} />;
    }
    const tickColor = readCount >= expected ? 'blue' : 'grey';
    return (
      <span>
        <CheckOutlined style={{ color: tickColor, fontSize: '12px', marginLeft: '-5px' }} />
        <CheckOutlined style={{ color: tickColor, fontSize: '12px' }} />
      </span>
    );
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

  const getReactionCounts = (reactions) => {
    const counts = {};
    const usersByEmoji = {};
    reactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      if (!usersByEmoji[r.emoji]) usersByEmoji[r.emoji] = [];
      usersByEmoji[r.emoji].push(r.user);
    });
    return { counts, usersByEmoji };
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
          {groupedMessages[date].map((msg) => {
            const { counts, usersByEmoji } = getReactionCounts(msg.reactions);
            return (
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
                  marginRight: msg.sender._id === user._id ? '10px' : '0',
                  position: 'relative'
                }}>
                  <span style={{ fontWeight: 'bold', marginBottom: '5px' }}>{msg.sender._id === user._id ? 'You' : msg.sender.username}</span>
                  {msg.fileUrl && <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '100%', marginBottom: '5px', borderRadius: '8px' }} />}
                  <p style={{ margin: '0' }}>{msg.message}</p>
                  <small style={{ display: 'block', textAlign: 'right', fontSize: '11px' }}>
                    {moment(msg.createdAt).format('h:mm a')}
                    {msg.sender._id === user._id && (
                      <span style={{ marginLeft: '5px' }}>
                        {getStatusIcon(msg)}
                      </span>
                    )}
                  </small>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    {Object.entries(counts).map(([emoji, count]) => (
                      <Popover key={emoji} content={
                        <List size="small" dataSource={usersByEmoji[emoji]} renderItem={u => <List.Item>{u.username}</List.Item>} />
                      } trigger="click">
                        <span style={{ cursor: 'pointer', fontSize: '12px' }}>{emoji} {count}</span>
                      </Popover>
                    ))}
                  </div>
                  <Button size="small" onClick={() => setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id)}>React</Button>
                  {showReactionPicker === msg._id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      zIndex: 1000,
                      marginBottom: '10px',
                      transform: 'translateY(-10px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      <Picker
                        data={data}
                        onEmojiSelect={(emojiObj) => {
                          addReaction(msg._id, emojiObj.native);
                          setShowReactionPicker(null);
                        }}
                      />
                    </div>
                  )}
                  {msg.sender._id === user._id && (
                    <Popconfirm title="Delete this message?" onConfirm={() => deleteMessage(msg._id)}>
                      <Button size="small" danger style={{ marginLeft: '8px' }}>Delete</Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout style={{ marginTop: "90px" }}>
        <Sider width={200} style={{ backgroundColor: '#f0f2f5', maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Users" key="1">
              <List
                itemLayout="horizontal"
                dataSource={users}
                renderItem={(userItem) => (
                  <List.Item onClick={() => handleItemClick(userItem)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      avatar={<Avatar src={userItem.profilePicture} icon={<UserOutlined />} />}
                      title={userItem._id === user._id ? 'You' : userItem.username}
                      description={messages.find(msg => (msg.sender._id === userItem._id || msg.receiver?._id === userItem._id))?.message || 'No messages yet'}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="Channels" key="2">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
                <Title level={3} style={{ margin: 0 }}>Channels</Title>
                <Button icon={<PlusOutlined />} onClick={() => setShowModal(true)} />
              </div>
              <List
                itemLayout="horizontal"
                dataSource={channels}
                renderItem={(channel) => (
                  <List.Item style={{ cursor: channel.members.some(m => m.toString() === user._id.toString()) ? 'pointer' : 'default' }}>
                    <List.Item.Meta
                      title={channel.name}
                      onClick={() => handleItemClick(channel)}
                    />
                    {channel.members.some(m => m.toString() === user._id.toString()) ? (
                      <Button onClick={() => leaveChannel(channel._id)}>Leave</Button>
                    ) : (
                      <Button onClick={() => joinChannel(channel._id)}>Join</Button>
                    )}
                  </List.Item>
                )}
              />
            </TabPane>
          </Tabs>
        </Sider>
        <Layout style={{ padding: '24px', flex: 1 }}>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div style={{ padding: '24px', minHeight: 360 }}>
              {selectedItem && (
                <>
                  <Title level={4}>Chat with {selectedItem.type === 'user' ? (selectedItem._id === user._id ? 'yourself' : selectedItem.username) : selectedItem.name}</Title>
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
                  <div style={{ marginTop: '20px', position: 'relative' }}>
                    <div style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '12px',
                      padding: '12px',
                      backgroundColor: '#fff',
                      minHeight: '100px'
                    }}>
                      {filePreview && (
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                          <img src={filePreview} alt="Preview" style={{ maxHeight: '200px', maxWidth: '300px', borderRadius: '8px' }} />
                          <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<CloseOutlined />}
                            size="small"
                            onClick={removeFile}
                            style={{ position: 'absolute', top: '-10px', right: '-10px' }}
                          />
                        </div>
                      )}
                      {file && !filePreview && (
                        <div style={{ marginBottom: '10px', color: '#1890ff', fontWeight: '500' }}>
                          📎 {file.name}
                          <Button type="text" danger size="small" onClick={removeFile}>Remove</Button>
                        </div>
                      )}
                      <TextArea
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        style={{ border: 'none', resize: 'none', boxShadow: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '10px' }}>
                      <div style={{ position: 'relative' }}>
                        <Button
                          type="text"
                          icon={<SmileOutlined />}
                          onClick={() => setShowPicker(!showPicker)}
                          style={{ fontSize: '22px' }}
                        />
                        {showPicker && (
                          <div style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                          }}>
                            <Picker
                              data={data}
                              onEmojiSelect={(emojiObj) => {
                                setMessage(prev => prev + emojiObj.native);
                                setShowPicker(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        type="text"
                        icon={<PaperClipOutlined />}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: '22px' }}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <Button
                        type="primary"
                        onClick={sendMessage}
                        disabled={!message.trim() && !file}
                        style={{ marginLeft: 'auto' }}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
      <Modal title="Create Channel" open={showModal} onOk={createChannel} onCancel={() => setShowModal(false)}>
        <Input placeholder="Channel Name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
      </Modal>
    </Layout>
  );
};

export default Message;