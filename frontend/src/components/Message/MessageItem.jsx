import React, { useState } from 'react';
import { Avatar, Button, Input, List, Popover, Popconfirm, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import AuthorHoverCard from '../AuthorHoverCard';
import {
  FaUser,
  FaThumbtack,
  FaRegStar,
  FaStar,
  FaTrash,
  FaReply,
  FaArrowRight,
  FaFlag,
  FaEllipsisH,
  FaSmile,
  FaEdit,
} from 'react-icons/fa';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import moment from 'moment';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉'];

export const renderFormattedMessageText = (text, isMe) => {
  if (!text) return null;

  const combinedRegex = /(!\[[^\]]*\]\([^\)]+\)|\[[^\]]+\]\([^\)]+\)|@[a-zA-Z0-9_]+|https?:\/\/[^\s<]+)/g;
  const parts = String(text || '').split(combinedRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. @mention with AuthorHoverCard
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <AuthorHoverCard key={index} author={username}>
          <Link
            to={`/profile/${username}`}
            style={{
              color: isMe ? '#ffffff' : '#4f46e5',
              background: isMe ? 'rgba(255, 255, 255, 0.28)' : '#eef2ff',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '6px',
              display: 'inline-block',
              margin: '0 2px',
              textDecoration: 'none',
              cursor: 'pointer',
              border: isMe ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid #c7d2fe',
              transition: 'all 0.15s ease',
            }}
            onClick={(e) => e.stopPropagation()}
            title={`@${username} (hover for author preview)`}
          >
            {part}
          </Link>
        </AuthorHoverCard>
      );
    }

    // 2. Markdown link [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const url = linkMatch[2];
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isMe ? '#e0e7ff' : '#2563eb',
            fontWeight: 600,
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {linkText || url}
        </a>
      );
    }

    // 3. Raw URL
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isMe ? '#e0e7ff' : '#2563eb',
            fontWeight: 600,
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return part;
  });
};

