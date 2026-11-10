import React, { useEffect, useRef } from 'react';
import moment from 'moment';
import { Empty } from 'antd';
import MessageItem from './MessageItem';

const MessageList = ({
  messages,
  user,
  channelMembers,
  getStatusIcon,
  selectedItem,
  getReactionCounts,
  setShowReactionPicker,
  showReactionPicker,
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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length, selectedItem?._id]);

  const groupMessagesByDate = (list = []) => {
    const grouped = {};
    list.forEach((msg) => {
      const date = moment(msg.createdAt).startOf('day').format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(msg);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);
  const dateKeys = Object.keys(groupedMessages);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {dateKeys.length === 0 ? (
        <div
          style={{
            margin: 'auto',
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: '#64748b', fontSize: 14 }}>
                No messages yet. Start the conversation below! 👋
              </span>
            }
          />
        </div>
      ) : (
        dateKeys.map((date) => {
          const header = moment(date).calendar(null, {
            sameDay: '[Today]',
            lastDay: '[Yesterday]',
            lastWeek: 'dddd',
            sameElse: 'MMMM Do, YYYY',
          });
          return (
            <div key={date}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '14px 0 18px',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 999,
                    padding: '4px 14px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748b',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  {header}
                </span>
              </div>
              {groupedMessages[date].map((msg) => (
                <MessageItem
                  key={msg._id}
                  msg={msg}
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
                  reportMessage={reportMessage}
                  isTrash={isTrash}
                  restoreMessage={restoreMessage}
                  isFavorites={isFavorites}
                />
              ))}
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
