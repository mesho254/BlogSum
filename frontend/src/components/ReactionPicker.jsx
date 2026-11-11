import React, { useState, useRef } from 'react';
import { Tooltip } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

export const LINKEDIN_REACTIONS = [
  {
    key: 'like',
    label: 'Like',
    emoji: '👍',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)',
    border: 'rgba(37, 99, 235, 0.28)',
    badgeBg: '#dbeafe',
  },
  {
    key: 'love',
    label: 'Love',
    emoji: '❤️',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.1)',
    border: 'rgba(225, 29, 72, 0.28)',
    badgeBg: '#ffe4e6',
  },
  {
    key: 'celebrate',
    label: 'Celebrate',
    emoji: '👏',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)',
    border: 'rgba(5, 150, 105, 0.28)',
    badgeBg: '#d1fae5',
  },
  {
    key: 'support',
    label: 'Support',
    emoji: '💜',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.28)',
    badgeBg: '#ede9fe',
  },
  {
    key: 'insightful',
    label: 'Insightful',
    emoji: '💡',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.1)',
    border: 'rgba(217, 119, 6, 0.28)',
    badgeBg: '#fef3c7',
  },
  {
    key: 'funny',
    label: 'Funny',
    emoji: '😄',
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.1)',
    border: 'rgba(8, 145, 178, 0.28)',
    badgeBg: '#cffafe',
  },
];

export const REACTION_MAP = LINKEDIN_REACTIONS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

export const hasUserId = (list = [], userId) =>
  Boolean(
    userId &&
      Array.isArray(list) &&
      list.some((item) => String(item?._id || item?.user?._id || item?.user || item) === String(userId))
  );

export const getUserReactionFromBlog = (blog, userId, fallbackReaction = null) => {
  if (!blog) return null;
  if (typeof blog.userLiked === 'boolean') {
    if (!blog.userLiked) return null;
    return blog.userReaction || fallbackReaction || 'love';
  }
  if (userId && Array.isArray(blog.reactions)) {
    const found = blog.reactions.find(
      (r) => String(r?.user?._id || r?.user) === String(userId)
    );
    if (found?.type && REACTION_MAP[found.type]) {
      return found.type;
    }
  }
  if (userId && hasUserId(blog.likes, userId)) {
    return fallbackReaction && REACTION_MAP[fallbackReaction] ? fallbackReaction : 'love';
  }
  return null;
};

export const getTopReactions = (blog, activeReaction = null) => {
  const counts = {};
  if (Array.isArray(blog?.reactions)) {
    blog.reactions.forEach((r) => {
      const t = r?.type && REACTION_MAP[r.type] ? r.type : 'love';
      counts[t] = (counts[t] || 0) + 1;
    });
  }
  if (activeReaction && REACTION_MAP[activeReaction] && !counts[activeReaction]) {
    counts[activeReaction] = 1;
  }
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (sorted.length === 0 && (blog?.likes?.length > 0 || activeReaction)) {
    return [REACTION_MAP[activeReaction || 'love']];
  }
  return sorted.slice(0, 3).map((k) => REACTION_MAP[k]);
};

const ReactionPicker = ({
  liked = false,
  reactionType = null,
  likesCount = 0,
  onSelectReaction,
  onToggleDefault,
  size = 'default',
  className = '',
  buttonStyle = {},
  showLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const timerRef = useRef(null);

  const activeConfig = liked
    ? REACTION_MAP[reactionType] || REACTION_MAP.love
    : null;

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(false);
      setHoveredReaction(null);
    }, 240);
  };

  const handlePick = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
    setHoveredReaction(null);
    onSelectReaction(type);
  };

  const handleMainButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
    onToggleDefault(e);
  };

  const isCompact = size === 'small';
  const shouldShowLabel = typeof showLabel === 'boolean' ? showLabel : !isCompact;

  return (
    <div
      className={`blog-reaction-picker-wrap ${className}`}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* LinkedIn-Style Floating Reaction Dock */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: 0,
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(14px)',
            borderRadius: '999px',
            boxShadow:
              '0 14px 34px -6px rgba(15, 23, 42, 0.22), 0 4px 12px -2px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.9)',
            animation: 'blogReactionDockIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {LINKEDIN_REACTIONS.map((item) => {
            const isHovered = hoveredReaction === item.key;
            const isCurrent = liked && (reactionType || 'love') === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={(e) => handlePick(e, item.key)}
                onMouseEnter={() => setHoveredReaction(item.key)}
                onMouseLeave={() => setHoveredReaction(null)}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: isCurrent ? `2px solid ${item.color}` : 'none',
                  background: isCurrent ? item.bg : isHovered ? '#f8fafc' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '21px',
                  cursor: 'pointer',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease',
                  transform: isHovered ? 'scale(1.34) translateY(-6px)' : 'scale(1)',
                  padding: 0,
                  outline: 'none',
                }}
                aria-label={item.label}
              >
                {isHovered && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#0f172a',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      letterSpacing: '0.02em',
                      pointerEvents: 'none',
                      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)',
                    }}
                  >
                    {item.label}
                  </span>
                )}
                <span style={{ lineHeight: 1 }}>{item.emoji}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Button with Tooltip */}
      <Tooltip
        title={open ? '' : liked ? `${activeConfig?.label || 'Liked'} (${likesCount})` : 'Like / React'}
        placement="top"
      >
        <button
          type="button"
          onClick={handleMainButtonClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: isCompact
              ? shouldShowLabel
                ? '6px 12px'
                : '6px 8px'
              : '7px 14px',
            borderRadius: '999px',
            border: activeConfig ? `1px solid ${activeConfig.border}` : '1px solid transparent',
            background: activeConfig ? activeConfig.bg : 'transparent',
            color: activeConfig ? activeConfig.color : '#64748b',
            fontWeight: activeConfig ? 700 : 600,
            fontSize: isCompact ? '12.5px' : '13.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            whiteSpace: 'nowrap',
            ...buttonStyle,
          }}
          className="blog-reaction-trigger-btn"
          aria-label={activeConfig ? activeConfig.label : 'Like'}
        >
          {activeConfig ? (
            activeConfig.key === 'love' ? (
              <HeartFilled
                style={{
                  color: '#e11d48',
                  fontSize: isCompact ? '15px' : '16px',
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: isCompact ? '15px' : '16px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {activeConfig.emoji}
              </span>
            )
          ) : (
            <HeartOutlined
              style={{
                fontSize: isCompact ? '15px' : '16px',
                color: '#64748b',
                flexShrink: 0,
              }}
            />
          )}
          {shouldShowLabel && (
            <span className="blog-reaction-label">{activeConfig ? activeConfig.label : 'Like'}</span>
          )}
          {likesCount > 0 && (
            <span
              className="blog-reaction-count"
              style={{
                marginLeft: shouldShowLabel ? '2px' : '3px',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                background: activeConfig ? 'rgba(255,255,255,0.85)' : '#f1f5f9',
                color: activeConfig ? activeConfig.color : '#475569',
                flexShrink: 0,
              }}
            >
              {likesCount}
            </span>
          )}
        </button>
      </Tooltip>

      <style>{`
        @keyframes blogReactionDockIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .blog-reaction-trigger-btn:hover {
          background: rgba(15, 23, 42, 0.05);
        }
      `}</style>
    </div>
  );
};

export default ReactionPicker;

