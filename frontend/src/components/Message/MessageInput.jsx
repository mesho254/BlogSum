import React from 'react';
import { Input, Button, Tooltip, Popover } from 'antd';
import {
  SmileOutlined,
  PaperClipOutlined,
  CloseOutlined,
  SendOutlined,
} from '@ant-design/icons';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const { TextArea } = Input;

const MessageInput = ({
  message,
  setMessage,
  filePreview,
  file,
  removeFile,
  showPicker,
  setShowPicker,
  fileInputRef,
  handleFileChange,
  sendMessage,
  replyingTo,
  setReplyingTo,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() || file) {
        sendMessage(e);
      }
    }
  };

  return (
    <div
      style={{
        padding: '12px 20px 16px',
        background: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        position: 'relative',
      }}
    >
      {/* Reply Banner */}
      {replyingTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            borderLeft: '3px solid #4f46e5',
            borderRadius: '8px 12px 12px 8px',
            padding: '8px 12px',
            marginBottom: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5' }}>
              Replying to {replyingTo.sender?.username || 'message'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#475569',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {replyingTo.message}
            </div>
          </div>
          <Button
            type="text"
            size="small"
            shape="circle"
            icon={<CloseOutlined style={{ fontSize: 12 }} />}
            onClick={() => setReplyingTo(null)}
          />
        </div>
      )}

      {/* File / Image Attachment Preview */}
      {filePreview && (
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: 10,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          <img
            src={filePreview}
            alt="Preview"
            style={{ maxHeight: 140, maxWidth: 220, display: 'block', objectFit: 'cover' }}
          />
          <Button
            type="primary"
            danger
            shape="circle"
            icon={<CloseOutlined />}
            size="small"
            onClick={removeFile}
            style={{ position: 'absolute', top: 6, right: 6 }}
          />
        </div>
      )}

      {file && !filePreview && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#eef2ff',
            color: '#4f46e5',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          <span>📎 {file.name}</span>
          <CloseOutlined onClick={removeFile} style={{ cursor: 'pointer', fontSize: 11 }} />
        </div>
      )}

      {/* Modern Pill Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 24,
          padding: '6px 8px 6px 12px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <Popover
          content={
            <Picker
              data={data}
              perLine={8}
              maxFrequentRows={1}
              previewPosition="none"
              theme="light"
              onEmojiSelect={(emojiObj) => {
                setMessage((prev) => prev + emojiObj.native);
                setShowPicker(false);
              }}
            />
          }
          trigger="click"
          open={showPicker}
          onOpenChange={setShowPicker}
          placement="topLeft"
          zIndex={2500}
          getPopupContainer={() => document.body}
          overlayInnerStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden' }}
        >
          <Tooltip title="Emoji">
            <Button
              type="text"
              shape="circle"
              icon={<SmileOutlined style={{ fontSize: 19, color: '#64748b' }} />}
            />
          </Tooltip>
        </Popover>

        <Tooltip title="Attach file or image">
          <Button
            type="text"
            shape="circle"
            icon={<PaperClipOutlined style={{ fontSize: 19, color: '#64748b' }} />}
            onClick={() => fileInputRef.current?.click()}
          />
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <TextArea
          placeholder="Write a message... (Press Enter to send)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 1, maxRows: 5 }}
          style={{
            border: 'none',
            background: 'transparent',
            resize: 'none',
            boxShadow: 'none',
            fontSize: 14,
            padding: '6px 4px',
            flex: 1,
          }}
        />

        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<SendOutlined />}
          onClick={sendMessage}
          disabled={!message.trim() && !file}
          style={{
            background:
              message.trim() || file
                ? 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)'
                : undefined,
            border: 'none',
            boxShadow:
              message.trim() || file ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};

export default MessageInput;
