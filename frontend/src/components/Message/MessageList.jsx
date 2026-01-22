import React from 'react';
import moment from 'moment';
import MessageItem from './MessageItem';

const MessageList = ({ messages, user, channelMembers, getStatusIcon, selectedItem, getReactionCounts, setShowReactionPicker, showReactionPicker, addReaction, trashMessage, replyingToMessage, privateReplyingToMessage, forwardMessage, togglePin, toggleFavorite, reportMessage, isTrash, restoreMessage, isFavorites, deleteMessage }) => {
  const groupMessagesByDate = (messages) => {
    const groupedMessages = {};
    messages.forEach((msg) => {
      const date = moment(msg.createdAt).startOf('day').format('YYYY-MM-DD');
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(msg);
    });
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div style={{
      maxHeight: '400px',
      overflowY: 'auto',
      padding: '10px',
      border: '1px solid #f0f0f0',
      borderRadius: '4px',
      backgroundColor: '#fff'
    }}>
      {Object.keys(groupedMessages).map((date) => {
        let header = moment(date).calendar(null, {
          sameDay: '[Today]',
          lastDay: '[Yesterday]',
          lastWeek: 'dddd',
          sameElse: 'MMMM Do YYYY'
        });
        return (
          <div key={date}>
            <div style={{ textAlign: 'center', margin: '10px 0', fontWeight: 'bold' }}>{header}</div>
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
      })}
    </div>
  );
};

export default MessageList;