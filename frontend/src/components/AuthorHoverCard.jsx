import React, { useState } from 'react';
import { Popover, Avatar, Button, message } from 'antd';
import {
  UserAddOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  MailOutlined,
  FileTextOutlined,
  HeartFilled,
  TeamOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';

const AuthorHoverCard = ({ author, isFollowing: propIsFollowing, onFollowChange, children }) => {
  const [open, setOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const authorId = typeof author === 'string' ? author : (author?._id || author?.username);
  const isSelf = Boolean(
    user && authorId &&
    (String(user._id) === String(authorId) || String(user.username || '').toLowerCase() === String(authorId).toLowerCase())
  );

  const { data: profileData } = useQuery({
    queryKey: ['authorPreview', authorId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/users/public-profile/${encodeURIComponent(authorId)}`);
      return response.data;
    },
    enabled: Boolean(open && authorId),
    staleTime: 2 * 60 * 1000,
  });

  const effectiveUserId = profileData?._id || authorId;

  const { data: queriedFollowing = false } = useQuery({
    queryKey: ['followState', effectiveUserId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/users/${encodeURIComponent(effectiveUserId)}/follow-state`);
      return Boolean(response.data.isFollowing);
    },
    enabled: Boolean(open && user && effectiveUserId && !isSelf && propIsFollowing === undefined),
    staleTime: 2 * 60 * 1000,
  });

  const isFollowing = propIsFollowing !== undefined ? propIsFollowing : queriedFollowing;

  const displayUsername = profileData?.username || (typeof author === 'string' ? author : author?.username) || 'Author';
  const displayAvatar = profileData?.profilePicture || (typeof author === 'object' ? author?.profilePicture : '');
  const displayEmail = profileData?.email || (typeof author === 'object' ? author?.email : '') || '';
  const displayLocation = profileData?.location || (typeof author === 'object' ? author?.location : '') || '';
  const followersCount =
    profileData?.followersCount ??
    (Array.isArray(author?.followers) ? author.followers.length : 0);
  const followingCount =
    profileData?.followingCount ??
    (Array.isArray(author?.following) ? author.following.length : 0);
  const postsCount = profileData?.postsCount ?? 1;
  const totalLikes = profileData?.totalLikesReceived ?? 0;
  const recentBlogs = profileData?.recentBlogs || [];

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setOpen(false);
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    try {
      const targetFollowId = profileData?._id || authorId;
      const endpoint = isFollowing
        ? `/api/users/${encodeURIComponent(targetFollowId)}/unfollow`
        : `/api/users/${encodeURIComponent(targetFollowId)}/follow`;
      await axiosInstance.put(endpoint);
      const nextState = !isFollowing;
      queryClient.setQueryData(['followState', effectiveUserId], nextState);
      queryClient.invalidateQueries({ queryKey: ['authorPreview', authorId] });
      if (onFollowChange) onFollowChange(nextState);
      message.success(
        nextState
          ? `You are now following ${displayUsername}`
          : `Unfollowed ${displayUsername}`
      );
    } catch (err) {
      console.error('Error toggling follow from hover card:', err);
      message.error('Could not update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (!authorId) {
    return children;
  }

  const cardContent = (
    <div
      style={{
        width: '310px',
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* LinkedIn-Style Cover Banner */}
      <div
        style={{
          height: '68px',
          background:
            'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 80%, #0ea5e9 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.22) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Avatar & Follow Button Row */}
      <div
        style={{
          padding: '0 18px 16px',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '-34px',
            marginBottom: '10px',
          }}
        >
          <Link
            to={`/profile/${authorId}`}
            onClick={() => setOpen(false)}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <Avatar
              src={displayAvatar}
              size={68}
              style={{
                border: '3px solid #ffffff',
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.16)',
                backgroundColor: '#4f46e5',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              {displayUsername?.[0]?.toUpperCase()}
            </Avatar>
            <span
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #ffffff',
              }}
              title="Active Creator"
            />
          </Link>

          {!isSelf ? (
            <Button
              size="small"
              type={isFollowing ? 'default' : 'primary'}
              loading={followLoading}
              icon={isFollowing ? <CheckOutlined /> : <UserAddOutlined />}
              onClick={handleToggleFollow}
              style={{
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '12.5px',
                height: '32px',
                padding: '0 14px',
                ...(isFollowing
                  ? {
                      color: '#334155',
                      borderColor: '#cbd5e1',
                      background: '#f8fafc',
                    }
                  : {
                      background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.28)',
                    }),
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          ) : (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#eef2ff',
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid #c7d2fe',
              }}
            >
              You (Author)
            </span>
          )}
        </div>

        {/* Author Name & Meta */}
        <div>
          <Link
            to={`/profile/${authorId}`}
            onClick={() => setOpen(false)}
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {displayUsername}
          </Link>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Content Creator at BlogSum
          </div>

          {(displayLocation || displayEmail) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '8px',
                fontSize: '11.5px',
                color: '#64748b',
              }}
            >
              {displayLocation && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <EnvironmentOutlined style={{ color: '#4f46e5' }} />
                  {displayLocation}
                </span>
              )}
              {displayEmail && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    maxWidth: '180px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MailOutlined style={{ color: '#4f46e5' }} />
                  {displayEmail}
                </span>
              )}
            </div>
          )}
        </div>

        {/* LinkedIn-Style Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '14px',
            padding: '10px 12px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              {postsCount}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748b',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <FileTextOutlined style={{ fontSize: '10px' }} /> Articles
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              {followersCount}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748b',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <TeamOutlined style={{ fontSize: '10px' }} /> Followers
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              {totalLikes || followingCount}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#64748b',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <HeartFilled style={{ fontSize: '10px', color: '#e11d48' }} />{' '}
              {totalLikes ? 'Likes' : 'Following'}
            </div>
          </div>
        </div>

        {/* Creator Achievement Badges */}
        {profileData?.badges && profileData.badges.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                marginBottom: '6px',
              }}
            >
              Achievements & Badges
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {profileData.badges.map((b) => (
                <span
                  key={b.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: b.color,
                    background: b.bg,
                    border: `1px solid ${b.color}22`,
                  }}
                  title={b.description}
                >
                  <span>✦</span>
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Articles Preview */}
        {recentBlogs.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                marginBottom: '6px',
              }}
            >
              Recent Articles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {recentBlogs.map((item) => (
                <Link
                  key={item._id}
                  to={`/blog/${item._id}`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </span>
                  <RightOutlined style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* View Full Profile Action */}
        <Button
          block
          size="small"
          onClick={() => {
            setOpen(false);
            navigate(`/profile/${authorId}`);
          }}
          style={{
            marginTop: '12px',
            borderRadius: '10px',
            height: '34px',
            fontWeight: 600,
            fontSize: '12.5px',
            color: '#4f46e5',
            borderColor: '#e0e7ff',
            background: '#f5f7ff',
          }}
        >
          View Full Profile
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={cardContent}
      trigger="hover"
      placement="bottomLeft"
      open={open}
      onOpenChange={setOpen}
      mouseEnterDelay={0.18}
      mouseLeaveDelay={0.22}
      overlayInnerStyle={{
        padding: 0,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow:
          '0 20px 40px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.9)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', minWidth: 0, maxWidth: '100%' }}>
        {children}
      </span>
    </Popover>
  );
};

export default AuthorHoverCard;

