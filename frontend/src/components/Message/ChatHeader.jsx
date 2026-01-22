import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ChatHeader = ({ selectedItem, user }) => {
  return (
    <Title level={4}>Chat with {selectedItem.type === 'user' ? (selectedItem._id === user._id ? 'yourself' : selectedItem.username) : selectedItem.name}</Title>
  );
};

export default ChatHeader;