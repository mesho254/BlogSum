import React from 'react';
import { Modal, Input, Select, Typography, Avatar } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CreateChannelModal = ({
  showModal,
  setShowModal,
  channelName,
  setChannelName,
  selectedMembers = [],
  setSelectedMembers,
  users = [],
  currentUserId,
  createChannel,
}) => {
  const inviteCandidates = users.filter((u) => String(u._id) !== String(currentUserId));

  return (
    <Modal
      title="Create a New Channel"
      open={showModal}
      onOk={createChannel}
      okText="Create Channel"
      onCancel={() => setShowModal(false)}
      zIndex={2600}
      centered
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          Channels are spaces where your community can collaborate and discuss topics together.
        </Text>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
            Channel Name
          </div>
          <Input
            prefix={<TeamOutlined style={{ color: '#6366f1' }} />}
            placeholder="e.g. travel-stories, tech-talk"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            onPressEnter={createChannel}
            size="large"
            style={{ borderRadius: 10 }}
          />
        </div>

        {setSelectedMembers && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              Invite Users (Optional)
            </div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Select users to invite to this channel"
              value={selectedMembers}
              onChange={setSelectedMembers}
              optionLabelProp="label"
              dropdownStyle={{ zIndex: 2700 }}
            >
              {inviteCandidates.map((u) => (
                <Select.Option key={u._id} value={u._id} label={u.username}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size={22} src={u.profilePicture} icon={<UserOutlined />} />
                    <span>{u.username}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateChannelModal;
