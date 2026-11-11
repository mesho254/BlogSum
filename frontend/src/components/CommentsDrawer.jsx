import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Drawer, Avatar, Input, Button, Empty, message, Popover, Modal } from 'antd';
import {
  CommentOutlined,
  HeartOutlined,
  HeartFilled,
  SendOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
  LinkOutlined,
  PictureOutlined,
  SmileOutlined,
  CloseCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import EmojiPicker from 'emoji-picker-react';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import AuthorHoverCard from './AuthorHoverCard';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '💡', '🙌'];

const REACTION_GIFS = [
  { id: '1', title: 'Applause', category: 'Applause', url: 'https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/giphy.gif' },
  { id: '2', title: 'Mind Blown', category: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: '3', title: 'Thumbs Up', category: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: '4', title: 'Celebration', category: 'Celebration', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: '5', title: 'Laughing', category: 'Laughing', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { id: '6', title: 'Fire', category: 'Fire', url: 'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif' },
  { id: '7', title: 'Love', category: 'Love', url: 'https://media.giphy.com/media/26FLdm964upIslUZ2/giphy.gif' },
  { id: '8', title: 'Thinking', category: 'Thinking', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif' },
  { id: '9', title: 'Dancing', category: 'Celebration', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: '10', title: 'High Five', category: 'Applause', url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif' },
  { id: '11', title: 'Wow', category: 'Mind Blown', url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif' },
  { id: '12', title: 'Agreement', category: 'Thumbs Up', url: 'https://media.giphy.com/media/ap6wcjRyi8HoA/giphy.gif' },
];

const hasLiked = (likes = [], userId) =>
  Boolean(userId && Array.isArray(likes) && likes.some((id) => String(id?._id || id) === String(userId)));

export const getTotalCommentsCount = (comments = []) => {
  if (!Array.isArray(comments)) return 0;
  return comments.reduce(
    (sum, c) => sum + 1 + (Array.isArray(c.replies) ? c.replies.length : 0),
    0
  );
};

export const renderFormattedCommentText = (text, attachment, onImageClick) => {
  if (!text && !attachment) return null;

  // Split tokens: markdown images ![alt](url), markdown links [text](url), @mentions, and raw URLs
  const combinedRegex = /(!\[[^\]]*\]\([^\)]+\)|\[[^\]]+\]\([^\)]+\)|@[a-zA-Z0-9_]+|https?:\/\/[^\s<]+)/g;

  const parts = String(text || '').split(combinedRegex);

  const renderedContent = parts.map((part, index) => {
    if (!part) return null;

    // 1. Markdown image: ![alt](url)
    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1] || 'Embedded image';
      const url = imgMatch[2];
      return (
        <div key={index} style={{ margin: '8px 0', maxWidth: '100%' }}>
          <img
            src={url}
            alt={alt}
            style={{
              maxHeight: '220px',
              maxWidth: '100%',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'block',
              objectFit: 'cover',
              cursor: 'zoom-in',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
            }}
            onClick={() => onImageClick && onImageClick(url)}
            loading="lazy"
          />
        </div>
      );
    }

    // 2. Markdown link: [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const url = linkMatch[2];
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#2563eb',
            fontWeight: 600,
            textDecoration: 'underline',
            wordBreak: 'break-all',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title={url}
        >
          <span>{linkText || url}</span>
          <LinkOutlined style={{ fontSize: '10.5px' }} />
        </a>
      );
    }

    // 3. @mention with AuthorHoverCard
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <AuthorHoverCard key={index} author={username}>
          <Link
            to={`/profile/${username}`}
            style={{
              color: '#4f46e5',
              fontWeight: 700,
              background: '#eef2ff',
              padding: '1px 6px',
              borderRadius: '6px',
              display: 'inline-block',
              margin: '0 1px',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0e7ff';
              e.currentTarget.style.color = '#3730a3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#eef2ff';
              e.currentTarget.style.color = '#4f46e5';
            }}
            title={`@${username} (hover to preview)`}
          >
            {part}
          </Link>
        </AuthorHoverCard>
      );
    }

    // 4. Raw URL: https?://...
    if (/^https?:\/\//i.test(part)) {
      if (/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(part) || part.includes('giphy.com/media/')) {
        return (
          <div key={index} style={{ margin: '8px 0', maxWidth: '100%' }}>
            <img
              src={part}
              alt="Media"
              style={{
                maxHeight: '220px',
                maxWidth: '100%',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'block',
                objectFit: 'cover',
                cursor: 'zoom-in',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
              }}
              onClick={() => onImageClick && onImageClick(part)}
              loading="lazy"
            />
          </div>
        );
      }
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#2563eb',
            fontWeight: 600,
            textDecoration: 'underline',
            wordBreak: 'break-all',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span>{part}</span>
          <LinkOutlined style={{ fontSize: '10.5px' }} />
        </a>
      );
    }

    return part;
  });

  return (
    <>
      {renderedContent}
      {attachment && (
        <div style={{ marginTop: text && text.trim() ? '8px' : '0px', maxWidth: '100%' }}>
          <img
            src={attachment}
            alt="Attached media"
            style={{
              maxHeight: '220px',
              maxWidth: '100%',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'block',
              objectFit: 'cover',
              cursor: 'zoom-in',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
            }}
            onClick={() => onImageClick && onImageClick(attachment)}
            loading="lazy"
          />
        </div>
      )}
    </>
  );
};

