import React from 'react';
import { Drawer, Button, Spin, Tag, Empty, Popconfirm, message } from 'antd';
import {
  HistoryOutlined,
  ClockCircleOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const RevisionDrawer = ({
  open,
  onClose,
  revisions = [],
  loading = false,
  onRestoreRevision,
  restoring = false,
}) => {
  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HistoryOutlined style={{ color: '#4f46e5', fontSize: '18px' }} />
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
            Story Version History
          </span>
        </div>
      }
      placement="right"
      width={460}
      onClose={onClose}
      open={open}
    >
      <div style={{ paddingBottom: '20px' }}>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>
          Every draft save and publication automatically creates an immutable revision snapshot. You can roll back to any earlier version at any time.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin tip="Loading revision history..." />
          </div>
        ) : revisions.length === 0 ? (
          <Empty description="No prior saved revisions found for this story yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {revisions.map((rev, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={rev._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: isLatest ? '1.5px solid #c7d2fe' : '1px solid #e2e8f0',
                    background: isLatest ? '#f8faff' : '#ffffff',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag color={isLatest ? 'purple' : 'default'} style={{ borderRadius: '999px', fontWeight: 700 }}>
                        v{rev.versionNumber || revisions.length - index}
                      </Tag>
                      {isLatest && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5' }}>
                          Current
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      <ClockCircleOutlined style={{ marginRight: '4px' }} />
                      {moment(rev.createdAt).format('MMM DD, h:mm A')}
                    </span>
                  </div>

                  <h4
                    style={{
                      margin: '4px 0 6px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {rev.title || 'Untitled Draft'}
                  </h4>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      color: '#64748b',
                      marginBottom: '10px',
                    }}
                  >
                    <span>{rev.wordCount || 0} words</span>
                    <span>•</span>
                    <span>{rev.summary || 'Manual save'}</span>
                  </div>

                  {!isLatest && (
                    <Popconfirm
                      title="Restore this revision?"
                      description="Your current unsaved changes will be saved as a revision before restoring."
                      okText="Restore"
                      cancelText="Cancel"
                      onConfirm={() => onRestoreRevision(rev._id)}
                    >
                      <Button
                        type="default"
                        size="small"
                        icon={<RollbackOutlined />}
                        loading={restoring}
                        style={{
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#4f46e5',
                          borderColor: '#c7d2fe',
                        }}
                      >
                        Restore Version
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default RevisionDrawer;

