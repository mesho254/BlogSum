import React, { useEffect, useState, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import axiosInstance from '../../axiosConfig';
import Navbar from '../NavBar';
import {
  Modal,
  Tabs,
  List,
  Avatar,
  Button,
  Input,
  Badge,
  Tag,
  Radio,
  message as antMessage,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckOutlined,
  MessageOutlined,
  UserOutlined,
  UserAddOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import io from 'socket.io-client';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateChannelModal from './CreateChannelModal';

const { TabPane } = Tabs;
const { TextArea } = Input;

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech or offensive',
  'Inappropriate content',
  'Other',
];

const Message = ({ isWidget = false }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [trashMessages, setTrashMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [selectedNewChannelMembers, setSelectedNewChannelMembers] = useState([]);
  const [channelMembers, setChannelMembers] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportComment, setReportComment] = useState('');
  const [inviteChannelTarget, setInviteChannelTarget] = useState(null);
  const [inviteSearch, setInviteSearch] = useState('');
  const [scrollToMessage, setScrollToMessage] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 900);
  const fileInputRef = useRef(null);
  const selectedItemRef = useRef(selectedItem);
  const inviteTargetRef = useRef(inviteChannelTarget);

  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  useEffect(() => {
    inviteTargetRef.current = inviteChannelTarget;
  }, [inviteChannelTarget]);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!user?.token) return;

    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/allUsers', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUsers(res.data.map((u) => ({ ...u, type: 'user' })));
      } catch (err) {
        console.error(err);
      }
    };
    const fetchChannels = async () => {
      try {
        const res = await axiosInstance.get('/api/channels', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setChannels(res.data.map((c) => ({ ...c, type: 'channel' })));
      } catch (err) {
        console.error(err);
      }
    };
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get('/api/messages/favorites', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFavorites(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchTrash = async () => {
      try {
        const res = await axiosInstance.get('/api/messages/trash', {
          headers: { Authorization: `Bearer ${user.token}` },
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
      const newSocket = io(
        import.meta.env.VITE_API_URL ||
          import.meta.env.REACT_APP_API_URL ||
          'http://localhost:5000',
        {
          withCredentials: true,
          extraHeaders: {
            'my-custom-header': 'abcd',
          },
        }
      );
      setSocket(newSocket);
      newSocket.emit('join', user._id);
      newSocket.emit('getOnlineUsers');

      newSocket.on('onlineUsers', (activeUserIds) => {
        setOnlineUsers(Array.isArray(activeUserIds) ? activeUserIds : []);
      });

      newSocket.on('channelUpdated', (updatedChannel) => {
        if (!updatedChannel?._id) return;
        const formatted = { ...updatedChannel, type: 'channel' };
        setChannels((prev) => {
          const exists = prev.some((c) => String(c._id) === String(updatedChannel._id));
          if (exists) {
            return prev.map((c) =>
              String(c._id) === String(updatedChannel._id) ? formatted : c
            );
          }
          return [...prev, formatted];
        });
        const currentSel = selectedItemRef.current;
        if (currentSel?.type === 'channel' && String(currentSel._id) === String(updatedChannel._id)) {
          setSelectedItem(formatted);
          setChannelMembers((updatedChannel.members || []).map((m) => m?._id || m));
        }
        const currentInvite = inviteTargetRef.current;
        if (currentInvite && String(currentInvite._id) === String(updatedChannel._id)) {
          setInviteChannelTarget(formatted);
        }
      });

      newSocket.on('message', (newMessage) => {
        const currentSel = selectedItemRef.current;
        const isChannel = !!newMessage.channel;
        const isFromMe = newMessage.sender._id === user._id;
        if (!isFromMe) {
          const targetId = isChannel ? newMessage.channel : newMessage.sender._id;
          markMessagesAsDelivered(targetId, isChannel);
          if (
            currentSel &&
            currentSel._id === (isChannel ? newMessage.channel : newMessage.receiver?._id)
          ) {
            markMessagesAsRead(targetId, isChannel);
          }
        }
        const isCurrentChat =
          (isChannel &&
            currentSel?.type === 'channel' &&
            newMessage.channel === currentSel?._id) ||
          (!isChannel &&
            currentSel?.type === 'user' &&
            (newMessage.sender._id === currentSel?._id ||
              newMessage.receiver._id === currentSel?._id));
        if (!isCurrentChat) return;
        setMessages((prevMessages) => {
          if (prevMessages.some((m) => m._id === newMessage._id)) {
            return prevMessages;
          }
          if (isFromMe) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      });

      newSocket.on('editMessage', (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? { ...m, ...updatedMsg } : m))
        );
        setFavorites((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? { ...m, ...updatedMsg } : m))
        );
      });

      newSocket.on('deleteMessage', ({ messageId }) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        setFavorites((prev) => prev.filter((msg) => msg._id !== messageId));
        setTrashMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      });

      newSocket.on('readUpdate', ({ userId, targetId, isChannel }) => {
        const currentSel = selectedItemRef.current;
        if (
          currentSel &&
          currentSel._id === targetId &&
          currentSel.type === (isChannel ? 'channel' : 'user')
        ) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if ((isChannel ? msg.channel : msg.sender._id) === targetId) {
                if (!msg.readBy.includes(userId)) {
                  return { ...msg, readBy: [...msg.readBy, userId] };
                }
              }
              return msg;
            })
          );
        }
      });

      newSocket.on('deliveredUpdate', ({ userId, targetId, isChannel }) => {
        const currentSel = selectedItemRef.current;
        if (
          currentSel &&
          currentSel._id === targetId &&
          currentSel.type === (isChannel ? 'channel' : 'user')
        ) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if ((isChannel ? msg.channel : msg.sender._id) === targetId) {
                if (!msg.deliveredTo.includes(userId)) {
                  return { ...msg, deliveredTo: [...msg.deliveredTo, userId] };
                }
              }
              return msg;
            })
          );
        }
      });

      newSocket.on('reaction', ({ messageId, reaction }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg._id === messageId) {
              const index = msg.reactions.findIndex((r) => r.user._id === reaction.user._id);
              const newReactions = [...msg.reactions];
              if (index > -1) {
                newReactions[index] = reaction;
              } else {
                newReactions.push(reaction);
              }
              return { ...msg, reactions: newReactions };
            }
            return msg;
          })
        );
      });

      newSocket.on('trashMessage', ({ messageId }) => {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
        setFavorites((prev) => prev.filter((msg) => msg._id !== messageId));
      });

      newSocket.on('restoreMessage', ({ message: restored }) => {
        const currentSel = selectedItemRef.current;
        const isChannel = !!restored.channel;
        const isCurrentChat =
          (isChannel &&
            currentSel?.type === 'channel' &&
            restored.channel === currentSel?._id) ||
          (!isChannel &&
            currentSel?.type === 'user' &&
            (restored.sender._id === currentSel?._id ||
              restored.receiver._id === currentSel?._id));
        if (isCurrentChat) {
          setMessages((prevMessages) => [...prevMessages, restored]);
        }
        setTrashMessages((prev) => prev.filter((msg) => msg._id !== restored._id));
      });

      newSocket.on('pinUpdate', ({ messageId, isPinned }) => {
        setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m)));
        setFavorites((prev) => prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m)));
        setTrashMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
        );
      });

      newSocket.on('favoriteUpdate', ({ messageId, userId, action }) => {
        if (userId !== user._id) return;
        const updateFunc = (prev) =>
          prev.map((m) => {
            if (m._id === messageId) {
              let favoritedBy = [...(m.favoritedBy || []).map((id) => id.toString())];
              if (action === 'add' && !favoritedBy.includes(userId)) {
                favoritedBy.push(userId);
              } else if (action === 'remove') {
                favoritedBy = favoritedBy.filter((id) => id !== userId);
              }
              return { ...m, favoritedBy };
            }
            return m;
          });
        setMessages(updateFunc);
        setFavorites((prev) => {
          if (action === 'remove') {
            return prev.filter((m) => m._id !== messageId);
          }
          return updateFunc(prev);
        });
        setTrashMessages(updateFunc);
      });

      return () => {
        newSocket.off('onlineUsers');
        newSocket.off('channelUpdated');
        newSocket.off('message');
        newSocket.off('editMessage');
        newSocket.off('deleteMessage');
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
  }, [user?._id, user?.token]);

  useEffect(() => {
    if (socket && channels.length > 0 && user?._id) {
      channels.forEach((channel) => {
        if (channel.members.some((m) => String(m?._id || m) === String(user._id))) {
          socket.emit('joinChannel', channel._id);
        }
      });
    }
  }, [channels, socket, user?._id]);

  const jumpToMessageInChat = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.transition = 'background-color 0.4s ease';
      element.style.backgroundColor = 'rgba(79, 70, 229, 0.12)';
      element.style.borderRadius = '14px';
      setTimeout(() => {
        element.style.backgroundColor = 'transparent';
      }, 1400);
    }
  };

  useEffect(() => {
    if (scrollToMessage) {
      jumpToMessageInChat(scrollToMessage);
      setScrollToMessage(null);
    }
  }, [messages, scrollToMessage]);

  const fetchMessages = async (id, type) => {
    try {
      const url = type === 'user' ? `/api/messages/${id}` : `/api/messages/channel/${id}`;
      const res = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages(
        res.data.map((msg) => ({
          ...msg,
          readBy: msg.readBy || [],
          deliveredTo: msg.deliveredTo || [],
          favoritedBy: msg.favoritedBy || [],
        }))
      );
      if (type === 'channel') {
        const channelRes = await axiosInstance.get(`/api/channels/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setChannelMembers(channelRes.data.members.map((m) => m._id || m));
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
      await axiosInstance.post(
        '/api/messages/markAsRead',
        { targetId, isChannel },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const markMessagesAsDelivered = async (targetId, isChannel = false) => {
    try {
      await axiosInstance.post(
        '/api/messages/markAsDelivered',
        { targetId, isChannel },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.error('Error marking messages as delivered:', err);
    }
  };

  const sendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedItem || (!message.trim() && !file && !gifUrl)) {
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
      fileUrl: filePreview || gifUrl || null,
      reactions: [],
      replyTo: replyingTo ? replyingTo._id : null,
      forwardedFrom: null,
    };
    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    const sentText = message;
    const sentFile = file;
    const sentGif = gifUrl;
    const sentReply = replyingTo;
    setMessage('');
    setFile(null);
    setFilePreview(null);
    setGifUrl(null);
    setReplyingTo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    try {
      const formData = new FormData();
      formData.append(
        selectedItem.type === 'channel' ? 'channelId' : 'receiverId',
        selectedItem._id
      );
      formData.append('message', sentText);
      if (sentReply) {
        formData.append('replyTo', sentReply._id);
      }
      if (sentFile) {
        formData.append('attachment', sentFile);
      } else if (sentGif) {
        formData.append('fileUrl', sentGif);
      }
      const { data } = await axiosInstance.post('/api/messages', formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...data, status: 'sent' } : msg))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
      );
    }
  };

  const editMessage = async (messageId, newText) => {
    try {
      const { data } = await axiosInstance.put(
        `/api/messages/${messageId}`,
        { message: newText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, ...data, isEdited: true } : msg))
      );
      antMessage.success('Message updated');
    } catch (error) {
      console.error('Error editing message:', error);
      antMessage.error('Failed to edit message');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      setFavorites((prev) => prev.filter((msg) => msg._id !== messageId));
      setTrashMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      antMessage.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      antMessage.error('Failed to delete message');
    }
  };

  const forwardTo = async (id, type) => {
    try {
      const formData = new FormData();
      formData.append(type === 'channel' ? 'channelId' : 'receiverId', id);
      formData.append('message', forwardingMessage.message || '');
      formData.append('fileUrl', forwardingMessage.fileUrl || '');
      formData.append('forwardedFrom', forwardingMessage._id);
      await axiosInstance.post('/api/messages', formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setForwardingMessage(null);
      antMessage.success('Message forwarded');
    } catch (error) {
      console.error('Error forwarding message:', error);
      antMessage.error('Failed to forward message');
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const { data } = await axiosInstance.post(
        `/api/messages/react/${messageId}`,
        { emoji },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === messageId ? data : msg))
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const trashMessage = async (messageId) => {
    try {
      await axiosInstance.post(
        `/api/messages/trash/${messageId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      antMessage.success('Moved to trash');
    } catch (error) {
      console.error('Error trashing message:', error);
    }
  };

  const restoreMessage = async (messageId) => {
    try {
      await axiosInstance.post(
        `/api/messages/restore/${messageId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      antMessage.success('Message restored');
    } catch (error) {
      console.error('Error restoring message:', error);
    }
  };

  const togglePin = async (msg) => {
    try {
      const endpoint = msg.isPinned ? 'unpin' : 'pin';
      const { data } = await axiosInstance.post(
        `/api/messages/${endpoint}/${msg._id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? data : m)));
      antMessage.success(msg.isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const toggleFavorite = async (msg) => {
    const isFavorited = (msg.favoritedBy || []).some(
      (id) => id.toString() === user._id.toString()
    );
    try {
      const method = isFavorited ? 'delete' : 'post';
      const { data } = await axiosInstance[method](
        `/api/messages/favorite/${msg._id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? data : m)));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const openReportModal = (msgOrId) => {
    const targetMsg =
      typeof msgOrId === 'object'
        ? msgOrId
        : messages.find((m) => m._id === msgOrId) || { _id: msgOrId };
    setReportingMessage(targetMsg);
    setReportReason(REPORT_REASONS[0]);
    setReportComment('');
  };

  const submitReportMessage = async () => {
    if (!reportingMessage?._id) return;
    try {
      await axiosInstance.post(
        `/api/messages/report/${reportingMessage._id}`,
        { reason: reportReason, comment: reportComment.trim() },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setReportingMessage(null);
      setReportComment('');
      antMessage.success('Report submitted. Thank you for helping keep the community safe.');
    } catch (error) {
      console.error('Error reporting message:', error);
      antMessage.error('Failed to submit report');
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
    setGifUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleItemClick = async (item) => {
    if (
      item.type === 'channel' &&
      !item.members.some((m) => String(m?._id || m) === String(user._id))
    ) {
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
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setSelectedItem({ ...res.data, type: 'channel' });
        setChannelMembers(res.data.members.map((m) => m._id || m));
      }
      fetchMessages(item._id, item.type);
    }
    localStorage.setItem('selectedItem', JSON.stringify(item));
  };

  useEffect(() => {
    const savedItem = localStorage.getItem('selectedItem');
    if (savedItem && (users.length > 0 || channels.length > 0)) {
      try {
        const parsed = JSON.parse(savedItem);
        handleItemClick(parsed);
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [users.length, channels.length]);

  const createChannel = async () => {
    if (!channelName.trim()) return;
    try {
      const res = await axiosInstance.post(
        '/api/channels',
        { name: channelName.trim(), memberIds: selectedNewChannelMembers },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const newChan = { ...res.data, type: 'channel' };
      setChannels((prev) => [...prev, newChan]);
      setShowModal(false);
      setChannelName('');
      setSelectedNewChannelMembers([]);
      antMessage.success(
        selectedNewChannelMembers.length > 0
          ? `Channel #${newChan.name} created and invitations sent!`
          : `Channel #${newChan.name} created`
      );
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to create channel');
    }
  };

  const inviteUserToChannel = async (channelId, userIdToInvite) => {
    try {
      const res = await axiosInstance.post(
        `/api/channels/invite/${channelId}`,
        { userIds: [userIdToInvite] },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const updated = { ...res.data, type: 'channel' };
      setChannels((prev) =>
        prev.map((c) => (String(c._id) === String(channelId) ? updated : c))
      );
      setInviteChannelTarget(updated);
      if (selectedItem?.type === 'channel' && String(selectedItem._id) === String(channelId)) {
        setSelectedItem(updated);
      }
      antMessage.success('Invitation sent (Pending user acceptance)');
    } catch (err) {
      console.error(err);
      antMessage.error(err?.response?.data?.message || 'Failed to invite user');
    }
  };

  const acceptChannelInvite = async (channelId) => {
    try {
      const res = await axiosInstance.post(
        `/api/channels/accept/${channelId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const updated = { ...res.data, type: 'channel' };
      setChannels((prev) =>
        prev.map((c) => (String(c._id) === String(channelId) ? updated : c))
      );
      socket?.emit('joinChannel', channelId);
      handleItemClick(updated);
      antMessage.success(`You joined #${updated.name}!`);
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to accept invitation');
    }
  };

  const declineChannelInvite = async (channelId) => {
    try {
      const res = await axiosInstance.post(
        `/api/channels/decline/${channelId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const updated = { ...res.data, type: 'channel' };
      setChannels((prev) =>
        prev.map((c) => (String(c._id) === String(channelId) ? updated : c))
      );
      antMessage.info('Channel invitation declined');
    } catch (err) {
      console.error(err);
      antMessage.error('Failed to decline invitation');
    }
  };

  const joinChannel = async (id) => {
    try {
      const res = await axiosInstance.post(
        `/api/channels/join/${id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setChannels((prev) => prev.map((c) => (c._id === id ? { ...res.data, type: 'channel' } : c)));
      socket?.emit('joinChannel', id);
    } catch (err) {
      console.error(err);
    }
  };

  const leaveChannel = async (id) => {
    try {
      const res = await axiosInstance.post(
        `/api/channels/leave/${id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setChannels((prev) => prev.map((c) => (c._id === id ? { ...res.data, type: 'channel' } : c)));
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
      return <ClockCircleOutlined style={{ fontSize: 11 }} />;
    }
    const isGroup = !!msg.channel;
    const numMembers = isGroup ? channelMembers.length : 2;
    const deliveredCount = (msg.deliveredTo || []).length;
    const readCount = (msg.readBy || []).length;
    const expected = numMembers - 1;
    if (deliveredCount < expected) {
      return <CheckOutlined style={{ fontSize: 11 }} />;
    }
    const tickColor = readCount >= expected ? '#93c5fd' : 'currentColor';
    return (
      <span>
        <CheckOutlined style={{ color: tickColor, fontSize: 11, marginLeft: -4 }} />
        <CheckOutlined style={{ color: tickColor, fontSize: 11 }} />
      </span>
    );
  };

  const getReactionCounts = (reactions = []) => {
    const counts = {};
    const usersByEmoji = {};
    reactions.forEach((r) => {
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
    const chat = item.channel
      ? { ...item.channel, type: 'channel' }
      : {
          type: 'user',
          _id: item.sender._id === user._id ? item.receiver._id : item.sender._id,
          username: item.sender._id === user._id ? item.receiver.username : item.sender.username,
        };
    handleItemClick(chat);
    setScrollToMessage(item._id);
  };

  const isChatType =
    selectedItem && (selectedItem.type === 'user' || selectedItem.type === 'channel');
  const isFavoritesType = selectedItem?.type === 'favorites';
  const isTrashType = selectedItem?.type === 'trash';
  const pinnedMessages = messages.filter((m) => m.isPinned);

  const showSidebar = !isMobileView || !selectedItem;
  const showChatArea = !isMobileView || !!selectedItem;

  const chatStudio = (
    <div className="modern-chat-shell">
      {showSidebar && (
        <Sidebar
          users={users}
          channels={channels}
          onlineUsers={onlineUsers}
          setShowModal={setShowModal}
          openInviteModal={(chan) => {
            setInviteSearch('');
            setInviteChannelTarget(chan);
          }}
          handleItemClick={handleItemClick}
          user={user}
          joinChannel={joinChannel}
          leaveChannel={leaveChannel}
          acceptChannelInvite={acceptChannelInvite}
          declineChannelInvite={declineChannelInvite}
          selectedItem={selectedItem}
          favorites={favorites}
          trashMessages={trashMessages}
          handleFavoriteClick={handleFavoriteClick}
          restoreMessage={restoreMessage}
        />
      )}

      {showChatArea && (
        <main className="modern-chat-main">
          {selectedItem ? (
            <>
              <ChatHeader
                selectedItem={selectedItem}
                user={user}
                onlineUsers={onlineUsers}
                channelMembers={channelMembers}
                pinnedMessages={pinnedMessages}
                onSelectPinnedMessage={jumpToMessageInChat}
                togglePin={togglePin}
                openInviteModal={(chan) => {
                  setInviteSearch('');
                  setInviteChannelTarget(chan);
                }}
                onBack={isMobileView ? () => setSelectedItem(null) : undefined}
              />
              <MessageList
                messages={messages}
                user={user}
                channelMembers={channelMembers}
                selectedItem={selectedItem}
                getStatusIcon={getStatusIcon}
                getReactionCounts={getReactionCounts}
                showReactionPicker={showReactionPicker}
                setShowReactionPicker={setShowReactionPicker}
                addReaction={addReaction}
                editMessage={editMessage}
                deleteMessage={deleteMessage}
                trashMessage={trashMessage}
                replyingToMessage={replyingToMessage}
                privateReplyingToMessage={privateReplyingToMessage}
                forwardMessage={forwardMessage}
                togglePin={togglePin}
                toggleFavorite={toggleFavorite}
                reportMessage={openReportModal}
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
                  gifUrl={gifUrl}
                  setGifUrl={setGifUrl}
                  removeFile={removeFile}
                  showPicker={showPicker}
                  setShowPicker={setShowPicker}
                  fileInputRef={fileInputRef}
                  handleFileChange={handleFileChange}
                  sendMessage={sendMessage}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  selectedItem={selectedItem}
                  users={users}
                />
              )}
            </>
          ) : (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                padding: 32,
                maxWidth: 380,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.18)',
                }}
              >
                <MessageOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Your Conversations
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Select a person or channel from the sidebar to start messaging, sharing files, and
                collaborating in real time.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  );

  const inviteTargetMemberIds = (inviteChannelTarget?.members || []).map((m) =>
    String(m?._id || m)
  );
  const inviteTargetPendingIds = (inviteChannelTarget?.pendingInvites || []).map((p) =>
    String(p?._id || p)
  );
  const filteredInviteUsers = users.filter((u) => {
    if (String(u._id) === String(user?._id)) return false;
    if (inviteSearch.trim()) {
      return u.username?.toLowerCase().includes(inviteSearch.toLowerCase().trim());
    }
    return true;
  });

  return (
    <>
      {isWidget ? (
        <div style={{ width: '100%', height: '100%' }}>{chatStudio}</div>
      ) : (
        <div
          style={{
            minHeight: '100vh',
            background: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Navbar />
          <div
            style={{
              maxWidth: 1380,
              width: '96%',
              height: 'calc(100vh - 108px)',
              margin: '90px auto 18px',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.1)',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
            }}
          >
            {chatStudio}
          </div>
        </div>
      )}

      <CreateChannelModal
        showModal={showModal}
        setShowModal={setShowModal}
        channelName={channelName}
        setChannelName={setChannelName}
        selectedMembers={selectedNewChannelMembers}
        setSelectedMembers={setSelectedNewChannelMembers}
        users={users}
        currentUserId={user?._id}
        createChannel={createChannel}
      />

      {/* Invite Users to Channel Modal */}
      <Modal
        title={`Invite Users to #${inviteChannelTarget?.name || ''}`}
        open={!!inviteChannelTarget}
        onCancel={() => setInviteChannelTarget(null)}
        footer={null}
        zIndex={2600}
        centered
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search users to invite..."
          value={inviteSearch}
          onChange={(e) => setInviteSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 12, borderRadius: 10 }}
        />
        <List
          style={{ maxHeight: 340, overflowY: 'auto' }}
          dataSource={filteredInviteUsers}
          renderItem={(userItem) => {
            const alreadyMember = inviteTargetMemberIds.includes(String(userItem._id));
            const isPending = inviteTargetPendingIds.includes(String(userItem._id));
            const isOnline = onlineUsers.some((id) => String(id) === String(userItem._id));
            return (
              <List.Item
                actions={[
                  alreadyMember ? (
                    <Tag color="success" style={{ borderRadius: 999, margin: 0 }}>
                      Joined
                    </Tag>
                  ) : isPending ? (
                    <Tag color="warning" style={{ borderRadius: 999, margin: 0 }}>
                      Pending
                    </Tag>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      shape="round"
                      icon={<UserAddOutlined />}
                      onClick={() =>
                        inviteUserToChannel(inviteChannelTarget._id, userItem._id)
                      }
                      style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                    >
                      Invite
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot color={isOnline ? '#10b981' : '#cbd5e1'} offset={[-3, 28]}>
                      <Avatar src={userItem.profilePicture} icon={<UserOutlined />} />
                    </Badge>
                  }
                  title={userItem.username}
                  description={
                    <span style={{ fontSize: 12, color: isOnline ? '#10b981' : '#94a3b8' }}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Modal>

      {/* Report Message Modal */}
      <Modal
        title="Report Message"
        open={!!reportingMessage}
        onOk={submitReportMessage}
        okText="Submit Report"
        okButtonProps={{ danger: true }}
        onCancel={() => setReportingMessage(null)}
        zIndex={2600}
        centered
      >
        {reportingMessage?.message && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: '3px solid #ef4444',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 14,
              fontSize: 13,
              color: '#334155',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>
              Message from {reportingMessage.sender?.username || 'User'}
            </div>
            <div>{reportingMessage.message}</div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
            Reason for reporting
          </div>
          <Radio.Group
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {REPORT_REASONS.map((reason) => (
              <Radio key={reason} value={reason}>
                {reason}
              </Radio>
            ))}
          </Radio.Group>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
            Additional Comments
          </div>
          <TextArea
            rows={3}
            placeholder="Add details or comments about why you are reporting this message..."
            value={reportComment}
            onChange={(e) => setReportComment(e.target.value)}
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>

      <Modal
        title="Forward Message"
        open={!!forwardingMessage}
        onCancel={() => setForwardingMessage(null)}
        footer={null}
        zIndex={2600}
        centered
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Users" key="1">
            <List
              style={{ maxHeight: 320, overflowY: 'auto' }}
              dataSource={users}
              renderItem={(userItem) => (
                <List.Item
                  onClick={() => forwardTo(userItem._id, 'user')}
                  style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 12px' }}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={userItem.profilePicture} icon={<UserOutlined />} />}
                    title={userItem.username}
                  />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="Channels" key="2">
            <List
              style={{ maxHeight: 320, overflowY: 'auto' }}
              dataSource={channels.filter((c) =>
                c.members.some((m) => String(m?._id || m) === String(user?._id))
              )}
              renderItem={(channel) => (
                <List.Item
                  onClick={() => forwardTo(channel._id, 'channel')}
                  style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 12px' }}
                >
                  <List.Item.Meta title={`# ${channel.name}`} />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Modal>
    </>
  );
};

export default Message;
