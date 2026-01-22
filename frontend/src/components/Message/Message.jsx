import React, { useEffect, useState, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import axiosInstance from '../../axiosConfig';
import Navbar from '../NavBar';
import { Layout, Modal, Tabs, List } from 'antd';
import { ClockCircleOutlined, CheckOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import moment from 'moment';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateChannelModal from './CreateChannelModal';

const { Content } = Layout;
const { TabPane } = Tabs;

const Message = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [trashMessages, setTrashMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelMembers, setChannelMembers] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [scrollToMessage, setScrollToMessage] = useState(null);
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
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get('/api/messages/favorites', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFavorites(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchTrash = async () => {
      try {
        const res = await axiosInstance.get('/api/messages/trash', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTrashMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
    fetchChannels();
    fetchFavorites();
    fetchTrash();
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
          if (selectedItem && selectedItem._id === (isChannel ? newMessage.channel : newMessage.receiver?._id)) {
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
          if (isFromMe) {
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
      newSocket.on('trashMessage', ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
        setFavorites((prev) => prev.filter(msg => msg._id !== messageId));
      });
      newSocket.on('restoreMessage', ({ message }) => {
        const isChannel = !!message.channel;
        const isCurrentChat =
          (isChannel && selectedItem?.type === 'channel' && message.channel === selectedItem?._id) ||
          (!isChannel && selectedItem?.type === 'user' && (
            message.sender._id === selectedItem?._id ||
            message.receiver._id === selectedItem?._id
          ));
        if (isCurrentChat) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
        setTrashMessages((prev) => prev.filter(msg => msg._id !== message._id));
      });
      newSocket.on('pinUpdate', ({ messageId, isPinned }) => {
        setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
        setFavorites((prev) => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
        setTrashMessages((prev) => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
      });
      newSocket.on('favoriteUpdate', ({ messageId, userId, action }) => {
        if (userId !== user._id) return;
        const updateFunc = (prev) => prev.map(m => {
          if (m._id === messageId) {
            let favoritedBy = [...m.favoritedBy.map(id => id.toString())];
            if (action === 'add' && !favoritedBy.includes(userId)) {
              favoritedBy.push(userId);
            } else if (action === 'remove') {
              favoritedBy = favoritedBy.filter(id => id !== userId);
            }
            return { ...m, favoritedBy };
          }
          return m;
        });
        setMessages(updateFunc);
        setFavorites((prev) => {
          if (action === 'remove') {
            return prev.filter(m => m._id !== messageId);
          }
          return updateFunc(prev);
        });
        setTrashMessages(updateFunc);
      });
      return () => {
        newSocket.off('message');
        newSocket.off('readUpdate');
        newSocket.off('deliveredUpdate');
        newSocket.off('reaction');
        newSocket.off('trashMessage');
        newSocket.off('restoreMessage');
        newSocket.off('pinUpdate');
        newSocket.off('favoriteUpdate');
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

  useEffect(() => {
    if (scrollToMessage) {
      const element = document.getElementById(`message-${scrollToMessage}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setScrollToMessage(null);
    }
  }, [messages, scrollToMessage]);

  const fetchMessages = async (id, type) => {
    try {
      const url = type === 'user' ? `/api/messages/${id}` : `/api/messages/channel/${id}`;
      const res = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages(res.data.map(msg => ({ ...msg, readBy: msg.readBy || [], deliveredTo: msg.deliveredTo || [], favoritedBy: msg.favoritedBy || [] })));
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
      reactions: [],
      replyTo: replyingTo ? replyingTo._id : null,
      forwardedFrom: null
    };
    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setMessage('');
    setFile(null);
    setFilePreview(null);
    setReplyingTo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    try {
      const formData = new FormData();
      formData.append(selectedItem.type === 'channel' ? 'channelId' : 'receiverId', selectedItem._id);
      formData.append('message', message);
      if (replyingTo) {
        formData.append('replyTo', replyingTo._id);
      }
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

  const forwardTo = async (id, type) => {
    try {
      const formData = new FormData();
      formData.append(type === 'channel' ? 'channelId' : 'receiverId', id);
      formData.append('message', forwardingMessage.message);
      formData.append('fileUrl', forwardingMessage.fileUrl || '');
      formData.append('forwardedFrom', forwardingMessage._id);
      await axiosInstance.post('/api/messages', formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setForwardingMessage(null);
    } catch (error) {
      console.error('Error forwarding message:', error);
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

  const trashMessage = async (messageId) => {
    try {
      await axiosInstance.post(`/api/messages/trash/${messageId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (error) {
      console.error('Error trashing message:', error);
    }
  };

  const restoreMessage = async (messageId) => {
    try {
      await axiosInstance.post(`/api/messages/restore/${messageId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (error) {
      console.error('Error restoring message:', error);
    }
  };

  const togglePin = async (msg) => {
    try {
      const endpoint = msg.isPinned ? 'unpin' : 'pin';
      const { data } = await axiosInstance.post(`/api/messages/${endpoint}/${msg._id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages((prev) => prev.map(m => m._id === msg._id ? data : m));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const toggleFavorite = async (msg) => {
    const isFavorited = msg.favoritedBy.some(id => id.toString() === user._id.toString());
    try {
      const endpoint = isFavorited ? 'favorite' : 'favorite';
      const method = isFavorited ? 'delete' : 'post';
      const { data } = await axiosInstance[method](`/api/messages/favorite/${msg._id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessages((prev) => prev.map(m => m._id === msg._id ? data : m));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const reportMessage = async (messageId) => {
    try {
      await axiosInstance.post(`/api/messages/report/${messageId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (error) {
      console.error('Error reporting message:', error);
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
    setReplyingTo(null);
    setSelectedItem(item);
    if (item.type === 'favorites') {
      setMessages(favorites);
    } else if (item.type === 'trash') {
      setMessages(trashMessages);
    } else if (item.type === 'channel' || item.type === 'user') {
      if (item.type === 'channel') {
        const res = await axiosInstance.get(`/api/channels/${item._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSelectedItem({ ...res.data, type: 'channel' });
        setChannelMembers(res.data.members.map(m => m._id));
      }
      fetchMessages(item._id, item.type);
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

  const replyingToMessage = (msg) => {
    setReplyingTo(msg);
  };

  const privateReplyingToMessage = (msg) => {
    const sender = msg.sender;
    if (sender._id !== user._id) {
      handleItemClick({ ...sender, type: 'user' });
    }
    setReplyingTo(msg);
  };

  const forwardMessage = (msg) => {
    setForwardingMessage(msg);
  };

  const handleFavoriteClick = (item) => {
    const chat = item.channel ? { ...item.channel, type: 'channel' } : {
      type: 'user',
      _id: item.sender._id === user._id ? item.receiver._id : item.sender._id,
      username: item.sender._id === user._id ? item.receiver.username : item.sender.username
    };
    handleItemClick(chat);
    setScrollToMessage(item._id);
  };

  const isChatType = selectedItem && (selectedItem.type === 'user' || selectedItem.type === 'channel');
  const isFavoritesType = selectedItem?.type === 'favorites';
  const isTrashType = selectedItem?.type === 'trash';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout style={{ marginTop: "90px" }}>
        <Sidebar
          users={users}
          channels={channels}
          setShowModal={setShowModal}
          handleItemClick={handleItemClick}
          user={user}
          joinChannel={joinChannel}
          leaveChannel={leaveChannel}
          selectedItem={selectedItem}
          favorites={favorites}
          trashMessages={trashMessages}
          handleFavoriteClick={handleFavoriteClick}
          restoreMessage={restoreMessage}
        />
        <Layout style={{ padding: '24px', flex: 1 }}>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div style={{ padding: '24px', minHeight: 360 }}>
              {selectedItem && (
                <>
                  <ChatHeader selectedItem={selectedItem} user={user} />
                  <MessageList
                    messages={messages}
                    user={user}
                    channelMembers={channelMembers}
                    getStatusIcon={getStatusIcon}
                    getReactionCounts={getReactionCounts}
                    showReactionPicker={showReactionPicker}
                    setShowReactionPicker={setShowReactionPicker}
                    addReaction={addReaction}
                    trashMessage={trashMessage}
                    replyingToMessage={replyingToMessage}
                    privateReplyingToMessage={privateReplyingToMessage}
                    forwardMessage={forwardMessage}
                    togglePin={togglePin}
                    toggleFavorite={toggleFavorite}
                    reportMessage={reportMessage}
                    isTrash={isTrashType}
                    restoreMessage={restoreMessage}
                    isFavorites={isFavoritesType}
                  />
                  {isChatType && (
                    <MessageInput
                      message={message}
                      setMessage={setMessage}
                      filePreview={filePreview}
                      file={file}
                      removeFile={removeFile}
                      showPicker={showPicker}
                      setShowPicker={setShowPicker}
                      fileInputRef={fileInputRef}
                      handleFileChange={handleFileChange}
                      sendMessage={sendMessage}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                    />
                  )}
                </>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
      <CreateChannelModal
        showModal={showModal}
        setShowModal={setShowModal}
        channelName={channelName}
        setChannelName={setChannelName}
        createChannel={createChannel}
      />
      <Modal
        title="Forward to"
        open={!!forwardingMessage}
        onCancel={() => setForwardingMessage(null)}
        footer={null}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Users" key="1">
            <List
              dataSource={users}
              renderItem={(userItem) => (
                <List.Item onClick={() => forwardTo(userItem._id, 'user')}>
                  {userItem.username}
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="Channels" key="2">
            <List
              dataSource={channels.filter(c => c.members.some(m => m.toString() === user._id.toString()))}
              renderItem={(channel) => (
                <List.Item onClick={() => forwardTo(channel._id, 'channel')}>
                  {channel.name}
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Modal>
    </Layout>
  );
};

export default Message;