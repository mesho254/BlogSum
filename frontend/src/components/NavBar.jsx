import React, { useState, useEffect, useRef } from 'react';
import {
  Dropdown,
  Avatar,
  Badge,
  Popover,
  Tooltip,
  Button,
  Empty,
  notification as antNotification,
} from 'antd';
import {
  HomeOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  MailOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  BellOutlined,
  MessageFilled,
  CloseOutlined,
  CheckOutlined,
  EditOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  DownOutlined,
  FullscreenOutlined,
  SafetyCertificateFilled,
  ArrowRightOutlined,
  SoundOutlined,
  HeartOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import Logo from '../assets/logo.png';
import useAuth from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Message from './Message/Message';
import moment from 'moment';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { key: '/', label: 'Home', icon: <HomeOutlined /> },
  { key: '/about', label: 'About', icon: <InfoCircleOutlined /> },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState('all');
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();

  const isOnMessagePage = location.pathname === '/message';
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/users/profile');
      return response.data;
    },
    enabled: !!user,
  });

  const userProfile = profileData ?? { profilePicture: '' };

  const isAdmin = Boolean(
    user &&
      (user.roles === 'admin' ||
        userProfile?.roles === 'admin' ||
        String(user.username || '').trim().toLowerCase() === 'admin')
  );

  const { data: publicSettings } = useQuery({
    queryKey: ['publicSiteSettings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/admin/public-settings');
      return data;
    },
    staleTime: 60 * 1000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return data;
    },
    enabled: !!user?.token,
  });

  const notifications = notificationsData ?? [];
  const notificationCount = notifications.filter((n) => !n.read).length;

  const { data: unreadMessageCount } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/users/messages', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return data.filter((m) => m.read === false).length;
    },
    enabled: !!user?.token,
  });

  const messageCount = unreadMessageCount ?? 0;

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.put(
        `/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      queryClient.setQueryData(['notifications'], (old) =>
        old ? old.map((n) => (n._id === id ? { ...n, read: true } : n)) : []
      );
      antNotification.success({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (id, e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.put(
        `/api/notifications/${id}/unread`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      queryClient.setQueryData(['notifications'], (old) =>
        old ? old.map((n) => (n._id === id ? { ...n, read: false } : n)) : []
      );
      antNotification.success({ message: 'Notification marked as unread' });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put(
        `/api/notifications/read/all`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      queryClient.setQueryData(['notifications'], (old) =>
        old ? old.map((n) => ({ ...n, read: true })) : []
      );
      antNotification.success({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFloatingMsgClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setChatPopupOpen((prev) => !prev);
  };

  const getDropdownItemMeta = (msg = '') => {
    const lower = String(msg).toLowerCase();
    if (lower.includes('dispatch') || lower.includes('broadcast')) {
      return {
        icon: <SoundOutlined style={{ color: '#4f46e5', fontSize: 13 }} />,
        bg: '#eef2ff',
        label: 'Dispatch',
      };
    }
    if (lower.includes('liked') || lower.includes('reaction') || lower.includes('love')) {
      return {
        icon: <HeartOutlined style={{ color: '#ec4899', fontSize: 13 }} />,
        bg: '#fdf2f8',
        label: 'Reaction',
      };
    }
    if (lower.includes('comment') || lower.includes('reply')) {
      return {
        icon: <CommentOutlined style={{ color: '#0284c7', fontSize: 13 }} />,
        bg: '#f0f9ff',
        label: 'Comment',
      };
    }
    return {
      icon: <BellOutlined style={{ color: '#64748b', fontSize: 13 }} />,
      bg: '#f1f5f9',
      label: 'Notice',
    };
  };

  const visibleNotifications = notifications.filter((n) =>
    dropdownFilter === 'unread' ? !n.read : true
  );

  const notificationContent = (
    <div style={{ width: 360, maxHeight: 460, display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px 10px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Notifications</span>
          {notificationCount > 0 && (
            <span
              style={{
                background: '#eef2ff',
                color: '#4f46e5',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {notificationCount} new
            </span>
          )}
        </div>
        {notificationCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAllAsRead}
            style={{ padding: 0, fontSize: 12, fontWeight: 600, color: '#4f46e5' }}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px 6px',
          borderBottom: '1px solid #f8fafc',
          background: '#fafafa',
        }}
      >
        <button
          type="button"
          onClick={() => setDropdownFilter('all')}
          style={{
            border: 'none',
            background: dropdownFilter === 'all' ? '#0f172a' : 'transparent',
            color: dropdownFilter === 'all' ? '#ffffff' : '#64748b',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setDropdownFilter('unread')}
          style={{
            border: 'none',
            background: dropdownFilter === 'unread' ? '#0f172a' : 'transparent',
            color: dropdownFilter === 'unread' ? '#ffffff' : '#64748b',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Unread ({notificationCount})
        </button>
      </div>

      {/* Notification List */}
      <div style={{ overflowY: 'auto', maxHeight: 310, padding: '6px 8px' }}>
        {visibleNotifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              dropdownFilter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'
            }
            style={{ margin: '32px 0' }}
          />
        ) : (
          visibleNotifications.map((item) => {
            const meta = getDropdownItemMeta(item.message);
            return (
              <div
                key={item._id}
                onClick={() => {
                  if (!item.read) handleMarkAsRead(item._id);
                  navigate(`/notifications/${item._id}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 10px',
                  borderRadius: 10,
                  marginBottom: 3,
                  cursor: 'pointer',
                  background: item.read ? 'transparent' : '#f8faff',
                  border: item.read ? '1px solid transparent' : '1px solid #eef2ff',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: item.read ? '#64748b' : '#0f172a',
                        fontWeight: item.read ? 400 : 600,
                        lineHeight: 1.4,
                        marginBottom: 3,
                      }}
                    >
                      {item.message}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{moment(item.createdAt).fromNow()}</span>
                      {!item.read && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#4f46e5',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <Tooltip title={item.read ? 'Mark as unread' : 'Mark as read'}>
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      icon={
                        item.read ? (
                          <CloseOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                        ) : (
                          <CheckOutlined style={{ fontSize: 11, color: '#4f46e5' }} />
                        )
                      }
                      onClick={(e) =>
                        item.read ? handleMarkAsUnread(item._id, e) : handleMarkAsRead(item._id, e)
                      }
                    />
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          padding: '8px 12px',
          background: '#ffffff',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#4f46e5',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          <span>View all in Notifications</span>
          <ArrowRightOutlined style={{ fontSize: 11 }} />
        </button>
      </div>
    </div>
  );

  const userDropdownItems = [
    ...(isAdmin
      ? [
          {
            key: 'admin',
            icon: <SafetyCertificateFilled style={{ color: '#4f46e5' }} />,
            label: <span style={{ fontWeight: 700, color: '#0f172a' }}>Admin Control Center</span>,
            onClick: () => navigate('/admin'),
          },
          { type: 'divider' },
        ]
      : []),
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'createBlog',
      icon: <EditOutlined />,
      label: 'Write a Blog',
      onClick: () => navigate('/createBlog'),
    },
    {
      key: 'messages',
      icon: <MessageFilled />,
      label: 'Messages Studio',
      onClick: () => navigate('/message'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Help Center',
      onClick: () => navigate('/help'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <header ref={navRef} className={`modern-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="modern-navbar-inner">
          {/* Left: Brand Logo */}
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="nav-brand-logo-wrap">
              <img src={Logo} alt="BlogSum" className="nav-brand-logo" />
            </div>
            <span className="nav-brand-text">
              BlogSum<span className="nav-brand-dot" />
            </span>
          </div>

          {/* Center: Floating Pill Navigation */}
          <nav className="nav-pills-container">
            {navItems.map((item) => {
              const isActive = location.pathname === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`nav-pill-item ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="nav-actions">
            {isAdmin && (
              <button
                type="button"
                className="nav-write-btn"
                style={{
                  background: location.pathname === '/admin' ? '#0f172a' : 'rgba(15, 23, 42, 0.07)',
                  color: location.pathname === '/admin' ? '#ffffff' : '#0f172a',
                  borderColor: 'rgba(15, 23, 42, 0.18)',
                }}
                onClick={() => navigate('/admin')}
              >
                <SafetyCertificateFilled />
                <span>Admin</span>
              </button>
            )}

            {user && (
              <button
                type="button"
                className="nav-write-btn"
                onClick={() => navigate('/createBlog')}
              >
                <EditOutlined />
                <span>Write</span>
              </button>
            )}

            {user && (
              <Popover
                content={notificationContent}
                trigger="click"
                placement="bottomRight"
                overlayStyle={{ borderRadius: 16 }}
              >
                <Badge count={notificationCount} overflowCount={99} size="small" offset={[-4, 4]}>
                  <button type="button" className="nav-icon-btn" aria-label="Notifications">
                    <BellOutlined />
                  </button>
                </Badge>
              </Popover>
            )}

            {/* Dark / Light Mode Switcher */}
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <button
                type="button"
                onClick={toggleTheme}
                className="nav-icon-btn nav-theme-toggle"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
            </Tooltip>

            {user ? (
              <Dropdown
                menu={{ items: userDropdownItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <div className="nav-user-pill">
                  <Avatar
                    size={32}
                    style={{ backgroundColor: '#4f46e5', fontWeight: 600 }}
                    src={userProfile.profilePicture}
                  >
                    {user.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <span className="nav-user-name">{user.username}</span>
                  <DownOutlined style={{ fontSize: 11, color: '#64748b' }} />
                </div>
              </Dropdown>
            ) : (
              <button type="button" className="nav-login-btn" onClick={() => navigate('/login')}>
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Dropdown Sheet */}
        {menuOpen && (
          <div className="nav-mobile-sheet">
            <div className="nav-mobile-links">
              {navItems.map((item) => {
                const isActive = location.pathname === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`nav-mobile-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(item.key)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {user && (
                <>
                  <div style={{ height: 1, background: '#f1f5f9', margin: '6px 0' }} />
                  {isAdmin && (
                    <button
                      type="button"
                      className={`nav-mobile-item ${location.pathname === '/admin' ? 'active' : ''}`}
                      onClick={() => navigate('/admin')}
                    >
                      <SafetyCertificateFilled style={{ color: '#4f46e5' }} />
                      <span style={{ fontWeight: 700 }}>Admin Control Center</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="nav-mobile-item"
                    onClick={() => navigate('/createBlog')}
                  >
                    <EditOutlined />
                    <span>Write a Blog</span>
                  </button>
                  <button
                    type="button"
                    className="nav-mobile-item"
                    onClick={() => navigate('/profile')}
                  >
                    <UserOutlined />
                    <span>My Profile ({user.username})</span>
                  </button>
                  <button
                    type="button"
                    className="nav-mobile-item"
                    onClick={() => navigate('/message')}
                  >
                    <MessageFilled />
                    <span>Messages {messageCount > 0 ? `(${messageCount})` : ''}</span>
                  </button>
                  <button
                    type="button"
                    className="nav-mobile-item"
                    onClick={() => navigate('/settings')}
                  >
                    <SettingOutlined />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    className="nav-mobile-item"
                    style={{ color: '#ef4444' }}
                    onClick={handleLogout}
                  >
                    <LogoutOutlined />
                    <span>Sign Out</span>
                  </button>
                </>
              )}

              {!user && (
                <button
                  type="button"
                  className="nav-login-btn"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Announcement or Maintenance Banner configured in Admin Settings */}
      {(publicSettings?.maintenanceMode || publicSettings?.announcementEnabled) && (
        <div
          style={{
            position: 'fixed',
            top: 82,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 940,
            maxWidth: 960,
            width: 'calc(100% - 32px)',
            background: publicSettings?.maintenanceMode ? '#7f1d1d' : '#0f172a',
            color: '#f8fafc',
            padding: '7px 16px',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <span>
            {publicSettings?.maintenanceMode
              ? `⚠️ ${publicSettings.maintenanceMessage || 'Maintenance mode is active.'}`
              : `✨ ${publicSettings.announcementText}`}
          </span>
          {!publicSettings?.maintenanceMode && publicSettings?.announcementLink && (
            <button
              type="button"
              onClick={() => navigate(publicSettings.announcementLink)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {publicSettings.announcementLinkLabel || 'Learn more'} →
            </button>
          )}
        </div>
      )}

      {/* Floating Message Icon & Expandable Modern Chat Popup (Hidden when already on /message) */}
      {!isOnMessagePage && (
        <div className="floating-msg-wrapper">
          {chatPopupOpen && user && (
            <div className="floating-chat-panel">
              <div className="floating-chat-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="floating-msg-pulse" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>BlogSum Messenger</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tooltip title="Open Full Screen Messenger">
                    <Button
                      type="text"
                      size="small"
                      icon={<FullscreenOutlined style={{ color: '#fff' }} />}
                      onClick={() => {
                        setChatPopupOpen(false);
                        navigate('/message');
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Minimize">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ color: '#fff' }} />}
                      onClick={() => setChatPopupOpen(false)}
                    />
                  </Tooltip>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Message isWidget />
              </div>
            </div>
          )}

          <button
            type="button"
            className="floating-msg-fab"
            onClick={handleFloatingMsgClick}
            aria-label="Open Messages"
          >
            <span className="floating-msg-pulse" />
            <MessageFilled style={{ fontSize: 20 }} />
            <span>Messages</span>
            {messageCount > 0 && <span className="floating-msg-badge">{messageCount}</span>}
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;
