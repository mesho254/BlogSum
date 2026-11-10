import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import {
  Spin,
  Button,
  Tag,
  Tooltip,
  Popconfirm,
  Input,
  message,
  Empty,
  Modal,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  SoundOutlined,
  HeartOutlined,
  CommentOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import Navbar from './NavBar';
import moment from 'moment';
import useAuth from '../hooks/useAuth';

const getNotificationMeta = (msg = '') => {
  const lower = String(msg).toLowerCase();
  if (lower.includes('dispatch') || lower.includes('broadcast') || lower.includes('announcement')) {
    return {
      type: 'dispatch',
      label: 'Editorial Dispatch',
      color: '#4f46e5',
      bg: '#eef2ff',
      icon: <SoundOutlined style={{ color: '#4f46e5' }} />,
    };
  }
  if (lower.includes('application') || lower.includes('career') || lower.includes('candidate') || lower.includes('job')) {
    return {
      type: 'career',
      label: 'Talent Application',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      icon: <CompassOutlined style={{ color: '#8b5cf6' }} />,
      actionUrl: '/admin',
      actionLabel: 'Open Admin Talent Center',
    };
  }
  if (lower.includes('liked') || lower.includes('reaction') || lower.includes('love')) {
    return {
      type: 'reaction',
      label: 'Reaction',
      color: '#ec4899',
      bg: '#fdf2f8',
      icon: <HeartOutlined style={{ color: '#ec4899' }} />,
    };
  }
  if (lower.includes('comment') || lower.includes('reply') || lower.includes('replied')) {
    return {
      type: 'comment',
      label: 'Conversation',
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: <CommentOutlined style={{ color: '#0284c7' }} />,
    };
  }
  return {
    type: 'general',
    label: 'Notification',
    color: '#64748b',
    bg: '#f8fafc',
    icon: <BellOutlined style={{ color: '#64748b' }} />,
  };
};

const Notification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'dispatch'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllNotifications = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);

      if (id) {
        const found = list.find((n) => n._id === id);
        if (found) {
          setActiveNotification(found);
        } else {
          // Try fetching by ID directly
          try {
            const singleRes = await axiosInstance.get(`/api/notifications/${id}`);
            setActiveNotification(singleRes.data);
          } catch {
            setActiveNotification(null);
          }
        }
      } else {
        setActiveNotification(null);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();
  }, [id, user?.token]);

  const handleMarkAsRead = async (targetId, e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.put(
        `/api/notifications/${targetId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === targetId ? { ...n, read: true } : n))
      );
      if (activeNotification && activeNotification._id === targetId) {
        setActiveNotification((prev) => ({ ...prev, read: true }));
      }
      message.success('Marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      message.error('Failed to update status.');
    }
  };

  const handleMarkAsUnread = async (targetId, e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.put(
        `/api/notifications/${targetId}/unread`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === targetId ? { ...n, read: false } : n))
      );
      if (activeNotification && activeNotification._id === targetId) {
        setActiveNotification((prev) => ({ ...prev, read: false }));
      }
      message.success('Marked as unread');
    } catch (error) {
      console.error('Error marking as unread:', error);
      message.error('Failed to update status.');
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.put(
        `/api/notifications/read/all`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (activeNotification) {
        setActiveNotification((prev) => ({ ...prev, read: true }));
      }
      message.success('All notifications marked as read.');
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Failed to mark all as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async (targetId, e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.delete(`/api/notifications/${targetId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== targetId));
      if (activeNotification && activeNotification._id === targetId) {
        setActiveNotification(null);
        navigate('/notifications');
      }
      message.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      message.error('Failed to remove notification.');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === 'unread' && n.read) return false;
      const meta = getNotificationMeta(n.message);
      if (filterTab === 'dispatch' && meta.type !== 'dispatch') return false;
      if (filterTab === 'career' && meta.type !== 'career') return false;
      if (filterTab === 'comment' && meta.type !== 'comment') return false;
      if (filterTab === 'reaction' && meta.type !== 'reaction') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return String(n.message || '').toLowerCase().includes(query);
      }
      return true;
    });
  }, [notifications, filterTab, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const dispatchCount = notifications.filter(
    (n) => getNotificationMeta(n.message).type === 'dispatch'
  ).length;
  const careerCount = notifications.filter(
    (n) => getNotificationMeta(n.message).type === 'career'
  ).length;

  return (
    <>
      <Navbar />
      <div className="ed-notif-page-wrap">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

          .ed-notif-page-wrap {
            min-height: 100vh;
            background: #f8fafc;
            padding: 104px 20px 80px;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #0f172a;
          }

          .ed-notif-container {
            max-width: 1040px;
            margin: 0 auto;
          }

          .ed-notif-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
          }

          .ed-notif-kicker {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 700;
            color: #4f46e5;
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
          }

          .ed-notif-title {
            font-family: 'Newsreader', serif;
            font-size: 32px;
            font-weight: 600;
            color: #0f172a;
            margin: 0;
            letter-spacing: -0.02em;
          }

          .ed-notif-subtitle {
            font-size: 14px;
            color: #64748b;
            margin: 4px 0 0;
          }

          .ed-notif-card-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
            overflow: hidden;
          }

          .ed-notif-tabs-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid #f1f5f9;
            flex-wrap: wrap;
            gap: 12px;
          }

          .ed-notif-tab-pill {
            border: none;
            background: transparent;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .ed-notif-tab-pill:hover {
            color: #0f172a;
            background: #f1f5f9;
          }

          .ed-notif-tab-pill.active {
            background: #0f172a;
            color: #ffffff;
          }

          .ed-notif-badge-pill {
            background: rgba(255, 255, 255, 0.2);
            color: inherit;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
          }

          .ed-notif-tab-pill:not(.active) .ed-notif-badge-pill {
            background: #e2e8f0;
            color: #475569;
          }

          /* Active Inspector Box */
          .ed-notif-featured-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #4f46e5;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 24px;
          }

          .ed-notif-item-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 18px 24px;
            border-bottom: 1px solid #f1f5f9;
            cursor: pointer;
            transition: background 0.15s ease;
            gap: 16px;
          }

          .ed-notif-item-row:hover {
            background: #f8fafc;
          }

          .ed-notif-item-row.is-active {
            background: #eef2ff;
          }

          .ed-notif-unread-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4f46e5;
            flex-shrink: 0;
            margin-top: 6px;
          }

          .ed-notif-read-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #cbd5e1;
            flex-shrink: 0;
            margin-top: 6px;
          }

          .ed-notif-avatar-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 16px;
          }
        `}</style>

        <div className="ed-notif-container">
          {/* Header */}
          <div className="ed-notif-topbar">
            <div>
              <div className="ed-notif-kicker">
                <BellOutlined />
                <span>Editorial Dispatch & Activity</span>
              </div>
              <h1 className="ed-notif-title">Notifications</h1>
              <p className="ed-notif-subtitle">
                Keep track of reader engagement, platform announcements, and story alerts.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleMarkAllAsRead}
                  loading={actionLoading}
                  style={{
                    borderRadius: 999,
                    background: '#0f172a',
                    borderColor: '#0f172a',
                    fontWeight: 600,
                  }}
                >
                  Mark All as Read ({unreadCount})
                </Button>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchAllNotifications}
                loading={loading}
                style={{ borderRadius: 999 }}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Main Card Box */}
          <div className="ed-notif-card-box">
            {/* Tabs & Search */}
            <div className="ed-notif-tabs-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`ed-notif-tab-pill ${filterTab === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterTab('all')}
                >
                  All
                  <span className="ed-notif-badge-pill">{notifications.length}</span>
                </button>
                <button
                  type="button"
                  className={`ed-notif-tab-pill ${filterTab === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilterTab('unread')}
                >
                  Unread
                  <span className="ed-notif-badge-pill">{unreadCount}</span>
                </button>
                <button
                  type="button"
                  className={`ed-notif-tab-pill ${filterTab === 'dispatch' ? 'active' : ''}`}
                  onClick={() => setFilterTab('dispatch')}
                >
                  Dispatches
                  {dispatchCount > 0 && <span className="ed-notif-badge-pill">{dispatchCount}</span>}
                </button>
                {careerCount > 0 && (
                  <button
                    type="button"
                    className={`ed-notif-tab-pill ${filterTab === 'career' ? 'active' : ''}`}
                    onClick={() => setFilterTab('career')}
                  >
                    Talent
                    <span className="ed-notif-badge-pill">{careerCount}</span>
                  </button>
                )}
              </div>

              <div style={{ minWidth: 240 }}>
                <Input
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Filter notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  style={{ borderRadius: 999 }}
                />
              </div>
            </div>

            {/* Content List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin tip="Loading notifications..." />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    filterTab === 'unread'
                      ? 'No unread notifications — you are all caught up!'
                      : 'No notifications found'
                  }
                />
              </div>
            ) : (
              <div>
                {filteredNotifications.map((item) => {
                  const meta = getNotificationMeta(item.message);
                  const isSelected = activeNotification?._id === item._id;

                  return (
                    <div
                      key={item._id}
                      className={`ed-notif-item-row ${isSelected ? 'is-active' : ''}`}
                      onClick={() => {
                        if (!item.read) handleMarkAsRead(item._id);
                        setActiveNotification(item);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                        {item.read ? (
                          <span className="ed-notif-read-dot" />
                        ) : (
                          <span className="ed-notif-unread-dot" />
                        )}

                        <div
                          className="ed-notif-avatar-icon"
                          style={{ background: meta.bg }}
                        >
                          {meta.icon}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: meta.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {meta.label}
                            </span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>•</span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              {moment(item.createdAt).fromNow()}
                            </span>
                            {isSelected && (
                              <Tag color="purple" style={{ borderRadius: 999, fontSize: 10, margin: 0 }}>
                                Selected
                              </Tag>
                            )}
                          </div>

                          <p
                            style={{
                              margin: '0 0 6px',
                              fontSize: 14,
                              color: item.read ? '#475569' : '#0f172a',
                              fontWeight: item.read ? 400 : 600,
                              lineHeight: 1.5,
                            }}
                          >
                            {item.message}
                          </p>

                          {meta.actionUrl && (
                            <div style={{ marginTop: 6 }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(meta.actionUrl);
                                }}
                                style={{
                                  border: '1px solid #c7d2fe',
                                  background: '#eef2ff',
                                  color: '#4f46e5',
                                  padding: '3px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <span>{meta.actionLabel || 'View Resource'}</span>
                                <ArrowRightOutlined style={{ fontSize: 10 }} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip title="View Details">
                          <Button
                            type="text"
                            size="small"
                            shape="circle"
                            icon={<EyeOutlined style={{ color: '#64748b', fontSize: 13 }} />}
                            onClick={() => setActiveNotification(item)}
                          />
                        </Tooltip>

                        <Tooltip title={item.read ? 'Mark as unread' : 'Mark as read'}>
                          <Button
                            type="text"
                            size="small"
                            shape="circle"
                            icon={
                              item.read ? (
                                <ClockCircleOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
                              ) : (
                                <CheckOutlined style={{ color: '#4f46e5', fontSize: 13 }} />
                              )
                            }
                            onClick={(e) =>
                              item.read
                                ? handleMarkAsUnread(item._id, e)
                                : handleMarkAsRead(item._id, e)
                            }
                          />
                        </Tooltip>

                        <Popconfirm
                          title="Delete notification?"
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                          onConfirm={(e) => handleDeleteNotification(item._id, e)}
                        >
                          <Button
                            type="text"
                            size="small"
                            shape="circle"
                            danger
                            icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal: View & Inspect Notification Details */}
        <Modal
          open={!!activeNotification}
          onCancel={() => {
            setActiveNotification(null);
            navigate('/notifications');
          }}
          footer={null}
          centered
          width={560}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'Newsreader, serif', fontSize: 20, fontWeight: 600 }}>
                Notification Details
              </span>
              {activeNotification && (
                <Tag
                  color={activeNotification.read ? 'default' : 'processing'}
                  style={{ borderRadius: 999, fontWeight: 600, fontSize: 11 }}
                >
                  {activeNotification.read ? 'Read' : 'New'}
                </Tag>
              )}
            </div>
          }
        >
          {activeNotification && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: getNotificationMeta(activeNotification.message).bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {getNotificationMeta(activeNotification.message).icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {getNotificationMeta(activeNotification.message).label}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {moment(activeNotification.createdAt).calendar()} (
                    {moment(activeNotification.createdAt).fromNow()})
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: '#0f172a',
                  background: '#ffffff',
                  padding: '18px 20px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  marginBottom: 20,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {activeNotification.message}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 16,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 10 }}>
                  {activeNotification.read ? (
                    <Button
                      onClick={() => handleMarkAsUnread(activeNotification._id)}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    >
                      Mark as Unread
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={() => handleMarkAsRead(activeNotification._id)}
                      style={{
                        borderRadius: 8,
                        background: '#0f172a',
                        borderColor: '#0f172a',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {getNotificationMeta(activeNotification.message).actionUrl && (
                    <Button
                      type="default"
                      onClick={() => {
                        navigate(getNotificationMeta(activeNotification.message).actionUrl);
                        setActiveNotification(null);
                      }}
                      style={{
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#4f46e5',
                        borderColor: '#c7d2fe',
                        fontWeight: 600,
                      }}
                    >
                      {getNotificationMeta(activeNotification.message).actionLabel || 'View Resource →'}
                    </Button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Popconfirm
                    title="Delete this notification?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDeleteNotification(activeNotification._id)}
                  >
                    <Button danger type="text" icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                  <Button
                    onClick={() => {
                      setActiveNotification(null);
                      navigate('/notifications');
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default Notification;
