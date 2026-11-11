import React, { useState } from 'react';
import { Modal, Button, Input, Checkbox, Spin, Tag, message } from 'antd';
import {
  FolderAddOutlined,
  LockOutlined,
  GlobalOutlined,
  BookOutlined,
  PlusOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';

const ReadingListModal = ({ open, onClose, blogId, blogTitle, user }) => {
  const queryClient = useQueryClient();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListPrivate, setNewListPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['userReadingLists'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/reading-lists', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return res.data || [];
    },
    enabled: Boolean(open && user?.token),
  });

  const handleToggle = async (listId) => {
    if (!blogId) return;
    setTogglingId(listId);
    try {
      const res = await axiosInstance.post(
        `/api/reading-lists/${listId}/toggle-story`,
        { blogId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      message.success(res.data?.message || 'Updated reading list');
      queryClient.invalidateQueries(['userReadingLists']);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update list');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      message.warning('Please enter a name for your reading list');
      return;
    }
    setCreating(true);
    try {
      const res = await axiosInstance.post(
        '/api/reading-lists',
        {
          name: newListName.trim(),
          description: newListDesc.trim(),
          isPrivate: newListPrivate,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      // Automatically add the current story to the newly created list
      if (blogId && res.data?._id) {
        await axiosInstance.post(
          `/api/reading-lists/${res.data._id}/toggle-story`,
          { blogId },
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      }

      message.success(`Created list "${newListName}" and added story!`);
      setNewListName('');
      setNewListDesc('');
      setIsCreatingNew(false);
      queryClient.invalidateQueries(['userReadingLists']);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create reading list');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined style={{ color: '#4f46e5', fontSize: 18 }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
            Save to Reading List
          </span>
        </div>
      }
    >
      <div style={{ padding: '8px 0 16px' }}>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>
          Organize <strong>&ldquo;{blogTitle}&rdquo;</strong> into your private or public reading collections.
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <Spin size="small" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {lists.map((list) => {
              const containsStory = (list.blogs || []).some(
                (b) => String(b._id || b) === String(blogId)
              );
              return (
                <div
                  key={list._id}
                  onClick={() => handleToggle(list._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: containsStory ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                    background: containsStory ? '#f5f3ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Checkbox
                      checked={containsStory}
                      disabled={togglingId === list._id}
                      onChange={() => handleToggle(list._id)}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                          {list.name}
                        </span>
                        {list.isPrivate ? (
                          <LockOutlined style={{ fontSize: 11, color: '#94a3b8' }} title="Private list" />
                        ) : (
                          <GlobalOutlined style={{ fontSize: 11, color: '#10b981' }} title="Public list" />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {list.blogs?.length || 0} stories
                        {list.description ? ` • ${list.description}` : ''}
                      </div>
                    </div>
                  </div>

                  {containsStory && (
                    <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 999 }}>
                      Saved
                    </Tag>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Create List Panel */}
        {!isCreatingNew ? (
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setIsCreatingNew(true)}
            style={{ marginTop: 16, height: 40, borderRadius: 10, fontWeight: 600 }}
          >
            Create New Reading List
          </Button>
        ) : (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
              New Reading List
            </h4>
            <Input
              placeholder="e.g. AI Engineering & Research"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              style={{ marginBottom: 10, borderRadius: 8 }}
              maxLength={80}
            />
            <Input.TextArea
              placeholder="Optional description..."
              rows={2}
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              style={{ marginBottom: 12, borderRadius: 8 }}
              maxLength={200}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Checkbox
                checked={newListPrivate}
                onChange={(e) => setNewListPrivate(e.target.checked)}
              >
                <span style={{ fontSize: 12.5, color: '#475569' }}>Keep this list private</span>
              </Checkbox>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" onClick={() => setIsCreatingNew(false)} style={{ borderRadius: 6 }}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  loading={creating}
                  onClick={handleCreateList}
                  style={{ borderRadius: 6, background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                  Create & Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReadingListModal;

