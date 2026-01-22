import React from 'react';
import { Avatar, Button, List, Popover, Popconfirm, Space, Typography, Card } from 'antd';
import { FaUser, FaThumbtack, FaRegStar, FaStar, FaTrash, FaReply, FaArrowRight, FaFlag, FaEllipsisV } from 'react-icons/fa';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import moment from 'moment';
const { Text } = Typography;
const MessageItem = ({ msg, user, channelMembers, selectedItem, getStatusIcon, getReactionCounts, showReactionPicker, setShowReactionPicker, addReaction, trashMessage, replyingToMessage, privateReplyingToMessage, forwardMessage, togglePin, toggleFavorite, reportMessage, isTrash, restoreMessage, isFavorites }) => {
  const { counts, usersByEmoji } = getReactionCounts(msg.reactions);
  const isFavorited = (msg.favoritedBy || []).some(id => id.toString() === user._id.toString());
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
      justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start'
    }}>
      <Avatar src={msg.sender.profilePicture} icon={<FaUser />} />
      <div style={{
        maxWidth: '60%',
        padding: '10px',
        borderRadius: '10px',
        backgroundColor: msg.sender._id === user._id ? '#1890ff' : '#f0f0f0',
        color: msg.sender._id === user._id ? '#fff' : '#000',
        marginLeft: msg.sender._id === user._id ? '0' : '10px',
        marginRight: msg.sender._id === user._id ? '10px' : '0',
        position: 'relative'
      }} id={`message-${msg._id}`}>
        <span style={{ fontWeight: 'bold', marginBottom: '5px' }}>{msg.sender._id === user._id ? 'You' : msg.sender.username}</span>
        {msg.forwardedFrom && (
          <Text italic>Forwarded from {msg.forwardedFrom?.sender?.username}</Text>
        )}
        {msg.replyTo && (
          <Card style={{ marginBottom: '5px', background: '#d9d9d9' }}>
            <p>{msg.replyTo?.sender?.username}: {msg.replyTo.message}</p>
          </Card>
        )}
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
        {msg.isPinned && <FaThumbtack style={{ position: 'absolute', top: '5px', right: '5px' }} />}
        {isFavorited && <FaStar style={{ position: 'absolute', bottom: '5px', right: '5px', color: 'gold' }} />}
        <Space>
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
          <Popover
            content={
              <Space direction="vertical">
                <Button icon={<FaReply />} onClick={() => replyingToMessage(msg)}>Reply</Button>
                {selectedItem?.type === 'channel' && (
                  <Button icon={<FaReply />} onClick={() => privateReplyingToMessage(msg)}>Reply Privately</Button>
                )}
                <Button icon={<FaArrowRight />} onClick={() => forwardMessage(msg)}>Forward</Button>
                <Button icon={<FaThumbtack />} onClick={() => togglePin(msg)}>
                  {msg.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button icon={isFavorited ? <FaStar /> : <FaRegStar />} onClick={() => toggleFavorite(msg)}>
                  {isFavorited ? 'Unfavorite' : 'Favorite'}
                </Button>
                <Button icon={<FaFlag />} onClick={() => reportMessage(msg._id)}>Report</Button>
                {msg.sender._id === user._id && !isTrash && (
                  <Popconfirm title="Move to trash?" onConfirm={() => trashMessage(msg._id)}>
                    <Button danger icon={<FaTrash />}>Trash</Button>
                  </Popconfirm>
                )}
                {isTrash && (
                  <Button onClick={() => restoreMessage(msg._id)}>Restore</Button>
                )}
                {isFavorites && (
                  <Button onClick={() => toggleFavorite(msg)}>Unfavorite</Button>
                )}
              </Space>
            }
            trigger="click"
          >
            <Button size="small" icon={<FaEllipsisV />} />
          </Popover>
        </Space>
      </div>
    </div>
  );
};
export default MessageItem;