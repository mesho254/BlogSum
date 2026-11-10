import React, { useState, useMemo } from 'react';
import { Avatar, Button, Input, Badge, Tooltip, Empty, Tag } from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  DeleteOutlined,
  TeamOutlined,
  MessageOutlined,
  UndoOutlined,
  UserAddOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const tabs = [
  { key: 'users', label: 'Chats', icon: <MessageOutlined /> },
  { key: 'channels', label: 'Channels', icon: <TeamOutlined /> },
  { key: 'favorites', label: 'Starred', icon: <StarFilled /> },
  { key: 'trash', label: 'Trash', icon: <DeleteOutlined /> },
];

const Sidebar = ({
  users,
  channels,
  onlineUsers = [],
  setShowModal,
  openInviteModal,
  handleItemClick,
  user,
  joinChannel,
  leaveChannel,
  acceptChannelInvite,
  declineChannelInvite,
  selectedItem,
  favorites,
  trashMessages,
  handleFavoriteClick,
  restoreMessage,
}) => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    if (String(userId) === String(user?._id)) return true;
    return onlineUsers.some((id) => String(id) === String(userId));
  };

  const onlineCount = useMemo(
    () => users.filter((u) => isUserOnline(u._id)).length,
    [users, onlineUsers, user?._id]
  );

  const pendingInviteCount = useMemo(
    () =>
      channels.filter((c) =>
        (c.pendingInvites || []).some((id) => String(id?._id || id) === String(user?._id))
      ).length,
    [channels, user?._id]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const list = users.filter((u) => {
      if (q && !u.username?.toLowerCase().includes(q)) return false;
      if (showOnlineOnly && !isUserOnline(u._id)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const aOnline = isUserOnline(a._id) ? 1 : 0;
      const bOnline = isUserOnline(b._id) ? 1 : 0;
      return bOnline - aOnline;
    });
  }, [users, searchTerm, showOnlineOnly, onlineUsers, user?._id]);

  const filteredChannels = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const list = !q
      ? channels
      : channels.filter((c) => c.name?.toLowerCase().includes(q));
    // Sort channels with pending invites for current user to the top
    return [...list].sort((a, b) => {
      const aPending = (a.pendingInvites || []).some(
        (id) => String(id?._id || id) === String(user?._id)
      )
        ? 1
        : 0;
      const bPending = (b.pendingInvites || []).some(
        (id) => String(id?._id || id) === String(user?._id)
      )
        ? 1
        : 0;
      return bPending - aPending;
    });
  }, [channels, searchTerm, user?._id]);

  return (
    <aside className="modern-chat-sidebar">
      {/* Top Header & Search */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Conversations
          </span>
          <Tooltip title="Create New Channel">
            <Button
              type="primary"
              size="small"
              shape="round"
              icon={<PlusOutlined />}
              onClick={() => {
                setActiveTab('channels');
                setShowModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                border: 'none',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Channel
            </Button>
          </Tooltip>
        </div>

        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search people or channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{
            borderRadius: 12,
            background: '#f1f5f9',
            border: '1px solid transparent',
            padding: '6px 12px',
          }}
        />

        {/* Modern Pill Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            const count =
              t.key === 'channels'
                ? pendingInviteCount
                : t.key === 'favorites'
                ? favorites?.length
                : t.key === 'trash'
                ? trashMessages?.length
                : 0;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  border: 'none',
                  borderRadius: 9,
                  padding: '6px 4px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#4f46e5' : '#64748b',
                  background: isActive ? '#ffffff' : 'transparent',
                  boxShadow: isActive ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      background:
                        t.key === 'channels'
                          ? '#f59e0b'
                          : isActive
                          ? '#eef2ff'
                          : '#e2e8f0',
                      color:
                        t.key === 'channels'
                          ? '#ffffff'
                          : isActive
                          ? '#4f46e5'
                          : '#475569',
                      borderRadius: 999,
                      padding: '0 5px',
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Online Filter Bar in Chats Tab */}
        {activeTab === 'users' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
              padding: '0 2px',
            }}
          >
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  marginRight: 6,
                }}
              />
              {onlineCount} active online
            </span>
            <button
              type="button"
              onClick={() => setShowOnlineOnly((prev) => !prev)}
              style={{
                border: '1px solid',
                borderColor: showOnlineOnly ? '#4f46e5' : '#e2e8f0',
                background: showOnlineOnly ? '#eef2ff' : '#ffffff',
                color: showOnlineOnly ? '#4f46e5' : '#64748b',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showOnlineOnly ? 'Showing Online' : 'Filter Online'}
            </button>
          </div>
        )}
      </div>

      {/* Scrollable List Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {activeTab === 'users' && (
          <>
            {filteredUsers.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={showOnlineOnly ? 'No other users online right now' : 'No users found'}
              />
            ) : (
              filteredUsers.map((userItem) => {
                const isSelected =
                  selectedItem?.type === 'user' && selectedItem?._id === userItem._id;
                const isSelf = String(userItem._id) === String(user?._id);
                const online = isUserOnline(userItem._id);
                return (
                  <div
                    key={userItem._id}
                    className={`chat-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleItemClick(userItem)}
                  >
                    <Badge
                      dot
                      color={online ? '#10b981' : '#cbd5e1'}
                      offset={[-4, 34]}
                      style={{ width: 9, height: 9 }}
                    >
                      <Avatar
                        size={42}
                        src={userItem.profilePicture}
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor: isSelected ? '#4f46e5' : '#6366f1',
                          flexShrink: 0,
                        }}
                      />
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: isSelected ? '#1e1b4b' : '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isSelf ? `${userItem.username} (You)` : userItem.username}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: online ? '#10b981' : '#94a3b8',
                          fontWeight: online ? 500 : 400,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSelf
                          ? 'Personal notes & saved items'
                          : online
                          ? 'Online • Active now'
                          : 'Offline'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'channels' && (
          <>
            {filteredChannels.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No channels yet" />
            ) : (
              filteredChannels.map((channel) => {
                const isSelected =
                  selectedItem?.type === 'channel' && selectedItem?._id === channel._id;
                const isMember = channel.members?.some(
                  (m) => String(m?._id || m) === String(user?._id)
                );
                const isPendingInvite = (channel.pendingInvites || []).some(
                  (id) => String(id?._id || id) === String(user?._id)
                );
                const isCreator =
                  String(channel.createdBy?._id || channel.createdBy) === String(user?._id) ||
                  (!channel.createdBy &&
                    String(channel.members?.[0]?._id || channel.members?.[0]) ===
                      String(user?._id));
                const pendingCountForChannel = (channel.pendingInvites || []).length;

                return (
                  <div
                    key={channel._id}
                    className={`chat-item-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      cursor: isMember ? 'pointer' : 'default',
                      background: isPendingInvite && !isSelected ? '#fffbeb' : undefined,
                      borderColor: isPendingInvite && !isSelected ? '#fde68a' : undefined,
                    }}
                    onClick={() => isMember && handleItemClick(channel)}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: isSelected
                          ? '#4f46e5'
                          : isPendingInvite
                          ? '#fef3c7'
                          : '#eef2ff',
                        color: isSelected
                          ? '#ffffff'
                          : isPendingInvite
                          ? '#d97706'
                          : '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      #
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {channel.name}
                        </span>
                        {isPendingInvite && (
                          <Tag
                            color="warning"
                            style={{
                              fontSize: 10,
                              lineHeight: '16px',
                              padding: '0 6px',
                              borderRadius: 999,
                              margin: 0,
                            }}
                          >
                            Invited
                          </Tag>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {isPendingInvite
                          ? 'Invitation pending your response'
                          : `${channel.members?.length || 0} members${
                              isCreator && pendingCountForChannel > 0
                                ? ` • ${pendingCountForChannel} pending`
                                : isCreator
                                ? ' • Owner'
                                : ''
                            }`}
                      </span>
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isPendingInvite ? (
                        <>
                          <Tooltip title="Accept invitation">
                            <Button
                              type="primary"
                              size="small"
                              shape="round"
                              icon={<CheckOutlined />}
                              onClick={() => acceptChannelInvite(channel._id)}
                              style={{ background: '#10b981', borderColor: '#10b981' }}
                            >
                              Accept
                            </Button>
                          </Tooltip>
                          <Tooltip title="Deny invitation">
                            <Button
                              danger
                              size="small"
                              shape="round"
                              icon={<CloseOutlined />}
                              onClick={() => declineChannelInvite(channel._id)}
                            >
                              Deny
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          {isCreator && (
                            <Tooltip title="Invite users to this channel">
                              <Button
                                size="small"
                                shape="round"
                                icon={<UserAddOutlined />}
                                onClick={() => openInviteModal(channel)}
                                style={{
                                  color: '#4f46e5',
                                  borderColor: '#c7d2fe',
                                  background: '#eef2ff',
                                }}
                              >
                                Invite
                              </Button>
                            </Tooltip>
                          )}
                          {isMember ? (
                            <Button
                              danger
                              size="small"
                              shape="round"
                              onClick={() => leaveChannel(channel._id)}
                            >
                              Leave
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              shape="round"
                              onClick={() => joinChannel(channel._id)}
                              style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                            >
                              Join
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {!favorites || favorites.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No starred messages" />
            ) : (
              favorites.map((item) => (
                <div
                  key={item._id}
                  className="chat-item-card"
                  onClick={() => handleFavoriteClick(item)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <StarFilled />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.message || 'Attachment'}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      From{' '}
                      {item.channel
                        ? `#${item.channel.name}`
                        : item.receiver?.username || item.sender?.username}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'trash' && (
          <>
            {!trashMessages || trashMessages.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trash is empty" />
            ) : (
              trashMessages.map((item) => (
                <div key={item._id} className="chat-item-card" style={{ cursor: 'default' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.message || 'Attachment'}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      From{' '}
                      {item.channel
                        ? `#${item.channel.name}`
                        : item.receiver?.username || item.sender?.username}
                    </span>
                  </div>
                  <Button
                    size="small"
                    shape="round"
                    icon={<UndoOutlined />}
                    onClick={() => restoreMessage(item._id)}
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
