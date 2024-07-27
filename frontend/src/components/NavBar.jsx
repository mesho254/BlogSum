import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Menu, Dropdown, Avatar, Badge, List, notification as antNotification, Tooltip, message } from 'antd';
import { HomeOutlined, UserOutlined, MenuOutlined, LogoutOutlined, BellOutlined, MessageOutlined, CloseOutlined, CheckOutlined  } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import Logo from '../assets/logo.png';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0); // Initialize message count
  const [userProfile, setUserProfile] = useState({profilePicture: ''})
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleMenuToggle = () => {
    setMenuOpen(prevMenuOpen => !prevMenuOpen);
  };

  const updateMobileView = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    updateMobileView();
    window.addEventListener('resize', updateMobileView);
    return () => window.removeEventListener('resize', updateMobileView);
  }, [updateMobileView]);

  useEffect(() => {

    if (user) {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get('/api/users/profile');
        setUserProfile(response.data);
      } catch (error) {
        message('Error fetching user profile');
      }
    }
  

    fetchUserProfile();
  }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const { data } = await axiosInstance.get('/api/notifications', {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          });
          setNotifications(data);
          setNotificationCount(data.filter(notification => !notification.read).length);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const fetchUnreadMessagesCount = async () => {
      if (user) {
        try {
          const { data } = await axiosInstance.get('/api/users/messages', {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          });
          const unreadCount = data.filter(message => message.read === false).length;
          setMessageCount(unreadCount);
        } catch (error) {
          console.error('Error fetching unread messages count:', error);
        }
      }
    };

    fetchUnreadMessagesCount();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
      setNotificationCount((prevCount) => prevCount - 1);
      antNotification.success({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/unread`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === id ? { ...notification, read: false } : notification
        )
      );
      setNotificationCount((prevCount) => prevCount + 1);
      antNotification.success({ message: 'Notification marked as unread' });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put(`/api/notifications/read/all`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, read: true }))
      );
      setNotificationCount(0);
      antNotification.success({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    navigate(`/notifications/${notification._id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLogin = () => {
    navigate('/login');
  };

  const NavHome = () => {
    navigate('/');
  };

  const NavAbout = () => {
    navigate('/about');
  };

  const NavProf = () => {
    navigate('/profile');
  };

  const NavSettings = () => {
    navigate('/settings');
  };

  const NavHelp = () => {
    navigate('/help');
  };

  const NavPostBlog = () => {
    navigate('/createBlog');
  };

  const NavMessages = () => {
    navigate('/message');
  };

  const userMenu = (
    <Menu style={{ marginTop: '30px' }}>
      <Menu.Item key="profile" onClick={NavProf}>
        <UserOutlined />
        <span>Profile</span>
      </Menu.Item>
      <Menu.Item key="activity" onClick={NavPostBlog}>
        <span>Post Blog</span>
      </Menu.Item>
      <Menu.Item key="settings" onClick={NavSettings}>
        <span>Settings</span>
      </Menu.Item>
      <Menu.Item key="help" onClick={NavHelp}>
        <span>Help</span>
      </Menu.Item>
      
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined />
        <span>Logout</span>
      </Menu.Item>
    </Menu>
  );

  const notificationMenu = (
    <Menu style={{ minWidth: "300px", marginTop: "30px" }}>
      <h3 style={{ textAlign: "center", marginTop:"20px", color:"blue" }}>Notifications</h3>
      <Button
        type="primary"
        style={{ display: 'block', margin: '10px auto' }}
        onClick={handleMarkAllAsRead}
      >
        Mark All as Read
      </Button>
      <List
       style={{padding:"8px"}}
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={item => (
          <List.Item
            actions={[
              item.read 
                ? <Tooltip title="Mark as read"><CloseOutlined key="mark-as-unread" onClick={() => handleMarkAsUnread(item._id)} /></Tooltip>
                : <Tooltip title="Mark as Unread"><CheckOutlined key="mark-as-read" onClick={() => handleMarkAsRead(item._id)} /></Tooltip>
            ]}
          >
            <List.Item.Meta
              title={<p onClick={() => handleNotificationClick(item)} style={{cursor:"pointer"}} hoverable>{item.message}</p>}
            />
          </List.Item>
        )}
      />
    </Menu>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo-container">
          <img src={Logo} alt="logo" className="logo" onClick={NavHome} />
          <div className="heading">BlogSum</div>
        </div>
        {isMobile && (
          <div className="menu-icon" onClick={handleMenuToggle}>
            <MenuOutlined />
          </div>
        )}
        <div ref={menuRef}>
          <Menu
            mode={isMobile ? 'vertical' : 'horizontal'}
            className={`custom-navbar ${menuOpen ? 'open' : ''}`}
          >
            <Menu.Item key="home" icon={<HomeOutlined />} onClick={NavHome}>
              Home
            </Menu.Item>
            <Menu.Item key="about" icon={<UserOutlined />} onClick={NavAbout}>
              About
            </Menu.Item>
            <Menu.Item key="services" onClick={() => navigate('/services')}>
              Services
            </Menu.Item>
            <Menu.Item key="contactUs" onClick={() => navigate('/contactus')}>
              Contact Us
            </Menu.Item>
            {isMobile && user && (
              <Menu.Item key="user" className="user-menu-item">
                <Dropdown overlay={userMenu} trigger={['click']}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ marginRight: '10px' }}>{user.username}</span>
                    <Avatar size="medium" style={{ backgroundColor: '#87d068' }} src= {userProfile.profilePicture} />
                     
          
                  </div>
                </Dropdown>
              </Menu.Item>
            )}
            {isMobile && !user && (
              <Menu.Item key="login" className="register-menu-item">
                <Button className="register-button" onClick={NavLogin}>
                  Login
                </Button>
              </Menu.Item>
            )}
          </Menu>
        </div>
        <div className="auth-section" style={{ display: 'flex', alignItems: 'center' }}>
          <Dropdown overlay={notificationMenu} trigger={['click']} style={{width:"200px"}}>
            <Badge count={notificationCount} overflowCount={99}>
              <BellOutlined style={{ fontSize: '20px', marginRight: '5px', cursor: 'pointer' }} />
            </Badge>
          </Dropdown>
          <Badge count={messageCount} overflowCount={99}>
            <MessageOutlined style={{ fontSize: '20px', marginRight: '5px', cursor: 'pointer' }} onClick={NavMessages} />
          </Badge>
          {!isMobile && user && (
            <Dropdown overlay={userMenu} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ marginRight: '10px' }}>{user.username}</span>
                <Avatar size="large" style={{ backgroundColor: '#87d068' }} src={userProfile.profilePicture} />
              </div>
            </Dropdown>
          )}
          {!isMobile && !user && (
            <Button className="register-button" onClick={NavLogin}>
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
