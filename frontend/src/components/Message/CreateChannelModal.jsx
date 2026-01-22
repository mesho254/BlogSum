import React from 'react';
import { Modal, Input } from 'antd';

const CreateChannelModal = ({ showModal, setShowModal, channelName, setChannelName, createChannel }) => {
  return (
    <Modal title="Create Channel" open={showModal} onOk={createChannel} onCancel={() => setShowModal(false)}>
      <Input placeholder="Channel Name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
    </Modal>
  );
};

export default CreateChannelModal;