import React from 'react';
import { List, Tabs, Button, Typography, Layout } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

const { TabPane } = Tabs;
const { Title } = Typography;
const { Sider } = Layout;

const Sidebar = ({ users, channels, setShowModal, handleItemClick, user, joinChannel, leaveChannel, selectedItem, favorites, trashMessages, handleFavoriteClick, restoreMessage }) => {
  return (
    <Sider
      width={250}
      style={{
        backgroundColor: '#f0f2f5',
        maxHeight: 'calc(100vh - 90px)',
        overflowY: 'auto',
        borderRight: '1px solid #d9d9d9',
        padding: '15px',
      }}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="Users" key="1">
          <List
            itemLayout="horizontal"
            dataSource={users}
            renderItem={(userItem) => {
              const isSelected = selectedItem?.type === 'user' && selectedItem?._id === userItem._id;
              return (
                <List.Item
                  onClick={() => handleItemClick(userItem)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                    borderRadius: '6px',
                    margin: '4px 0',
                    padding: '8px 12px',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={userItem.profilePicture} icon={<UserOutlined />} />}
                    title={userItem._id === user._id ? 'You' : userItem.username}
                    description="No messages yet"
                  />
                </List.Item>
              );
            }}
          />
        </TabPane>
        <TabPane tab="Channels" key="2">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 8px' }}>
            <Title level={5} style={{ margin: 0 }}>Channels</Title>
            <Button type="text" icon={<PlusOutlined />} onClick={() => setShowModal(true)} />
          </div>
          <List
            itemLayout="horizontal"
            dataSource={channels}
            renderItem={(channel) => {
              const isSelected = selectedItem?.type === 'channel' && selectedItem?._id === channel._id;
              const isMember = channel.members.some((m) => m.toString() === user._id.toString());
              return (
                <List.Item
                  style={{
                    cursor: isMember ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                    borderRadius: '6px',
                    margin: '4px 0',
                    padding: '8px 12px',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <List.Item.Meta
                    title={
                      <div
                        onClick={() => isMember && handleItemClick(channel)}
                        style={{ flex: 1 }}
                      >
                        {channel.name}
                      </div>
                    }
                  />
                  {isMember ? (
                    <Button danger size="small" onClick={() => leaveChannel(channel._id)}>
                      Leave
                    </Button>
                  ) : (
                    <Button type="primary" size="small" onClick={() => joinChannel(channel._id)}>
                      Join
                    </Button>
                  )}
                </List.Item>
              );
            }}
          />
        </TabPane>
        <TabPane tab="Favorites" key="3">
          <List
            itemLayout="horizontal"
            dataSource={favorites}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleFavoriteClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  title={item.message.substring(0, 50) + '...'}
                  description={`From ${item.channel ? item.channel.name : (item.receiver?.username || item.sender.username)}`}
                />
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="Trash" key="4">
          <List
            itemLayout="horizontal"
            dataSource={trashMessages}
            renderItem={(item) => (
              <List.Item actions={[<Button onClick={() => restoreMessage(item._id)}>Restore</Button>]}>
                <List.Item.Meta
                  title={item.message.substring(0, 50) + '...'}
                  description={`From ${item.channel ? item.channel.name : (item.receiver?.username || item.sender.username)}`}
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </Sider>
  );
};

export default Sidebar;