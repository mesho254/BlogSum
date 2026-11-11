import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Avatar, Tabs, Row, Col, message, Button, Skeleton, Empty } from 'antd';
import {
  EnvironmentOutlined,
  StopOutlined,
  MailOutlined,
  UserAddOutlined,
  CheckOutlined,
  FileTextOutlined,
  HeartOutlined,
  TeamOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  FolderOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import BlogCard from './BlogCard';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AuthorHoverCard from './AuthorHoverCard';

const OtherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTabKey, setActiveTabKey] = useState('1');

  const profileQuery = useQuery({
    queryKey: ['otherProfile', id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/users/${id}`);
      const profileData = response.data;

      if (profileData._id === user?._id) {
        navigate('/profile', { replace: true });
      }

      return profileData;
    },
    enabled: !!user?._id,
  });

  const blogsQuery = useQuery({
    queryKey: ['otherBlogs', id],
    queryFn: () => axiosInstance.get(`/api/blogs/otherBlogs/${id}`).then((res) => res.data),
    refetchOnMount: 'always',
  });

  const likedBlogsQuery = useQuery({
    queryKey: ['otherLikedBlogs', id],
    queryFn: () => axiosInstance.get(`/api/users/otherLiked/${id}`).then((res) => res.data),
    refetchOnMount: 'always',
  });

  const seriesQuery = useQuery({
    queryKey: ['otherSeries', id],
    queryFn: async () => (await axiosInstance.get(`/api/series?author=${id}`)).data,
    enabled: Boolean(id),
  });

  const authorSeries = seriesQuery.data || [];

  const followStateQuery = useQuery({
    queryKey: ['followState', id],
    queryFn: () =>
      axiosInstance
        .get(`/api/users/${id}/follow-state`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then((res) => Boolean(res.data.isFollowing)),
    enabled: !!user?.token && !!id && String(user._id) !== String(id),
  });

  const blockStatusQuery = useQuery({
    queryKey: ['blockStatus', id],
    queryFn: () =>
      axiosInstance
        .get(`/api/users/${id}/blockStatus`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then((res) => res.data.isBlocked),
    enabled: !!user?.token,
  });

  const followMutation = useMutation({
    mutationFn: async (currentlyFollowing) => {
      const endpoint = currentlyFollowing
        ? `/api/users/${id}/unfollow`
        : `/api/users/${id}/follow`;
      return axiosInstance.put(endpoint, null, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
    },
    onSuccess: (_, currentlyFollowing) => {
      const next = !currentlyFollowing;
      queryClient.setQueryData(['followState', id], next);
      queryClient.invalidateQueries({ queryKey: ['otherProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['authorPreview', id] });
      message.success(next ? 'Now following user' : 'Unfollowed user');
    },
    onError: () => message.error('Could not update follow status'),
  });

  const blockMutation = useMutation({
    mutationFn: () =>
      axiosInstance.put(`/api/users/${id}/block`, null, {
        headers: { Authorization: `Bearer ${user?.token}` },
      }),
    onSuccess: () => {
      queryClient.setQueryData(['blockStatus', id], true);
      message.success('User blocked successfully');
    },
    onError: () => message.error('Failed to block user'),
  });

  const unblockMutation = useMutation({
    mutationFn: () =>
      axiosInstance.put(`/api/users/${id}/unblock`, null, {
        headers: { Authorization: `Bearer ${user?.token}` },
      }),
    onSuccess: () => {
      queryClient.setQueryData(['blockStatus', id], false);
      message.success('User unblocked successfully');
    },
    onError: () => message.error('Failed to unblock user'),
  });

  const isLoading =
    profileQuery.isLoading ||
    blogsQuery.isLoading ||
    likedBlogsQuery.isLoading ||
    blockStatusQuery.isLoading;

  if (isLoading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '120px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '140px 20px', textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>Error loading profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const now = new Date();
  const userBlogs = (blogsQuery.data || []).filter((b) => {
    if (!b || b.status === 'draft') return false;
    const pubTime = b.publishDate || b.date;
    if (pubTime && new Date(pubTime) > now) return false;
    return true;
  });
  const totalLikesReceived = userBlogs.reduce(
    (sum, blog) => sum + (Array.isArray(blog?.likes) ? blog.likes.length : 0),
    0
  );
  const likedBlogs = likedBlogsQuery.data || [];
  const blocked = blockStatusQuery.data || false;
  const isFollowing = followStateQuery.data || false;

  const renderBlogsGrid = (blogsList, emptyText) => {
    if (!blogsList || blogsList.length === 0) {
      return (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px dashed #cbd5e1',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Empty description={<span style={{ color: '#64748b' }}>{emptyText}</span>} />
        </div>
      );
    }
    return (
      <Row gutter={[24, 24]} align="stretch">
        {blogsList.map((blog) => (
          <Col
            xs={24}
            sm={12}
            md={12}
            lg={8}
            xl={6}
            key={blog._id}
            style={{ display: 'flex' }}
          >
            <BlogCard blog={blog} />
          </Col>
        ))}
      </Row>
    );
  };

  const renderPeopleGrid = (peopleList, emptyText) => {
    if (!peopleList || peopleList.length === 0) {
      return (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px dashed #cbd5e1',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Empty description={<span style={{ color: '#64748b' }}>{emptyText}</span>} />
        </div>
      );
    }
    return (
      <Row gutter={[16, 16]}>
        {peopleList.map((person) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={person._id}>
            <AuthorHoverCard author={person}>
              <Link
                to={`/profile/${person._id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  width: '100%',
                }}
              >
                <Avatar
                  size={46}
                  src={person.profilePicture}
                  style={{ backgroundColor: '#4f46e5', fontWeight: 700 }}
                >
                  {person.username?.[0]?.toUpperCase()}
                </Avatar>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14.5px' }}>
                    {person.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>View creator profile</div>
                </div>
              </Link>
            </AuthorHoverCard>
          </Col>
        ))}
      </Row>
    );
  };

  const tabItems = [
    {
      key: '1',
      title: 'Articles',
      icon: <FileTextOutlined />,
      count: userBlogs.length,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <FileTextOutlined /> Articles ({userBlogs.length})
        </span>
      ),
      children: renderBlogsGrid(userBlogs, 'No published articles yet.'),
    },
    {
      key: 'series',
      title: 'Collections',
      icon: <FolderOutlined />,
      count: authorSeries.length,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <FolderOutlined /> Collections ({authorSeries.length})
        </span>
      ),
      children: (
        <div>
          {authorSeries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <FolderOutlined style={{ fontSize: 44, color: '#94a3b8', marginBottom: 16 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                No Collections or Series Yet
              </h4>
              <p style={{ color: '#64748b', maxWidth: 440, margin: '0 auto', fontSize: '0.9rem' }}>
                This author hasn't published any chaptered series yet.
              </p>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {authorSeries.map((s) => (
                <Col xs={24} sm={12} md={12} lg={8} xl={6} key={s._id}>
                  <div className="ed-series-profile-card">
                    <div className="ed-series-profile-cover-wrap">
                      {s.coverImage ? (
                        <img src={s.coverImage} alt={s.title} className="ed-series-profile-cover" />
                      ) : (
                        <div className="ed-series-profile-cover-fallback">
                          <FolderOutlined style={{ fontSize: 36, color: '#ffffff' }} />
                        </div>
                      )}
                      <span className="ed-series-profile-badge">
                        {s.storiesCount} {s.storiesCount === 1 ? 'Part' : 'Parts'}
                      </span>
                    </div>

                    <div className="ed-series-profile-content">
                      <h4 className="ed-series-profile-title">{s.title}</h4>
                      {s.description && (
                        <p className="ed-series-profile-desc">{s.description}</p>
                      )}
                      <div className="ed-series-profile-meta">
                        <span>{s.totalReadTime}</span>
                      </div>

                      <div className="ed-series-profile-actions">
                        <Button
                          size="small"
                          icon={<ReadOutlined />}
                          onClick={() => navigate(`/series/${s.slug || s._id}`)}
                          style={{ borderRadius: '8px', fontWeight: 600, flex: 1 }}
                        >
                          View Collection
                        </Button>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
    {
      key: '2',
      title: 'Liked Stories',
      icon: <HeartOutlined />,
      count: likedBlogs.length,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <HeartOutlined /> Liked ({likedBlogs.length})
        </span>
      ),
      children: renderBlogsGrid(likedBlogs, 'No liked articles yet.'),
    },
    {
      key: '3',
      title: 'Following',
      icon: <UserOutlined />,
      count: profile.following?.length || 0,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <UserOutlined /> Following ({profile.following?.length || 0})
        </span>
      ),
      children: renderPeopleGrid(profile.following, 'Not following anyone yet.'),
    },
    {
      key: '4',
      title: 'Followers',
      icon: <TeamOutlined />,
      count: profile.followers?.length || 0,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <TeamOutlined /> Followers ({profile.followers?.length || 0})
        </span>
      ),
      children: renderPeopleGrid(profile.followers, 'No followers yet.'),
    },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar />
      <div className="ed-profile-container">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: '14px', borderRadius: '999px', fontWeight: 600, color: '#475569' }}
        >
          Back
        </Button>

        {/* Modern Editorial Creator Profile Header */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 14px 36px -12px rgba(15, 23, 42, 0.06)',
            marginBottom: '28px',
          }}
        >
          {/* Modern Editorial Cover Banner */}
          <div
            className="ed-profile-banner"
            style={{
              height: '145px',
              position: 'relative',
              background: '#090d16',
              overflow: 'hidden',
            }}
          >
            {/* Ambient editorial light mesh */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  radial-gradient(circle at 18% 28%, rgba(99, 102, 241, 0.32) 0%, transparent 48%),
                  radial-gradient(circle at 82% 72%, rgba(14, 165, 233, 0.24) 0%, transparent 52%),
                  radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.18) 0%, transparent 60%)
                `,
              }}
            />
            {/* Subtle editorial dot texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.12,
                backgroundImage:
                  'radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            {/* Publication space pill */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 14px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: 'rgba(255, 255, 255, 0.88)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
              Creator Profile
            </div>
          </div>

          <div style={{ padding: '0 28px 26px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '-48px',
                marginBottom: '18px',
              }}
            >
              <Avatar
                size={98}
                src={profile.profilePicture}
                style={{
                  border: '4px solid #ffffff',
                  backgroundColor: '#0f172a',
                  fontSize: '38px',
                  fontWeight: 700,
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18)',
                }}
              >
                {profile.username?.[0]?.toUpperCase()}
              </Avatar>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  type={isFollowing ? 'default' : 'primary'}
                  icon={isFollowing ? <CheckOutlined /> : <UserAddOutlined />}
                  loading={followMutation.isPending}
                  onClick={() => followMutation.mutate(isFollowing)}
                  style={{
                    borderRadius: '999px',
                    fontWeight: 700,
                    height: '38px',
                    padding: '0 20px',
                    ...(isFollowing
                      ? {}
                      : {
                          background: '#0f172a',
                          border: 'none',
                          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                        }),
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>

                {blocked ? (
                  <Button
                    onClick={() => unblockMutation.mutate()}
                    loading={unblockMutation.isPending}
                    style={{ borderRadius: '999px', fontWeight: 600, height: '38px' }}
                  >
                    Unblock User
                  </Button>
                ) : (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => blockMutation.mutate()}
                    loading={blockMutation.isPending}
                    style={{ borderRadius: '999px', fontWeight: 600, height: '38px' }}
                  >
                    Block
                  </Button>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 6px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {profile.username}
                </h1>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    color: '#64748b',
                    fontSize: '13.5px',
                  }}
                >
                  {profile.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MailOutlined style={{ color: '#6366f1' }} /> {profile.email}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <EnvironmentOutlined style={{ color: '#6366f1' }} />{' '}
                    {profile.location || 'Location not set'}
                  </span>
                </div>
              </div>

              {/* Modern Unified Stats Ribbon */}
              <div className="ed-profile-stats-ribbon">
                {[
                  { label: 'Articles', value: userBlogs.length, targetKey: '1' },
                  { label: 'Series', value: authorSeries.length, targetKey: 'series' },
                  { label: 'Followers', value: profile.followers?.length || 0, targetKey: '4' },
                  { label: 'Following', value: profile.following?.length || 0, targetKey: '3' },
                  { label: 'Likes', value: totalLikesReceived, targetKey: '2' },
                ].map((stat, idx, arr) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => setActiveTabKey(stat.targetKey)}
                    className={`ed-stat-item-btn ${activeTabKey === stat.targetKey ? 'active' : ''}`}
                    title={`View ${stat.label}`}
                  >
                    <span className="ed-stat-value">{stat.value}</span>
                    <span className="ed-stat-label">{stat.label}</span>
                    {idx < arr.length - 1 && <span className="ed-stat-divider" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bespoke Modern Editorial Segmented Tab Bar */}
        <div className="ed-profile-tabs-wrapper">
          <div className="ed-profile-tabs-nav" role="tablist">
            {tabItems.map((tab) => {
              const isActive = activeTabKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTabKey(tab.key)}
                  className={`ed-profile-tab-pill ${isActive ? 'active' : ''}`}
                >
                  <span className="ed-profile-tab-icon">{tab.icon}</span>
                  <span className="ed-profile-tab-text">{tab.title}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`ed-profile-tab-count ${isActive ? 'active' : ''}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Panel */}
        <div className="ed-profile-tab-panel">
          {tabItems.find((t) => t.key === activeTabKey)?.children}
        </div>

        <style>{`
          .ed-profile-stats-ribbon {
            display: inline-flex;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          }
          .ed-stat-item-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 84px;
            padding: 8px 16px;
            border-radius: 12px;
            background: transparent;
            border: none;
            cursor: pointer;
            position: relative;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: inherit;
          }
          .ed-stat-item-btn:hover {
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
          }
          .ed-stat-item-btn.active {
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
          }
          .ed-stat-value {
            font-size: 19px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
          }
          .ed-stat-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-top: 2px;
          }
          .ed-stat-item-btn.active .ed-stat-label {
            color: #0f172a;
          }
          .ed-stat-divider {
            position: absolute;
            right: 0;
            top: 22%;
            height: 56%;
            width: 1px;
            background: #e2e8f0;
            pointer-events: none;
          }
          .ed-profile-tabs-wrapper {
            margin-bottom: 28px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 4px 0;
          }
          .ed-profile-tabs-wrapper::-webkit-scrollbar {
            display: none;
          }
          .ed-profile-tabs-nav {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            padding: 6px;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
            max-width: 100%;
          }
          .ed-profile-tab-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 11px;
            border: 1px solid transparent;
            background: transparent;
            color: #64748b;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: inherit;
          }
          .ed-profile-tab-pill:hover:not(.active) {
            color: #0f172a;
            background: #f8fafc;
          }
          .ed-profile-tab-pill.active {
            background: #0f172a;
            color: #ffffff;
            border-color: #0f172a;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.16);
          }
          .ed-profile-tab-icon {
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            transition: transform 0.2s;
          }
          .ed-profile-tab-pill:hover .ed-profile-tab-icon {
            transform: translateY(-1px);
          }
          .ed-profile-tab-text {
            line-height: 1;
          }
          .ed-profile-tab-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            background: #f1f5f9;
            color: #475569;
            transition: all 0.2s;
          }
          .ed-profile-tab-pill:hover .ed-profile-tab-count:not(.active) {
            background: #e2e8f0;
            color: #0f172a;
          }
          .ed-profile-tab-count.active {
            background: rgba(255, 255, 255, 0.22);
            color: #ffffff;
          }
          .ed-profile-tab-panel {
            animation: edProfileFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes edProfileFadeIn {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Series Profile Cards */
          .ed-series-profile-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            height: 100%;
          }
          .ed-series-profile-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.08);
            transform: translateY(-2px);
          }
          .ed-series-profile-cover-wrap {
            position: relative;
            height: 150px;
            width: 100%;
            background: #0f172a;
            overflow: hidden;
          }
          .ed-series-profile-cover {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .ed-series-profile-cover-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          }
          .ed-series-profile-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 9999px;
            letter-spacing: 0.04em;
          }
          .ed-series-profile-content {
            padding: 18px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          .ed-series-profile-title {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 6px 0;
            line-height: 1.35;
          }
          .ed-series-profile-desc {
            font-size: 0.85rem;
            color: #64748b;
            margin: 0 0 12px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.45;
          }
          .ed-series-profile-meta {
            font-size: 0.78rem;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 14px;
          }
          .ed-series-profile-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: auto;
          }

          /* Responsive Wide Container for 23" / 27" Monitors */
          .ed-profile-container {
            width: 94%;
            max-width: 1280px;
            margin: 0 auto;
            padding-top: 100px;
            transition: max-width 0.2s ease;
          }
          @media (min-width: 1536px) {
            .ed-profile-container {
              max-width: 1560px;
              width: 94%;
            }
          }
          @media (min-width: 1920px) {
            .ed-profile-container {
              max-width: 1720px;
              width: 95%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OtherProfile;
