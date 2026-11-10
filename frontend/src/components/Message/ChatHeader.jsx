import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Popover, Tooltip } from 'antd';
import {
  UserOutlined,
  ArrowLeftOutlined,
  PushpinFilled,
  UserAddOutlined,
  UnorderedListOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const ChatHeader = ({
  selectedItem,
  user,
  onlineUsers = [],
  channelMembers = [],
  pinnedMessages = [],
  onSelectPinnedMessage,
  togglePin,
  openInviteModal,
  onBack,
}) => {
  const [activePinIndex, setActivePinIndex] = useState(0);
  const [allPinsOpen, setAllPinsOpen] = useState(false);

  useEffect(() => {
    if (pinnedMessages.length === 0) {
      setActivePinIndex(0);
    } else if (activePinIndex >= pinnedMessages.length) {
      setActivePinIndex(pinnedMessages.length - 1);
    }
  }, [pinnedMessages.length, activePinIndex]);

  const isUserChat = selectedItem?.type === 'user';
  const isSelf = isUserChat && String(selectedItem?._id) === String(user?._id);
  const isOnline =
    isSelf ||
    (isUserChat && onlineUsers.some((id) => String(id) === String(selectedItem?._id)));

  const isChannelCreator =
    !isUserChat &&
    (String(selectedItem?.createdBy?._id || selectedItem?.createdBy) === String(user?._id) ||
      (!selectedItem?.createdBy &&
        String(selectedItem?.members?.[0]?._id || selectedItem?.members?.[0]) ===
          String(user?._id)));

  const memberIds = channelMembers.length
    ? channelMembers
    : (selectedItem?.members || []).map((m) => m?._id || m);

  const onlineChannelMembersCount = !isUserChat
    ? memberIds.filter(
        (id) =>
          String(id) === String(user?._id) ||
          onlineUsers.some((oId) => String(oId) === String(id))
      ).length
    : 0;

  const displayName = isUserChat
    ? isSelf
      ? `${selectedItem.username} (You)`
      : selectedItem.username
    : `# ${selectedItem?.name}`;

  const currentPinned = pinnedMessages[activePinIndex] || pinnedMessages[0];

  const handlePinnedBannerClick = () => {
    if (!currentPinned) return;
    onSelectPinnedMessage?.(currentPinned._id);
    if (pinnedMessages.length > 1) {
      setActivePinIndex((prev) => (prev + 1) % pinnedMessages.length);
    }
  };

  const allPinnedListContent = (
    <div style={{ width: 320, maxHeight: 340, overflowY: 'auto' }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: '#0f172a',
          padding: '4px 8px 10px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <PushpinFilled style={{ color: '#4f46e5', marginRight: 6 }} />
          {pinnedMessages.length} Pinned {pinnedMessages.length === 1 ? 'Message' : 'Messages'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
        {pinnedMessages.map((pm, idx) => (
          <div
            key={pm._id}
            onClick={() => {
              setActivePinIndex(idx);
              onSelectPinnedMessage?.(pm._id);
              setAllPinsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              background: idx === activePinIndex ? '#eef2ff' : '#f8fafc',
              border: '1px solid',
              borderColor: idx === activePinIndex ? '#c7d2fe' : '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                  {pm.sender?.username || 'User'}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  {moment(pm.createdAt).format('MMM D, h:mm A')}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#334155',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: 2,
                }}
              >
                {pm.message || (pm.fileUrl ? '📷 Attachment' : 'Pinned message')}
              </div>
            </div>
            {togglePin && (
              <Tooltip title="Unpin message">
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined style={{ fontSize: 11, color: '#64748b' }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(pm);
                  }}
                />
              </Tooltip>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ flexShrink: 0, zIndex: 10 }}>
      {/* Main Header Row */}
      <div
        style={{
          height: 68,
          padding: '0 22px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <Button
              type="text"
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ marginRight: 2 }}
            />
          )}

          {isUserChat ? (
            <Badge dot color={isOnline ? '#10b981' : '#cbd5e1'} offset={[-4, 34]}>
              <Avatar
                size={42}
                src={selectedItem.profilePicture}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#4f46e5' }}
              />
            </Badge>
          ) : (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              #
            </div>
          )}

          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', lineHeight: 1.25 }}>
              {displayName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isUserChat ? (isOnline ? '#10b981' : '#cbd5e1') : '#10b981',
                  display: 'inline-block',
                }}
              />
              <span>
                {isUserChat
                  ? isSelf
                    ? 'Personal workspace • Online'
                    : isOnline
                    ? 'Online • Active now'
                    : 'Offline'
                  : `${memberIds.length} members • ${onlineChannelMembersCount} online`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isChannelCreator && openInviteModal && (
            <Button
              type="primary"
              shape="round"
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => openInviteModal(selectedItem)}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              Invite Users
            </Button>
          )}
        </div>
      </div>

      {/* Telegram / WhatsApp Style Pinned Messages Banner */}
      {pinnedMessages.length > 0 && currentPinned && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 18px',
            background: 'rgba(255, 255, 255, 0.96)',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.06)',
          }}
        >
          {/* Left: Multi-Pin Segmented Indicator Bars + Clickable Preview */}
          <div
            onClick={handlePinnedBannerClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            {/* Telegram-style vertical segmented bars */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: 32,
                justifyContent: 'center',
              }}
            >
              {pinnedMessages.map((pm, idx) => (
                <span
                  key={pm._id}
                  style={{
                    width: 3,
                    flex: 1,
                    minHeight: 4,
                    borderRadius: 999,
                    background: idx === activePinIndex ? '#4f46e5' : '#cbd5e1',
                    transition: 'background 0.2s ease',
                  }}
                />
              ))}
            </div>

            <PushpinFilled style={{ color: '#4f46e5', fontSize: 15, flexShrink: 0 }} />

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                  Pinned Message{' '}
                  {pinnedMessages.length > 1
                    ? `#${activePinIndex + 1} of ${pinnedMessages.length}`
                    : ''}
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  • {currentPinned.sender?.username || 'User'}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#1e293b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentPinned.message ||
                  (currentPinned.fileUrl ? '📷 Photo attachment' : 'Pinned message')}
              </div>
            </div>
          </div>

          {/* Right: View All Pinned & Quick Unpin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Popover
              content={allPinnedListContent}
              trigger="click"
              open={allPinsOpen}
              onOpenChange={setAllPinsOpen}
              placement="bottomRight"
              zIndex={2500}
              getPopupContainer={() => document.body}
            >
              <Button
                size="small"
                shape="round"
                icon={<UnorderedListOutlined />}
                style={{
                  fontSize: 12,
                  color: '#4f46e5',
                  borderColor: '#c7d2fe',
                  background: '#eef2ff',
                  fontWeight: 600,
                }}
              >
                All ({pinnedMessages.length})
              </Button>
            </Popover>

            {togglePin && (
              <Tooltip title="Unpin this message">
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined style={{ fontSize: 12, color: '#64748b' }} />}
                  onClick={() => togglePin(currentPinned)}
                />
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