export const CommentsThreadContent = ({
  blogId,
  blogAuthorId,
  comments = [],
  onCommentsUpdated,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [collapsedThreads, setCollapsedThreads] = useState({});
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'

  // Ref to composer textarea
  const composerTextareaRef = useRef(null);
  // Refs for reply inputs
  const replyInputRefs = useRef({});

  // @Mentions Autocomplete State
  const [mentionState, setMentionState] = useState({
    active: false,
    query: '',
    target: null, // 'composer' or commentId
    startIndex: -1,
    cursorIndex: -1,
  });
  const [mentionUsers, setMentionUsers] = useState([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  // Lightbox Zoom Image Modal
  const [lightboxImg, setLightboxImg] = useState(null);

  // Comment Attachment (Image / GIF)
  const [commentAttachment, setCommentAttachment] = useState(null); // { url, type, name }
  const [replyAttachmentMap, setReplyAttachmentMap] = useState({}); // { [commentId]: { url, type, name } }
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const imageFileInputRef = useRef(null);
  const replyImageInputRefs = useRef({});

  // Tool Modals & Popovers
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [replyEmojiPickerOpen, setReplyEmojiPickerOpen] = useState(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [replyLinkModalOpen, setReplyLinkModalOpen] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [replyGifPickerOpen, setReplyGifPickerOpen] = useState(null);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifActiveCategory, setGifActiveCategory] = useState('All');
  const [customGifUrl, setCustomGifUrl] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [replyImageModalOpen, setReplyImageModalOpen] = useState(null);
  const [customImageUrl, setCustomImageUrl] = useState('');

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

  const handleUploadImageFile = async (e, targetId = 'composer') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      message.error('File size must be less than 10MB');
      return;
    }

    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await axiosInstance.post('/api/blogs/upload-comment-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        if (targetId === 'composer') {
          setCommentAttachment({
            url: res.data.url,
            type: file.type.startsWith('image/gif') ? 'gif' : 'image',
            name: file.name,
          });
        } else {
          setReplyAttachmentMap((prev) => ({
            ...prev,
            [targetId]: {
              url: res.data.url,
              type: file.type.startsWith('image/gif') ? 'gif' : 'image',
              name: file.name,
            },
          }));
        }
        message.success('Image attached successfully');
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      message.error('Failed to upload image. You can also paste an image URL.');
    } finally {
      setUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleInsertLink = (targetId = 'composer') => {
    if (!linkUrl.trim()) {
      message.warning('Please enter a valid URL');
      return;
    }
    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    const markdown = linkText.trim() ? `[${linkText.trim()}](${formattedUrl})` : formattedUrl;

    if (targetId === 'composer') {
      const ta = composerTextareaRef.current?.resizableTextArea?.textArea;
      const curPos = ta ? ta.selectionStart : newComment.length;
      const before = newComment.slice(0, curPos);
      const after = newComment.slice(curPos);
      const needSpace = before.length > 0 && !/[\s\n]$/.test(before);
      const updated = before + (needSpace ? ' ' : '') + markdown + ' ' + after;
      setNewComment(updated);
      setLinkModalOpen(false);
    } else {
      const current = replyTextMap[targetId] || '';
      setReplyTextMap((prev) => ({
        ...prev,
        [targetId]: current + (current.length > 0 ? ' ' : '') + markdown + ' ',
      }));
      setReplyLinkModalOpen(null);
    }

    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertEmoji = (emojiStr, targetId = 'composer') => {
    if (targetId === 'composer') {
      setNewComment((prev) => `${prev}${emojiStr}`);
    } else {
      setReplyTextMap((prev) => ({
        ...prev,
        [targetId]: `${prev[targetId] || ''}${emojiStr}`,
      }));
    }
  };

  const handleSelectGif = (gifUrl, targetId = 'composer') => {
    if (targetId === 'composer') {
      setCommentAttachment({
        url: gifUrl,
        type: 'gif',
        name: 'Reaction GIF',
      });
      setGifPickerOpen(false);
    } else {
      setReplyAttachmentMap((prev) => ({
        ...prev,
        [targetId]: {
          url: gifUrl,
          type: 'gif',
          name: 'Reaction GIF',
        },
      }));
      setReplyGifPickerOpen(null);
    }
  };

  const handleAttachImageUrl = (url, targetId = 'composer') => {
    if (!url.trim()) return;
    let validUrl = url.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }
    if (targetId === 'composer') {
      setCommentAttachment({
        url: validUrl,
        type: /\.gif/i.test(validUrl) ? 'gif' : 'image',
        name: 'Web Image',
      });
      setImageModalOpen(false);
    } else {
      setReplyAttachmentMap((prev) => ({
        ...prev,
        [targetId]: {
          url: validUrl,
          type: /\.gif/i.test(validUrl) ? 'gif' : 'image',
          name: 'Web Image',
        },
      }));
      setReplyImageModalOpen(null);
    }
    setCustomImageUrl('');
  };

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
        const response = await axiosInstance.get(
          `/api/users/mention-search?q=${encodeURIComponent(mentionState.query)}`
        );
        if (isCurrent) {
          setMentionUsers(Array.isArray(response.data) ? response.data : []);
          setSelectedMentionIdx(0);
        }
      } catch (err) {
        console.error('Error fetching mention suggestions:', err);
      } finally {
        if (isCurrent) setLoadingMentions(false);
      }
    }, 100);

    return () => {
      isCurrent = false;
      clearTimeout(handler);
    };
  }, [mentionState.active, mentionState.query]);

  const checkMentionAtCursor = (text, cursorPos, targetId = 'composer') => {
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
          target: targetId,
          startIndex: atIndex,
          cursorIndex: cursorPos,
        });
        return;
      }
    }

    if (mentionState.active && mentionState.target === targetId) {
      setMentionState({ active: false, query: '', target: null, startIndex: -1, cursorIndex: -1 });
    }
  };

  const handleSelectMention = (targetUser) => {
    if (!targetUser || !targetUser.username) return;
    const username = targetUser.username;

    if (mentionState.target === 'composer') {
      const before = newComment.slice(0, mentionState.startIndex);
      const after = newComment.slice(mentionState.cursorIndex);
      const replacement = `@${username} `;
      const nextText = before + replacement + after;
      setNewComment(nextText);
      setMentionState({ active: false, query: '', target: null, startIndex: -1, cursorIndex: -1 });

      setTimeout(() => {
        const ta = composerTextareaRef.current?.resizableTextArea?.textArea;
        if (ta) {
          ta.focus();
          const newPos = before.length + replacement.length;
          ta.setSelectionRange(newPos, newPos);
        }
      }, 10);
    } else if (mentionState.target) {
      const commentId = mentionState.target;
      const current = replyTextMap[commentId] || '';
      const before = current.slice(0, mentionState.startIndex);
      const after = current.slice(mentionState.cursorIndex);
      const replacement = `@${username} `;
      const nextText = before + replacement + after;
      setReplyTextMap((prev) => ({ ...prev, [commentId]: nextText }));
      setMentionState({ active: false, query: '', target: null, startIndex: -1, cursorIndex: -1 });

      setTimeout(() => {
        const inputEl = replyInputRefs.current[commentId];
        const rawEl = inputEl?.input || inputEl;
        if (rawEl && rawEl.focus) {
          rawEl.focus();
          const newPos = before.length + replacement.length;
          if (rawEl.setSelectionRange) rawEl.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  const handleComposerKeyDown = (e) => {
    if (mentionState.active && mentionState.target === 'composer' && mentionUsers.length > 0) {
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
        setMentionState({ active: false, query: '', target: null, startIndex: -1, cursorIndex: -1 });
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && (newComment.trim() || commentAttachment)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleTriggerMentionButton = () => {
    const ta = composerTextareaRef.current?.resizableTextArea?.textArea;
    const curPos = ta ? ta.selectionStart : newComment.length;
    const before = newComment.slice(0, curPos);
    const after = newComment.slice(curPos);
    const needLeadingSpace = before.length > 0 && !/[\s\n]$/.test(before);
    const insertStr = (needLeadingSpace ? ' ' : '') + '@';
    const updated = before + insertStr + after;
    const newPos = before.length + insertStr.length;

    setNewComment(updated);
    setMentionState({
      active: true,
      query: '',
      target: 'composer',
      startIndex: newPos - 1,
      cursorIndex: newPos,
    });

    setTimeout(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const renderMentionDropdown = (targetId) => {
    if (!mentionState.active || mentionState.target !== targetId) return null;
    const isComposer = targetId === 'composer';

    return (
      <div
        className="mention-autocomplete-menu"
        style={{
          position: 'absolute',
          top: isComposer ? 'calc(100% + 4px)' : 'calc(100% + 4px)',
          left: '0',
          right: '0',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.16), 0 6px 12px -4px rgba(15, 23, 42, 0.08)',
          zIndex: 1200,
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div
          style={{
            padding: '7px 12px',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '6px',
                background: '#4f46e5',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              @
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
              Mention a user {mentionState.query ? `("${mentionState.query}")` : ''}
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            ↑↓ navigate • ↵ select • Esc close
          </span>
        </div>

        <div style={{ maxHeight: '210px', overflowY: 'auto', padding: '4px' }}>
          {loadingMentions ? (
            <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              Searching users...
            </div>
          ) : mentionUsers.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
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
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? '#eef2ff' : 'transparent',
                    borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Avatar
                    src={mUser.profilePicture}
                    size={28}
                    style={{
                      backgroundColor: '#4f46e5',
                      fontWeight: 700,
                      fontSize: '12px',
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
                          fontSize: '12.5px',
                          color: isSelected ? '#4338ca' : '#0f172a',
                        }}
                      >
                        @{mUser.username}
                      </span>
                      {mUser.roles && mUser.roles !== 'other' && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            background: '#e0e7ff',
                            color: '#4338ca',
                            padding: '1px 6px',
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
                          fontSize: '11px',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '280px',
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
    );
  };

  const sortedComments = useMemo(() => {
    const list = [...(comments || [])];
    if (sortBy === 'popular') {
      return list.sort(
        (a, b) =>
          (b.likes?.length || 0) +
          (b.replies?.length || 0) -
          ((a.likes?.length || 0) + (a.replies?.length || 0))
      );
    }
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [comments, sortBy]);

  const syncUpdatedComments = (updatedComments) => {
    if (onCommentsUpdated) {
      onCommentsUpdated(updatedComments);
    }
    queryClient.setQueryData(['blog', blogId], (old) =>
      old ? { ...old, comments: updatedComments } : old
    );
    queryClient.setQueryData(['blogs'], (old) =>
      Array.isArray(old)
        ? old.map((b) => (String(b._id) === String(blogId) ? { ...b, comments: updatedComments } : b))
        : old
    );
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim() && !commentAttachment) return;
    setSubmittingComment(true);
    try {
      const response = await axiosInstance.post(`/api/blogs/${blogId}/comment`, {
        comment: newComment.trim(),
        attachment: commentAttachment?.url || '',
      });
      setNewComment('');
      setCommentAttachment(null);
      syncUpdatedComments(response.data);
      message.success('Comment posted');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId, mentionPrefix = '') => {
    if (!user) {
      navigate('/login');
      return;
    }
    const rawReply = (replyTextMap[commentId] || '').trim();
    const replyAtt = replyAttachmentMap[commentId];
    if (!rawReply && !replyAtt) return;

    setSubmittingReplyId(commentId);
    try {
      const response = await axiosInstance.post(
        `/api/blogs/${blogId}/comment/${commentId}/reply`,
        {
          comment: mentionPrefix ? `${mentionPrefix} ${rawReply}` : rawReply,
          attachment: replyAtt?.url || '',
        }
      );
      setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
      setReplyAttachmentMap((prev) => ({ ...prev, [commentId]: null }));
      setActiveReplyCommentId(null);
      setCollapsedThreads((prev) => ({ ...prev, [commentId]: false }));
      syncUpdatedComments(response.data);
      message.success('Reply added');
    } catch (error) {
      console.error('Error replying to comment:', error);
      message.error('Failed to post reply');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const handleToggleCommentLike = async (commentId, replyId = null) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await axiosInstance.put(
        `/api/blogs/${blogId}/comment/${commentId}/like`,
        replyId ? { replyId } : {}
      );
      syncUpdatedComments(response.data);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const toggleCollapseThread = (commentId) => {
    setCollapsedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Comment Composer Card */}
      {user ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Avatar
              src={user.profilePicture}
              size={38}
              style={{
                backgroundColor: '#4f46e5',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.username?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                {renderMentionDropdown('composer')}
                <Input.TextArea
                  ref={composerTextareaRef}
                  value={newComment}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewComment(val);
                    checkMentionAtCursor(val, e.target.selectionStart, 'composer');
                  }}
                  onSelect={(e) => checkMentionAtCursor(newComment, e.target.selectionStart, 'composer')}
                  onClick={(e) => checkMentionAtCursor(newComment, e.target.selectionStart, 'composer')}
                  onKeyUp={(e) => {
                    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                      checkMentionAtCursor(newComment, e.target.selectionStart, 'composer');
                    }
                  }}
                  onKeyDown={handleComposerKeyDown}
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  placeholder="Add a thoughtful comment (type @ to mention someone)..."
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    padding: '10px 12px',
                  }}
                />
              </div>

              {/* Attachment Preview Chip */}
              {commentAttachment && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '5px 10px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    maxWidth: '100%',
                  }}
                >
                  <img
                    src={commentAttachment.url}
                    alt="attachment preview"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#334155',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {commentAttachment.name || (commentAttachment.type === 'gif' ? 'Attached GIF' : 'Attached Image')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCommentAttachment(null)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '14px',
                    }}
                    title="Remove attachment"
                  >
                    <CloseCircleFilled />
                  </button>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  {/* Quick Emojis */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewComment((prev) => `${prev}${emoji}`)}
                        style={{
                          border: 'none',
                          background: '#ffffff',
                          borderRadius: '6px',
                          width: '26px',
                          height: '26px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* More Emojis Popover with EmojiPicker */}
                  <Popover
                    open={emojiPickerOpen}
                    onOpenChange={setEmojiPickerOpen}
                    trigger="click"
                    placement="bottomLeft"
                    content={
                      <div style={{ width: '300px' }}>
                        <EmojiPicker
                          onEmojiClick={(emojiData) => handleInsertEmoji(emojiData.emoji, 'composer')}
                          autoFocusSearch={false}
                          height={330}
                          width="100%"
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    }
                  >
                    <button
                      type="button"
                      style={{
                        border: '1px solid #e2e8f0',
                        background: emojiPickerOpen ? '#e0e7ff' : '#ffffff',
                        borderRadius: '6px',
                        padding: '0 6px',
                        height: '26px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#4f46e5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                      title="More emojis"
                    >
                      <SmileOutlined style={{ fontSize: '13px' }} />
                    </button>
                  </Popover>

                  {/* @ Mention Button */}
                  <button
                    type="button"
                    onClick={handleTriggerMentionButton}
                    style={{
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      borderRadius: '6px',
                      padding: '0 8px',
                      height: '26px',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#4f46e5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                    }}
                    title="Mention a user with @"
                  >
                    <span style={{ fontSize: '12px' }}>@</span>
                    <span>Mention</span>
                  </button>

                  {/* Add Link Popover */}
                  <Popover
                    open={linkModalOpen}
                    onOpenChange={setLinkModalOpen}
                    trigger="click"
                    placement="bottomLeft"
                    content={
                      <div style={{ width: '250px', padding: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                          Insert Link
                        </div>
                        <Input
                          placeholder="https://example.com"
                          size="small"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          style={{ borderRadius: '6px', marginBottom: '8px', fontSize: '12px' }}
                          onPressEnter={() => handleInsertLink('composer')}
                        />
                        <Input
                          placeholder="Display text (optional)"
                          size="small"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          style={{ borderRadius: '6px', marginBottom: '10px', fontSize: '12px' }}
                          onPressEnter={() => handleInsertLink('composer')}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <Button size="small" onClick={() => setLinkModalOpen(false)}>Cancel</Button>
                          <Button type="primary" size="small" onClick={() => handleInsertLink('composer')}>Insert</Button>
                        </div>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      style={{
                        border: '1px solid #e2e8f0',
                        background: linkModalOpen ? '#e0e7ff' : '#ffffff',
                        borderRadius: '6px',
                        padding: '0 7px',
                        height: '26px',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                      title="Add Link"
                    >
                      <LinkOutlined style={{ fontSize: '12px' }} />
                      <span>Link</span>
                    </button>
                  </Popover>

                  {/* GIF Picker Popover */}
                  <Popover
                    open={gifPickerOpen}
                    onOpenChange={setGifPickerOpen}
                    trigger="click"
                    placement="bottomLeft"
                    content={
                      <div style={{ width: '290px', maxHeight: '340px', overflowY: 'auto', padding: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>Reaction GIFs</span>
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
                        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
                          {['All', 'Applause', 'Thumbs Up', 'Mind Blown', 'Laughing', 'Celebration', 'Fire', 'Love'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setGifActiveCategory(cat)}
                              style={{
                                border: 'none',
                                background: gifActiveCategory === cat ? '#4f46e5' : '#f1f5f9',
                                color: gifActiveCategory === cat ? '#ffffff' : '#475569',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          {filteredGifs.map((gif) => (
                            <div
                              key={gif.id}
                              onClick={() => handleSelectGif(gif.url, 'composer')}
                              style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: '1px solid #e2e8f0',
                                height: '80px',
                                background: '#f8fafc',
                              }}
                              title={gif.title}
                            >
                              <img
                                src={gif.url}
                                alt={gif.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                          <Input
                            size="small"
                            placeholder="Or paste GIF URL..."
                            value={customGifUrl}
                            onChange={(e) => setCustomGifUrl(e.target.value)}
                            onPressEnter={() => {
                              if (customGifUrl.trim()) {
                                handleSelectGif(customGifUrl.trim(), 'composer');
                                setCustomGifUrl('');
                              }
                            }}
                            suffix={
                              <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                  if (customGifUrl.trim()) {
                                    handleSelectGif(customGifUrl.trim(), 'composer');
                                    setCustomGifUrl('');
                                  }
                                }}
                                style={{ padding: 0, fontSize: '11px', fontWeight: 600 }}
                              >
                                Add
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      style={{
                        border: '1px solid #e2e8f0',
                        background: gifPickerOpen ? '#e0e7ff' : '#ffffff',
                        borderRadius: '6px',
                        padding: '0 8px',
                        height: '26px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                      title="Reaction GIFs"
                    >
                      <span>GIF</span>
                    </button>
                  </Popover>

                  {/* Image Upload / Attach Button */}
                  <Popover
                    open={imageModalOpen}
                    onOpenChange={setImageModalOpen}
                    trigger="click"
                    placement="bottomLeft"
                    content={
                      <div style={{ width: '240px', padding: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                          Attach Image
                        </div>
                        <Button
                          icon={uploadingMedia ? <LoadingOutlined /> : <PictureOutlined />}
                          size="small"
                          block
                          loading={uploadingMedia}
                          onClick={() => imageFileInputRef.current?.click()}
                          style={{ marginBottom: '8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}
                        >
                          Upload from device
                        </Button>
                        <div style={{ textAlign: 'center', fontSize: '10.5px', color: '#94a3b8', margin: '4px 0' }}>or paste URL</div>
                        <Input
                          size="small"
                          placeholder="https://...image.png"
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          onPressEnter={() => handleAttachImageUrl(customImageUrl, 'composer')}
                          style={{ borderRadius: '6px', marginBottom: '8px', fontSize: '11.5px' }}
                        />
                        <Button
                          type="primary"
                          size="small"
                          block
                          disabled={!customImageUrl.trim()}
                          onClick={() => handleAttachImageUrl(customImageUrl, 'composer')}
                          style={{ borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}
                        >
                          Attach Image
                        </Button>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      style={{
                        border: '1px solid #e2e8f0',
                        background: imageModalOpen ? '#e0e7ff' : '#ffffff',
                        borderRadius: '6px',
                        padding: '0 7px',
                        height: '26px',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                      title="Attach image"
                    >
                      <PictureOutlined style={{ fontSize: '12px' }} />
                      <span>Image</span>
                    </button>
                  </Popover>

                  <input
                    type="file"
                    ref={imageFileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,.gif"
                    onChange={(e) => handleUploadImageFile(e, 'composer')}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submittingComment}
                  disabled={!newComment.trim() && !commentAttachment}
                  onClick={handleAddComment}
                  style={{
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '12px',
                    height: '30px',
                    padding: '0 14px',
                    background: (newComment.trim() || commentAttachment)
                      ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                      : undefined,
                    border: 'none',
                    marginLeft: 'auto',
                  }}
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 10px', color: '#475569', fontSize: '13.5px', fontWeight: 500 }}>
            Sign in to join the discussion and reply to comments
          </p>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate('/login')}
            style={{
              borderRadius: '999px',
              fontWeight: 600,
              padding: '0 18px',
              height: '32px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              border: 'none',
            }}
          >
            Login to Comment
          </Button>
        </div>
      )}

      {/* Sort & Filter Bar */}
      {sortedComments.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>
            {sortedComments.length} {sortedComments.length === 1 ? 'Comment' : 'Comments'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['newest', 'popular'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortBy(mode)}
                style={{
                  border: 'none',
                  background: sortBy === mode ? '#eef2ff' : 'transparent',
                  color: sortBy === mode ? '#4f46e5' : '#64748b',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {mode === 'newest' ? 'Most Recent' : 'Top Liked'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Threaded Comments List */}
      {sortedComments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
              No comments yet. Start the conversation!
            </span>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedComments.map((comment) => {
            const commentAuthor = comment.user || {};
            const commentAuthorId = commentAuthor._id || commentAuthor;
            const isBlogAuthor =
              Boolean(blogAuthorId && commentAuthorId) &&
              String(commentAuthorId) === String(blogAuthorId);
            const commentLiked = hasLiked(comment.likes, user?._id);
            const commentLikesCount = comment.likes?.length || 0;
            const replies = Array.isArray(comment.replies) ? comment.replies : [];
            const isReplying = activeReplyCommentId === comment._id;
            const isCollapsed = Boolean(collapsedThreads[comment._id]);

            return (
              <div key={comment._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AuthorHoverCard author={commentAuthor}>
                  <Link to={commentAuthorId ? `/profile/${commentAuthorId}` : '#'}>
                    <Avatar
                      src={commentAuthor.profilePicture}
                      size={36}
                      style={{
                        backgroundColor: '#4f46e5',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(commentAuthor.username || 'U')[0].toUpperCase()}
                    </Avatar>
                  </Link>
                </AuthorHoverCard>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Comment Bubble */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '0 16px 16px 16px',
                      padding: '10px 14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <AuthorHoverCard author={commentAuthor}>
                          <Link
                            to={commentAuthorId ? `/profile/${commentAuthorId}` : '#'}
                            style={{
                              fontWeight: 700,
                              fontSize: '13px',
                              color: '#0f172a',
                              textDecoration: 'none',
                            }}
                          >
                            {commentAuthor.username || 'User'}
                          </Link>
                        </AuthorHoverCard>
                        {isBlogAuthor && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: '#eef2ff',
                              color: '#4f46e5',
                              padding: '1px 7px',
                              borderRadius: '999px',
                              border: '1px solid #c7d2fe',
                            }}
                          >
                            Author
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                        {comment.date ? moment(comment.date).fromNow() : 'Just now'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13.5px',
                        color: '#334155',
                        lineHeight: 1.55,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {renderFormattedCommentText(comment.comment, comment.attachment, setLightboxImg)}
                    </div>
                  </div>

                  {/* Comment Action Bar (Like, Reply, Collapse/Expand Replies) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginTop: '6px',
                      paddingLeft: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCommentLike(comment._id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: commentLiked ? 700 : 600,
                        color: commentLiked ? '#e11d48' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {commentLiked ? <HeartFilled /> : <HeartOutlined />}
                      <span>Like{commentLikesCount > 0 ? ` (${commentLikesCount})` : ''}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const willOpen = !isReplying;
                        setActiveReplyCommentId(willOpen ? comment._id : null);
                        if (willOpen && commentAuthor?.username) {
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [comment._id]: prev[comment._id] || `@${commentAuthor.username} `,
                          }));
                        }
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isReplying ? '#4f46e5' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <MessageOutlined style={{ fontSize: '11.5px' }} />
                      <span>Reply</span>
                    </button>

                    {replies.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleCollapseThread(comment._id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#4f46e5',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isCollapsed ? (
                          <>
                            <DownOutlined style={{ fontSize: '10px' }} />
                            <span>
                              View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </>
                        ) : (
                          <>
                            <UpOutlined style={{ fontSize: '10px' }} />
                            <span>
                              Hide {replies.length === 1 ? 'reply' : 'replies'} ({replies.length})
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Inline Reply Box */}
                  {isReplying && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingLeft: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          {renderMentionDropdown(comment._id)}
                          <Input
                            ref={(el) => {
                              replyInputRefs.current[comment._id] = el;
                            }}
                            size="small"
                            value={replyTextMap[comment._id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReplyTextMap((prev) => ({
                                ...prev,
                                [comment._id]: val,
                              }));
                              checkMentionAtCursor(val, e.target.selectionStart, comment._id);
                            }}
                            onSelect={(e) =>
                              checkMentionAtCursor(replyTextMap[comment._id] || '', e.target.selectionStart, comment._id)
                            }
                            onKeyDown={(e) => {
                              if (mentionState.active && mentionState.target === comment._id && mentionUsers.length > 0) {
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
                                  setMentionState({ active: false, query: '', target: null, startIndex: -1, cursorIndex: -1 });
                                  return;
                                }
                              }
                              if (e.key === 'Enter') {
                                handleAddReply(comment._id);
                              }
                            }}
                            placeholder={`Reply to ${commentAuthor.username || 'comment'}... (type @ to mention)`}
                            style={{
                              borderRadius: '999px',
                              padding: '6px 12px',
                              fontSize: '12.5px',
                            }}
                            autoFocus
                          />
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          loading={submittingReplyId === comment._id}
                          disabled={!(replyTextMap[comment._id] || '').trim() && !replyAttachmentMap[comment._id]}
                          onClick={() => handleAddReply(comment._id)}
                          style={{
                            borderRadius: '999px',
                            height: '30px',
                            padding: '0 14px',
                            fontWeight: 600,
                            fontSize: '12px',
                            background: ((replyTextMap[comment._id] || '').trim() || replyAttachmentMap[comment._id])
                              ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                              : undefined,
                            border: 'none',
                          }}
                        >
                          Reply
                        </Button>
                      </div>

                      {/* Reply Attachment Preview */}
                      {replyAttachmentMap[comment._id] && (
                        <div
                          style={{
                            padding: '4px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: 'fit-content',
                            maxWidth: '100%',
                          }}
                        >
                          <img
                            src={replyAttachmentMap[comment._id].url}
                            alt="preview"
                            style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                            {replyAttachmentMap[comment._id].name || 'Attachment'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setReplyAttachmentMap((prev) => ({ ...prev, [comment._id]: null }))}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                          >
                            <CloseCircleFilled style={{ fontSize: '12px' }} />
                          </button>
                        </div>
                      )}

                      {/* Reply Actions (Emoji, GIF, Image, Link) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji, comment._id)}
                            style={{
                              border: 'none',
                              background: '#f1f5f9',
                              borderRadius: '6px',
                              width: '22px',
                              height: '22px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            {emoji}
                          </button>
                        ))}

                        <Popover
                          open={replyEmojiPickerOpen === comment._id}
                          onOpenChange={(v) => setReplyEmojiPickerOpen(v ? comment._id : null)}
                          trigger="click"
                          placement="bottomLeft"
                          content={
                            <div style={{ width: '290px' }}>
                              <EmojiPicker
                                onEmojiClick={(d) => handleInsertEmoji(d.emoji, comment._id)}
                                autoFocusSearch={false}
                                height={300}
                                width="100%"
                                previewConfig={{ showPreview: false }}
                              />
                            </div>
                          }
                        >
                          <button
                            type="button"
                            style={{
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              borderRadius: '6px',
                              padding: '0 5px',
                              height: '22px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              color: '#4f46e5',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Emojis"
                          >
                            <SmileOutlined style={{ fontSize: '11px' }} />
                          </button>
                        </Popover>

                        <Popover
                          open={replyGifPickerOpen === comment._id}
                          onOpenChange={(v) => setReplyGifPickerOpen(v ? comment._id : null)}
                          trigger="click"
                          placement="bottomLeft"
                          content={
                            <div style={{ width: '280px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                              <div style={{ fontWeight: 700, fontSize: '11.5px', marginBottom: '6px' }}>Reaction GIFs</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                {REACTION_GIFS.map((gif, gIdx) => (
                                  <div
                                    key={gIdx}
                                    onClick={() => handleSelectGif(gif.url, comment._id)}
                                    style={{ cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}
                                  >
                                    <img src={gif.url} alt={gif.title} style={{ width: '100%', height: '70px', objectFit: 'cover' }} loading="lazy" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          }
                        >
                          <button
                            type="button"
                            style={{
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              borderRadius: '6px',
                              padding: '0 5px',
                              height: '22px',
                              cursor: 'pointer',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#6366f1',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            GIF
                          </button>
                        </Popover>

                        <Popover
                          open={replyImageModalOpen === comment._id}
                          onOpenChange={(v) => setReplyImageModalOpen(v ? comment._id : null)}
                          trigger="click"
                          placement="bottomLeft"
                          content={
                            <div style={{ width: '240px', padding: '4px' }}>
                              <Button
                                size="small"
                                icon={uploadingMedia ? <LoadingOutlined /> : <PictureOutlined />}
                                loading={uploadingMedia}
                                block
                                onClick={() => replyImageInputRefs.current[comment._id]?.click()}
                                style={{ borderRadius: '6px', marginBottom: '8px', fontSize: '11.5px' }}
                              >
                                Upload Image
                              </Button>
                              <Input
                                placeholder="Or paste image URL"
                                size="small"
                                value={customImageUrl}
                                onChange={(e) => setCustomImageUrl(e.target.value)}
                                onPressEnter={() => handleAttachImageUrl(customImageUrl, comment._id)}
                                style={{ borderRadius: '6px', marginBottom: '8px', fontSize: '11.5px' }}
                              />
                              <Button
                                type="primary"
                                size="small"
                                block
                                disabled={!customImageUrl.trim()}
                                onClick={() => handleAttachImageUrl(customImageUrl, comment._id)}
                                style={{ borderRadius: '6px', fontSize: '11.5px' }}
                              >
                                Attach
                              </Button>
                            </div>
                          }
                        >
                          <button
                            type="button"
                            style={{
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              borderRadius: '6px',
                              padding: '0 5px',
                              height: '22px',
                              cursor: 'pointer',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <PictureOutlined style={{ fontSize: '11px' }} />
                            <span>Img</span>
                          </button>
                        </Popover>

                        <input
                          type="file"
                          ref={(el) => { replyImageInputRefs.current[comment._id] = el; }}
                          style={{ display: 'none' }}
                          accept="image/*,.gif"
                          onChange={(e) => handleUploadImageFile(e, comment._id)}
                        />

                        <Popover
                          open={replyLinkModalOpen === comment._id}
                          onOpenChange={(v) => setReplyLinkModalOpen(v ? comment._id : null)}
                          trigger="click"
                          placement="bottomLeft"
                          content={
                            <div style={{ width: '230px', padding: '4px' }}>
                              <Input
                                placeholder="https://example.com"
                                size="small"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                style={{ borderRadius: '6px', marginBottom: '6px', fontSize: '11.5px' }}
                                onPressEnter={() => handleInsertLink(comment._id)}
                              />
                              <Input
                                placeholder="Display text (optional)"
                                size="small"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                style={{ borderRadius: '6px', marginBottom: '8px', fontSize: '11.5px' }}
                                onPressEnter={() => handleInsertLink(comment._id)}
                              />
                              <Button
                                type="primary"
                                size="small"
                                block
                                onClick={() => handleInsertLink(comment._id)}
                                style={{ borderRadius: '6px', fontSize: '11.5px' }}
                              >
                                Insert Link
                              </Button>
                            </div>
                          }
                        >
                          <button
                            type="button"
                            style={{
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              borderRadius: '6px',
                              padding: '0 5px',
                              height: '22px',
                              cursor: 'pointer',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <LinkOutlined style={{ fontSize: '11px' }} />
                            <span>Link</span>
                          </button>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies Thread */}
                  {replies.length > 0 && !isCollapsed && (
                    <div
                      style={{
                        marginTop: '10px',
                        marginLeft: '8px',
                        paddingLeft: '14px',
                        borderLeft: '2px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {replies.map((reply) => {
                        const replyUser = reply.user || {};
                        const replyUserId = replyUser._id || replyUser;
                        const isReplyBlogAuthor =
                          Boolean(blogAuthorId && replyUserId) &&
                          String(replyUserId) === String(blogAuthorId);
                        const replyLiked = hasLiked(reply.likes, user?._id);
                        const replyLikesCount = reply.likes?.length || 0;

                        return (
                          <div
                            key={reply._id || `${reply.date}-${reply.comment}`}
                            style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                          >
                            <AuthorHoverCard author={replyUser}>
                              <Link to={replyUserId ? `/profile/${replyUserId}` : '#'}>
                                <Avatar
                                  src={replyUser.profilePicture}
                                  size={28}
                                  style={{
                                    backgroundColor: '#6366f1',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {(replyUser.username || 'U')[0].toUpperCase()}
                                </Avatar>
                              </Link>
                            </AuthorHoverCard>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '0 14px 14px 14px',
                                  padding: '8px 12px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '6px',
                                    marginBottom: '2px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <AuthorHoverCard author={replyUser}>
                                      <Link
                                        to={replyUserId ? `/profile/${replyUserId}` : '#'}
                                        style={{
                                          fontWeight: 700,
                                          fontSize: '12px',
                                          color: '#0f172a',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        {replyUser.username || 'User'}
                                      </Link>
                                    </AuthorHoverCard>
                                    {isReplyBlogAuthor && (
                                      <span
                                        style={{
                                          fontSize: '9.5px',
                                          fontWeight: 700,
                                          background: '#eef2ff',
                                          color: '#4f46e5',
                                          padding: '0 6px',
                                          borderRadius: '999px',
                                          border: '1px solid #c7d2fe',
                                        }}
                                      >
                                        Author
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                    {reply.date ? moment(reply.date).fromNow() : 'Just now'}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    lineHeight: 1.5,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {renderFormattedCommentText(reply.comment, reply.attachment, setLightboxImg)}
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '4px',
                                  paddingLeft: '4px',
                                }}
                              >
                                {reply._id && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCommentLike(comment._id, reply._id)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      padding: 0,
                                      fontSize: '11px',
                                      fontWeight: replyLiked ? 700 : 600,
                                      color: replyLiked ? '#e11d48' : '#64748b',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    {replyLiked ? <HeartFilled /> : <HeartOutlined />}
                                    <span>
                                      Like{replyLikesCount > 0 ? ` (${replyLikesCount})` : ''}
                                    </span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReplyCommentId(comment._id);
                                    setReplyTextMap((prev) => ({
                                      ...prev,
                                      [comment._id]: `@${replyUser.username || 'user'} `,
                                    }));
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: 0,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Lightbox Zoom Modal */}
      <Modal
        open={Boolean(lightboxImg)}
        footer={null}
        onCancel={() => setLightboxImg(null)}
        centered
        width="auto"
        styles={{
          body: { padding: '16px', textAlign: 'center', background: '#0b0f19' },
          content: { background: '#0b0f19', borderRadius: '16px', overflow: 'hidden', padding: 0 },
        }}
      >
        {lightboxImg && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={lightboxImg}
              alt="Zoomed view"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <a
                href={lightboxImg}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#93c5fd',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Open Original in New Tab <LinkOutlined />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CommentsDrawer = ({
  open,
  onClose,
  blogId,
  blogTitle,
  blogAuthorId,
  comments = [],
  onCommentsUpdated,
}) => {
  const totalCount = getTotalCommentsCount(comments);
  const [drawerWidth, setDrawerWidth] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 480 ? '100%' : 440
  );

  useEffect(() => {
    const handleResize = () => {
      setDrawerWidth(window.innerWidth < 480 ? '100%' : 440);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                color: '#4f46e5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              <CommentOutlined />
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Discussion ({totalCount})
              </div>
              {blogTitle && (
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    fontWeight: 500,
                    maxWidth: '280px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {blogTitle}
                </div>
              )}
            </div>
          </div>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={drawerWidth}
      styles={{
        body: { padding: '16px 16px', background: '#ffffff', overflowX: 'hidden' },
        header: { borderBottom: '1px solid #f1f5f9', padding: '14px 16px' },
      }}
    >
      <CommentsThreadContent
        blogId={blogId}
        blogAuthorId={blogAuthorId}
        comments={comments}
        onCommentsUpdated={onCommentsUpdated}
      />
    </Drawer>
  );
};

export default CommentsDrawer;

