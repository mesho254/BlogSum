import React from 'react';
import { Input, Button, Card } from 'antd';
import { SmileOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const { TextArea } = Input;

const MessageInput = ({ message, setMessage, filePreview, file, removeFile, showPicker, setShowPicker, fileInputRef, handleFileChange, sendMessage, replyingTo, setReplyingTo }) => {
  return (
    <div style={{ marginTop: '20px', position: 'relative' }}>
      {replyingTo && (
        <Card style={{ marginBottom: '10px' }}>
          <p>Replying to: {replyingTo.message}</p>
          <Button onClick={() => setReplyingTo(null)}>Cancel</Button>
        </Card>
      )}
      <div style={{
        border: '1px solid #d9d9d9',
        borderRadius: '12px',
        padding: '12px',
        backgroundColor: '#fff',
        minHeight: '100px'
      }}>
        {filePreview && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
            <img src={filePreview} alt="Preview" style={{ maxHeight: '200px', maxWidth: '300px', borderRadius: '8px' }} />
            <Button
              type="primary"
              danger
              shape="circle"
              icon={<CloseOutlined />}
              size="small"
              onClick={removeFile}
              style={{ position: 'absolute', top: '-10px', right: '-10px' }}
            />
          </div>
        )}
        {file && !filePreview && (
          <div style={{ marginBottom: '10px', color: '#1890ff', fontWeight: '500' }}>
            📎 {file.name}
            <Button type="text" danger size="small" onClick={removeFile}>Remove</Button>
          </div>
        )}
        <TextArea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 6 }}
          style={{ border: 'none', resize: 'none', boxShadow: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Button
            type="text"
            icon={<SmileOutlined />}
            onClick={() => setShowPicker(!showPicker)}
            style={{ fontSize: '22px' }}
          />
          {showPicker && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <Picker
                data={data}
                onEmojiSelect={(emojiObj) => {
                  setMessage(prev => prev + emojiObj.native);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
        </div>
        <Button
          type="text"
          icon={<PaperClipOutlined />}
          onClick={() => fileInputRef.current?.click()}
          style={{ fontSize: '22px' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          type="primary"
          onClick={sendMessage}
          disabled={!message.trim() && !file}
          style={{ marginLeft: 'auto' }}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;