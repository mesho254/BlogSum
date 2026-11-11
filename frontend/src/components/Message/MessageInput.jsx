import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input, Button, Tooltip, Popover, Avatar } from 'antd';
import {
  SmileOutlined,
  PaperClipOutlined,
  CloseOutlined,
  SendOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import axiosInstance from '../../axiosConfig';
import { REACTION_GIFS } from '../../utils/reactionGifs';

const { TextArea } = Input;

const MessageInput = ({
  message,
  setMessage,
  filePreview,
  file,
  gifUrl,
  setGifUrl,
  removeFile,
  showPicker,
  setShowPicker,
  fileInputRef,
  handleFileChange,
  sendMessage,
  replyingTo,
  setReplyingTo,
  selectedItem,
  users = [],
}) => {
  const textareaRef = useRef(null);

  // Mention State
  const [mentionState, setMentionState] = useState({
    active: false,
    query: '',
    startIndex: -1,
    cursorIndex: -1,
  });
  const [mentionUsers, setMentionUsers] = useState([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  // GIF Picker State
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifActiveCategory, setGifActiveCategory] = useState('All');
  const [customGifUrl, setCustomGifUrl] = useState('');

  const filteredGifs = useMemo(() => {
    return REACTION_GIFS.filter((g) => {
      const matchCat = gifActiveCategory === 'All' || g.category.toLowerCase() === gifActiveCategory.toLowerCase();
      const matchQuery =
        !gifSearchQuery.trim() ||
        g.title.toLowerCase().includes(gifSearchQuery.toLowerCase()) ||
        g.category.toLowerCase().includes(gifSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [gifActiveCategory, gifSearchQuery]);

  // Debounced search for @mentions
  useEffect(() => {
    if (!mentionState.active) {
      setMentionUsers([]);
      setSelectedMentionIdx(0);
      return;
    }

    let isCurrent = true;
    setLoadingMentions(true);

    const handler = setTimeout(async () => {
      try {
        const queryLower = mentionState.query.toLowerCase();

        // 1. Channel members or conversation partners first
        let localCandidates = [];
        if (selectedItem?.type === 'channel' && Array.isArray(selectedItem.members)) {
          localCandidates = selectedItem.members.filter((m) =>
            m?.username && m.username.toLowerCase().includes(queryLower)
          );
        } else if (Array.isArray(users)) {
          localCandidates = users.filter((u) =>
            u?.username && u.username.toLowerCase().includes(queryLower)
          );
        }

        // 2. Query platform-wide mention search
        const response = await axiosInstance.get(
          `/api/users/mention-search?q=${encodeURIComponent(mentionState.query)}`
        );
        const serverUsers = Array.isArray(response.data) ? response.data : [];

        // Deduplicate candidates
        const combined = [...localCandidates];
        for (const sUser of serverUsers) {
          if (!combined.some((c) => String(c._id || c.username) === String(sUser._id || sUser.username))) {
            combined.push(sUser);
          }
        }

        if (isCurrent) {
          setMentionUsers(combined.slice(0, 8));
          setSelectedMentionIdx(0);
        }
      } catch (err) {
        console.error('Error fetching mention suggestions in messages:', err);
      } finally {
        if (isCurrent) setLoadingMentions(false);
      }
    }, 100);

    return () => {
      isCurrent = false;
      clearTimeout(handler);
    };
  }, [mentionState.active, mentionState.query, selectedItem, users]);

  const checkMentionAtCursor = (text, cursorPos) => {
    if (cursorPos === undefined || cursorPos === null) return;
    const textBefore = text.slice(0, cursorPos);
    const atIndex = textBefore.lastIndexOf('@');

    if (atIndex !== -1) {
      const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : ' ';
      const isWordStart = /[\s\n([{]/.test(charBefore) || atIndex === 0;
      const query = textBefore.slice(atIndex + 1);

      if (isWordStart && !/\s/.test(query)) {
        setMentionState({
          active: true,
          query,
          startIndex: atIndex,
          cursorIndex: cursorPos,
        });
        return;
      }
    }

    if (mentionState.active) {
      setMentionState({ active: false, query: '', startIndex: -1, cursorIndex: -1 });
    }
  };

  const handleSelectMention = (targetUser) => {
    if (!targetUser || !targetUser.username) return;
    const username = targetUser.username;

    const before = message.slice(0, mentionState.startIndex);
    const after = message.slice(mentionState.cursorIndex);
    const replacement = `@${username} `;
    const nextText = before + replacement + after;
    setMessage(nextText);
    setMentionState({ active: false, query: '', startIndex: -1, cursorIndex: -1 });

    setTimeout(() => {
      const rawEl = textareaRef.current?.resizableTextArea?.textArea || textareaRef.current;
      if (rawEl) {
        rawEl.focus();
        const newPos = before.length + replacement.length;
        if (rawEl.setSelectionRange) rawEl.setSelectionRange(newPos, newPos);
      }
    }, 15);
  };

  const handleTriggerMentionButton = () => {
    const rawEl = textareaRef.current?.resizableTextArea?.textArea || textareaRef.current;
    const curPos = rawEl ? rawEl.selectionStart : message.length;
    const before = message.slice(0, curPos);
    const after = message.slice(curPos);
    const needLeadingSpace = before.length > 0 && !/[\s\n]$/.test(before);
    const insertStr = (needLeadingSpace ? ' ' : '') + '@';
    const updated = before + insertStr + after;
    setMessage(updated);

    const nextPos = before.length + insertStr.length;
    setTimeout(() => {
      if (rawEl) {
        rawEl.focus();
        if (rawEl.setSelectionRange) rawEl.setSelectionRange(nextPos, nextPos);
      }
      checkMentionAtCursor(updated, nextPos);
    }, 15);
  };

  const handleSelectGif = (url) => {
    if (setGifUrl) setGifUrl(url);
    setGifPickerOpen(false);
  };

  const handleAttachCustomGifUrl = () => {
    if (!customGifUrl.trim()) return;
    let validUrl = customGifUrl.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }
    if (setGifUrl) setGifUrl(validUrl);
    setCustomGifUrl('');
    setGifPickerOpen(false);
  };

  const handleKeyDown = (e) => {
    if (mentionState.active && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev + 1) % mentionUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (mentionUsers[selectedMentionIdx]) {
          handleSelectMention(mentionUsers[selectedMentionIdx]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState({ active: false, query: '', startIndex: -1, cursorIndex: -1 });
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() || file || gifUrl) {
        sendMessage(e);
      }
    }
  };

  const activeAttachment = filePreview || gifUrl;

  return (
    <div
      style={{
        padding: '12px 20px 16px',
        background: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        position: 'relative',
      }}
    >
      {/* Floating Mention Autocomplete Dropdown */}
      {mentionState.active && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 20,
            zIndex: 2600,
            width: '290px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.9)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              background: '#f8fafc',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                @
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                Mention {mentionState.query ? `("${mentionState.query}")` : 'someone'}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              ↑↓ select • ↵ choose
            </span>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
            {loadingMentions ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                Searching members...
              </div>
            ) : mentionUsers.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                No matching users found
              </div>
            ) : (
              mentionUsers.map((mUser, idx) => {
                const isSelected = idx === selectedMentionIdx;
                return (
                  <div
                    key={mUser._id || mUser.username}
                    onClick={() => handleSelectMention(mUser)}
                    onMouseEnter={() => setSelectedMentionIdx(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? '#eef2ff' : 'transparent',
                      borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <Avatar
                      src={mUser.profilePicture}
                      size={26}
                      style={{
                        backgroundColor: '#4f46e5',
                        fontWeight: 700,
                        fontSize: '11px',
                        flexShrink: 0,
                      }}
                    >
                      {(mUser.username || 'U')[0].toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: isSelected ? '#4338ca' : '#0f172a',
                          }}
                        >
                          @{mUser.username}
                        </span>
                        {mUser.roles && mUser.roles !== 'other' && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              background: '#e0e7ff',
                              color: '#4338ca',
                              padding: '1px 5px',
                              borderRadius: '999px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {mUser.roles}
                          </span>
                        )}
                      </div>
                      {mUser.bio && (
                        <div
                          style={{
                            fontSize: '10.5px',
                            color: '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {mUser.bio}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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

      {/* File / GIF Attachment Preview */}
      {activeAttachment && (
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            padding: '6px 12px 6px 6px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px solid #cbd5e1',
          }}
        >
          <img
            src={activeAttachment}
            alt="Preview"
            style={{ height: 60, width: 80, borderRadius: 8, objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              {gifUrl ? 'Reaction GIF' : file?.name || 'Attached File'}
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>Ready to send</span>
          </div>
          <Button
            type="text"
            danger
            shape="circle"
            icon={<CloseOutlined style={{ fontSize: 12 }} />}
            size="small"
            onClick={removeFile}
            style={{ marginLeft: 6 }}
          />
        </div>
      )}

      {file && !filePreview && !gifUrl && (
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
          gap: 6,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 24,
          padding: '6px 8px 6px 10px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Emoji Picker Popover */}
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
              icon={<SmileOutlined style={{ fontSize: 18, color: '#64748b' }} />}
            />
          </Tooltip>
        </Popover>

        {/* Reaction GIF Picker Popover */}
        <Popover
          open={gifPickerOpen}
          onOpenChange={setGifPickerOpen}
          trigger="click"
          placement="topLeft"
          zIndex={2500}
          getPopupContainer={() => document.body}
          content={
            <div style={{ width: '290px', maxHeight: '350px', overflowY: 'auto', padding: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                  Reaction GIFs
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Click to attach</span>
              </div>

              <Input
                size="small"
                placeholder="Search GIFs..."
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                style={{ borderRadius: '6px', marginBottom: '8px', fontSize: '11.5px' }}
                allowClear
              />

              {/* Categories */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  overflowX: 'auto',
                  paddingBottom: '6px',
                  marginBottom: '8px',
                }}
              >
                {['All', 'Applause', 'Thumbs Up', 'Mind Blown', 'Laughing', 'Celebration', 'Fire', 'Love'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGifActiveCategory(cat)}
                    style={{
                      border: 'none',
                      background: gifActiveCategory === cat ? '#4f46e5' : '#f1f5f9',
                      color: gifActiveCategory === cat ? '#ffffff' : '#475569',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* GIFs Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  marginBottom: '8px',
                }}
              >
                {filteredGifs.map((gif, gIdx) => (
                  <div
                    key={gIdx}
                    onClick={() => handleSelectGif(gif.url)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      transition: 'transform 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <img
                      src={gif.url}
                      alt={gif.title}
                      style={{ width: '100%', height: '70px', objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* Custom Image / GIF URL */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                <Input
                  placeholder="Or paste GIF / Image URL"
                  size="small"
                  value={customGifUrl}
                  onChange={(e) => setCustomGifUrl(e.target.value)}
                  onPressEnter={handleAttachCustomGifUrl}
                  style={{ borderRadius: '6px', marginBottom: '6px', fontSize: '11px' }}
                />
                <Button
                  type="primary"
                  size="small"
                  block
                  disabled={!customGifUrl.trim()}
                  onClick={handleAttachCustomGifUrl}
                  style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}
                >
                  Attach GIF URL
                </Button>
              </div>
            </div>
          }
        >
          <Tooltip title="Reaction GIF">
            <Button
              type="text"
              style={{
                padding: '0 6px',
                height: 28,
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
                color: gifPickerOpen ? '#4f46e5' : '#64748b',
                background: gifPickerOpen ? '#e0e7ff' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              GIF
            </Button>
          </Tooltip>
        </Popover>

        {/* @ Mention Trigger Button */}
        <Tooltip title="Mention someone (@)">
          <Button
            type="text"
            shape="circle"
            onClick={handleTriggerMentionButton}
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: mentionState.active ? '#4f46e5' : '#64748b',
              background: mentionState.active ? '#e0e7ff' : 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
            }}
          >
            @
          </Button>
        </Tooltip>

        {/* File / Image Attachment Button */}
        <Tooltip title="Attach file or image">
          <Button
            type="text"
            shape="circle"
            icon={<PaperClipOutlined style={{ fontSize: 18, color: '#64748b' }} />}
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
          ref={textareaRef}
          placeholder="Write a message... (type @ to mention, Press Enter to send)"
          value={message}
          onChange={(e) => {
            const val = e.target.value;
            setMessage(val);
            checkMentionAtCursor(val, e.target.selectionStart);
          }}
          onSelect={(e) => checkMentionAtCursor(message, e.target.selectionStart)}
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
          disabled={!message.trim() && !file && !gifUrl}
          style={{
            background:
              message.trim() || file || gifUrl
                ? 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)'
                : undefined,
            border: 'none',
            boxShadow:
              message.trim() || file || gifUrl ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};

export default MessageInput;