const MessageItem = ({
  msg,
  user,
  selectedItem,
  getStatusIcon,
  getReactionCounts,
  showReactionPicker,
  setShowReactionPicker,
  addReaction,
  editMessage,
  deleteMessage,
  trashMessage,
  replyingToMessage,
  privateReplyingToMessage,
  forwardMessage,
  togglePin,
  toggleFavorite,
  reportMessage,
  isTrash,
  restoreMessage,
  isFavorites,
}) => {
  const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
  const { counts, usersByEmoji } = getReactionCounts(msg.reactions || []);
  const isFavorited = (msg.favoritedBy || []).some(
    (id) => String(id?._id || id) === String(user?._id)
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.message || '');
  const [menuOpen, setMenuOpen] = useState(false);

  const isReactionOpen = showReactionPicker === msg._id;

  const handleStartEdit = () => {
    setEditText(msg.message || '');
    setIsEditing(true);
    setMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.message) {
      setIsEditing(false);
      return;
    }
    await editMessage(msg._id, trimmed);
    setIsEditing(false);
  };

  const reactionPopoverContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Quick 1-Click Reactions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '4px 6px',
          background: '#f8fafc',
          borderRadius: 999,
          border: '1px solid #e2e8f0',
        }}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              addReaction(msg._id, emoji);
              setShowReactionPicker(null);
            }}
            style={{
              fontSize: 20,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 8,
              transition: 'transform 0.15s ease',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Full Emoji Picker rendered in portal so it is never clipped */}
      <Picker
        data={data}
        perLine={8}
        maxFrequentRows={1}
        previewPosition="none"
        theme="light"
        onEmojiSelect={(emojiObj) => {
          addReaction(msg._id, emojiObj.native);
          setShowReactionPicker(null);
        }}
      />
    </div>
  );

  const moreMenuContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 165 }}>
      <Button
        type="text"
        size="small"
        icon={<FaReply />}
        style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => {
          setMenuOpen(false);
          replyingToMessage(msg);
        }}
      >
        Reply
      </Button>
      {selectedItem?.type === 'channel' && !isMe && (
        <Button
          type="text"
          size="small"
          icon={<FaReply />}
          style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            setMenuOpen(false);
            privateReplyingToMessage(msg);
          }}
        >
          Reply Privately
        </Button>
      )}
      <Button
        type="text"
        size="small"
        icon={<FaArrowRight />}
        style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => {
          setMenuOpen(false);
          forwardMessage(msg);
        }}
      >
        Forward
      </Button>
      {isMe && !isTrash && (
        <Button
          type="text"
          size="small"
          icon={<FaEdit />}
          style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={handleStartEdit}
        >
          Edit Message
        </Button>
      )}
      <Button
        type="text"
        size="small"
        icon={<FaThumbtack />}
        style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => {
          setMenuOpen(false);
          togglePin(msg);
        }}
      >
        {msg.isPinned ? 'Unpin' : 'Pin'}
      </Button>
      <Button
        type="text"
        size="small"
        icon={isFavorited ? <FaStar style={{ color: '#f59e0b' }} /> : <FaRegStar />}
        style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => {
          setMenuOpen(false);
          toggleFavorite(msg);
        }}
      >
        {isFavorited ? 'Unstar' : 'Star'}
      </Button>
      <Button
        type="text"
        size="small"
        icon={<FaFlag />}
        style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => {
          setMenuOpen(false);
          reportMessage(msg);
        }}
      >
        Report
      </Button>
      {isMe && !isTrash && (
        <>
          <Popconfirm
            title="Move message to trash?"
            onConfirm={() => {
              setMenuOpen(false);
              trashMessage(msg._id);
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<FaTrash />}
              style={{
                justifyContent: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#d97706',
              }}
            >
              Move to Trash
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete message permanently?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => {
              setMenuOpen(false);
              deleteMessage(msg._id);
            }}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<FaTrash />}
              style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Delete Message
            </Button>
          </Popconfirm>
        </>
      )}
      {isTrash && (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setMenuOpen(false);
            restoreMessage(msg._id);
          }}
        >
          Restore
        </Button>
      )}
      {isFavorites && (
        <Button
          size="small"
          onClick={() => {
            setMenuOpen(false);
            toggleFavorite(msg);
          }}
        >
          Remove Star
        </Button>
      )}
    </div>
  );

  return (
    <div
      id={`message-${msg._id}`}
      className="msg-bubble-row"
      style={{
        flexDirection: isMe ? 'row-reverse' : 'row',
      }}
    >
      <Avatar
        size={34}
        src={msg.sender?.profilePicture}
        icon={<FaUser />}
        style={{
          backgroundColor: isMe ? '#4f46e5' : '#64748b',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          maxWidth: '68%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start',
          position: 'relative',
        }}
      >
        {/* Sender Name & Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
            padding: '0 4px',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            {isMe ? 'You' : msg.sender?.username}
          </span>
          {msg.isPinned && (
            <Tooltip title="Pinned message">
              <FaThumbtack style={{ fontSize: 11, color: '#4f46e5' }} />
            </Tooltip>
          )}
          {isFavorited && (
            <Tooltip title="Starred message">
              <FaStar style={{ fontSize: 12, color: '#f59e0b' }} />
            </Tooltip>
          )}
        </div>

        {/* Message Bubble */}
        <div
          style={{
            padding: '11px 16px',
            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: isMe
              ? 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)'
              : '#ffffff',
            color: isMe ? '#ffffff' : '#0f172a',
            border: isMe ? 'none' : '1px solid #e2e8f0',
            boxShadow: isMe
              ? '0 6px 18px -4px rgba(79, 70, 229, 0.35)'
              : '0 2px 8px rgba(15, 23, 42, 0.04)',
            position: 'relative',
            wordBreak: 'break-word',
            minWidth: isEditing ? 240 : undefined,
          }}
        >
          {msg.forwardedFrom && (
            <div
              style={{
                fontSize: 11,
                fontStyle: 'italic',
                opacity: 0.82,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <FaArrowRight style={{ fontSize: 10 }} />
              <span>Forwarded from {msg.forwardedFrom?.sender?.username || 'user'}</span>
            </div>
          )}

          {msg.replyTo && (
            <div
              style={{
                marginBottom: 8,
                padding: '6px 10px',
                borderRadius: 10,
                background: isMe ? 'rgba(255, 255, 255, 0.16)' : '#f1f5f9',
                borderLeft: `3px solid ${isMe ? '#ffffff' : '#4f46e5'}`,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {msg.replyTo?.sender?.username || 'Reply'}
              </div>
              <div style={{ opacity: 0.9 }}>{msg.replyTo.message}</div>
            </div>
          )}

          {msg.fileUrl && (
            <img
              src={msg.fileUrl}
              alt="attachment"
              style={{
                maxWidth: '100%',
                maxHeight: 280,
                objectFit: 'cover',
                marginBottom: msg.message ? 8 : 2,
                borderRadius: 12,
                display: 'block',
                cursor: 'pointer',
              }}
              onClick={() => window.open(msg.fileUrl, '_blank')}
              title="Click to view full image in new tab"
            />
          )}

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Input.TextArea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                style={{ borderRadius: 8, fontSize: 13 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Button size="small" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="small" type="primary" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            msg.message && (
              <div style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {renderFormattedMessageText(msg.message, isMe)}
              </div>
            )
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 5,
              marginTop: 4,
              fontSize: 11,
              opacity: isMe ? 0.85 : 0.6,
            }}
          >
            {msg.isEdited && <span>(edited)</span>}
            <span>{moment(msg.createdAt).format('h:mm A')}</span>
            {isMe && <span>{getStatusIcon(msg)}</span>}
          </div>
        </div>

        {/* Reaction Pills */}
        {Object.keys(counts).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {Object.entries(counts).map(([emoji, count]) => (
              <Popover
                key={emoji}
                zIndex={2500}
                content={
                  <List
                    size="small"
                    dataSource={usersByEmoji[emoji]}
                    renderItem={(u) => <List.Item>{u.username}</List.Item>}
                  />
                }
                trigger="click"
              >
                <span
                  style={{
                    cursor: 'pointer',
                    fontSize: 12,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 999,
                    padding: '2px 8px',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  {emoji} {count}
                </span>
              </Popover>
            ))}
          </div>
        )}
      </div>

      {/* Floating Quick Actions on Hover */}
      <div
        className="msg-hover-actions"
        style={{
          position: 'relative',
          opacity: isReactionOpen || menuOpen ? 1 : undefined,
          pointerEvents: isReactionOpen || menuOpen ? 'auto' : undefined,
        }}
      >
        <Popover
          content={reactionPopoverContent}
          trigger="click"
          open={isReactionOpen}
          onOpenChange={(visible) => setShowReactionPicker(visible ? msg._id : null)}
          placement="bottom"
          zIndex={2500}
          getPopupContainer={() => document.body}
          overlayInnerStyle={{ padding: 8, borderRadius: 16 }}
        >
          <Tooltip title="React">
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<FaSmile style={{ color: '#64748b' }} />}
            />
          </Tooltip>
        </Popover>

        <Tooltip title="Reply">
          <Button
            type="text"
            size="small"
            shape="circle"
            icon={<FaReply style={{ color: '#64748b', fontSize: 12 }} />}
            onClick={() => replyingToMessage(msg)}
          />
        </Tooltip>

        <Tooltip title="Forward">
          <Button
            type="text"
            size="small"
            shape="circle"
            icon={<FaArrowRight style={{ color: '#64748b', fontSize: 12 }} />}
            onClick={() => forwardMessage(msg)}
          />
        </Tooltip>

        {isMe && !isTrash && (
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<FaEdit style={{ color: '#64748b', fontSize: 12 }} />}
              onClick={handleStartEdit}
            />
          </Tooltip>
        )}

        <Popover
          content={moreMenuContent}
          trigger="click"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          placement="bottom"
          zIndex={2500}
          getPopupContainer={() => document.body}
        >
          <Button
            type="text"
            size="small"
            shape="circle"
            icon={<FaEllipsisH style={{ color: '#64748b', fontSize: 12 }} />}
          />
        </Popover>
      </div>
    </div>
  );
};

export default MessageItem;
