import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';
import BlogCard from '../components/BlogCard';
import {
  Row,
  Col,
  Skeleton,
  Alert,
  Tabs,
  Avatar,
  Button,
  message,
  Upload,
  Modal,
  Form,
  Input,
  Tooltip,
  Empty,
  notification,
} from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  LockOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  MailOutlined,
  FileTextOutlined,
  BookOutlined,
  HeartOutlined,
  TeamOutlined,
  UserOutlined,
  CameraOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import Navbar from '../components/NavBar';
import useAuth from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AuthorHoverCard from '../components/AuthorHoverCard';

function Profile() {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('1');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const email = user?.email;

  const postedQuery = useQuery({
    queryKey: ['postedBlogs'],
    queryFn: async () => (await axiosInstance.get('/api/blogs/user/blogs')).data,
    refetchOnMount: 'always',
    refetchInterval: 30 * 1000,
  });

  const bookmarkedQuery = useQuery({
    queryKey: ['bookmarkedBlogs'],
    queryFn: async () => (await axiosInstance.get('/api/users/bookmarked-blogs')).data,
    refetchOnMount: 'always',
  });

  const likedQuery = useQuery({
    queryKey: ['likedBlogs'],
    queryFn: async () => (await axiosInstance.get('/api/users/liked-blogs')).data,
    refetchOnMount: 'always',
  });

  const profileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => (await axiosInstance.get('/api/users/profile')).data,
  });

  if (
    postedQuery.isLoading ||
    bookmarkedQuery.isLoading ||
    likedQuery.isLoading ||
    profileQuery.isLoading
  ) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '120px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (
    postedQuery.error ||
    bookmarkedQuery.error ||
    likedQuery.error ||
    profileQuery.error
  ) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '120px 20px', maxWidth: '800px', margin: '0 auto' }}>
          <Alert message="Error" description="Error fetching profile data" type="error" showIcon />
        </div>
      </div>
    );
  }

  const postedBlogs = postedQuery.data || [];
  const totalLikesReceived = postedBlogs.reduce(
    (sum, blog) => sum + (Array.isArray(blog?.likes) ? blog.likes.length : 0),
    0
  );
  const bookmarkedBlogs = bookmarkedQuery.data || [];
  const likedBlogs = likedQuery.data || [];
  const profileData = profileQuery.data || {
    email: '',
    username: '',
    location: '',
    profilePicture: '',
    followers: [],
    following: [],
    likedBlogs: [],
  };

  const handleEditProfile = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.put('/api/users/profile', values);
      profileQuery.refetch();
      setProfileModalVisible(false);
      setLoading(false);
      message.success('Profile updated successfully');
    } catch {
      message.error('Error updating profile');
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await axiosInstance.put('/api/auth/changePassword', {
        email: profileData.email || email,
        ...values,
      });
      notification.success({ message: 'Password changed successfully' });
      setPasswordModalVisible(false);
    } catch (error) {
      console.error('Error changing password:', error);
      notification.error({ message: 'Failed to change password' });
    }
  };

  const handleFileChange = ({ file }) => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('No file selected for upload.');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);
    setLoading(true);

    try {
      await axiosInstance.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      profileQuery.refetch();
      message.success('Profile picture uploaded successfully');
      setAvatarModalVisible(false);
      setPreviewImage(null);
    } catch {
      message.error('Error uploading profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await axiosInstance.delete('/api/users/profile/avatar');
      profileQuery.refetch();
      message.success('Profile picture deleted successfully');
      setAvatarModalVisible(false);
      setPreviewImage(null);
    } catch {
      message.error('Error deleting profile picture');
    }
  };

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

  const now = new Date();
  const scheduledOrDraftBlogs = postedBlogs.filter((b) => {
    const pubTime = b?.publishDate || b?.date;
    return b?.status === 'draft' || Boolean(pubTime && new Date(pubTime) > now);
  });
  const publishedBlogs = postedBlogs.filter((b) => {
    const pubTime = b?.publishDate || b?.date;
    return b?.status !== 'draft' && !(pubTime && new Date(pubTime) > now);
  });

  const handlePublishNow = async (blogItem) => {
    try {
      const nowIso = new Date().toISOString();
      await axiosInstance.put(`/api/blogs/${blogItem._id}`, {
        title: blogItem.title,
        subtitle: blogItem.subtitle || '',
        content: blogItem.content,
        category: blogItem.category,
        readTime: blogItem.readTime,
        allowComments: blogItem.allowComments,
        tags: JSON.stringify(blogItem.tags || []),
        existingImages: JSON.stringify(
          Array.isArray(blogItem.images) && blogItem.images.length > 0
            ? blogItem.images
            : blogItem.imageUrl
            ? [blogItem.imageUrl]
            : []
        ),
        date: nowIso,
        publishDate: nowIso,
        status: 'published',
      });
      message.success(`"${blogItem.title}" is now published live!`);
      postedQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    } catch {
      message.error('Failed to publish story now');
    }
  };

  const renderScheduledSection = () => {
    if (scheduledOrDraftBlogs.length === 0) {
      return renderBlogsGrid(
        [],
        'No scheduled or draft stories waiting to be published.'
      );
    }
    return (
      <div>
        <div
          style={{
            padding: '14px 18px',
            marginBottom: '20px',
            borderRadius: '14px',
            border: '1px solid #fde68a',
            background: '#fffbeb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#92400e', fontSize: '13.5px', fontWeight: 600 }}>
            <ClockCircleOutlined style={{ fontSize: '16px' }} />
            <span>
              These stories are <strong>Not Yet Published</strong> on the public Blogs feed. Scheduled stories will automatically appear on the public feed once their publish date and time arrive.
            </span>
          </div>
        </div>
        <Row gutter={[24, 24]} align="stretch">
          {scheduledOrDraftBlogs.map((blog) => (
            <Col
              xs={24}
              sm={12}
              md={12}
              lg={8}
              xl={6}
              key={blog._id}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <BlogCard blog={blog} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>
                  {blog.status === 'draft' ? 'Saved as Draft' : 'Waiting for schedule'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    size="small"
                    onClick={() => navigate(`/edit/${blog._id}`)}
                    style={{ borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}
                  >
                    Reschedule / Edit
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handlePublishNow(blog)}
                    style={{
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#111827',
                      borderColor: '#111827',
                    }}
                  >
                    Publish Now
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const tabItems = [
    {
      key: '1',
      title: 'My Posts',
      icon: <FileTextOutlined />,
      count: postedBlogs.length,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <FileTextOutlined /> My Posts ({postedBlogs.length})
        </span>
      ),
      children: (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
              All Your Stories ({postedBlogs.length})
            </h3>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => navigate('/createBlog')}
              style={{
                borderRadius: '999px',
                fontWeight: 700,
                height: '38px',
                padding: '0 20px',
                background: '#111827',
                border: 'none',
              }}
            >
              Write New Article
            </Button>
          </div>

          {scheduledOrDraftBlogs.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h4
                style={{
                  margin: '0 0 12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ClockCircleOutlined /> Not Yet Published · Scheduled & Drafts ({scheduledOrDraftBlogs.length})
              </h4>
              {renderScheduledSection()}
            </div>
          )}

          {scheduledOrDraftBlogs.length > 0 && (
            <h4
              style={{
                margin: '0 0 14px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              Published Live ({publishedBlogs.length})
            </h4>
          )}
          {renderBlogsGrid(publishedBlogs, "You haven't published any live articles yet.")}
        </div>
      ),
    },
    {
      key: 'scheduled',
      title: 'Scheduled & Drafts',
      icon: <ClockCircleOutlined style={scheduledOrDraftBlogs.length > 0 ? { color: '#d97706' } : {}} />,
      count: scheduledOrDraftBlogs.length,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <ClockCircleOutlined style={{ color: scheduledOrDraftBlogs.length > 0 ? '#d97706' : undefined }} />
          Not Yet Published ({scheduledOrDraftBlogs.length})
        </span>
      ),
      children: renderScheduledSection(),
    },
    {
      key: '2',
      title: 'Bookmarks',
      icon: <BookOutlined />,
      count: bookmarkedBlogs.length,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <BookOutlined /> Bookmarks ({bookmarkedBlogs.length})
        </span>
      ),
      children: renderBlogsGrid(bookmarkedBlogs, 'No bookmarked articles yet.'),
    },
    {
      key: '3',
      title: 'Liked',
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
      key: '4',
      title: 'Following',
      icon: <UserOutlined />,
      count: profileData.following?.length || 0,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <UserOutlined /> Following ({profileData.following?.length || 0})
        </span>
      ),
      children: renderPeopleGrid(profileData.following, 'You are not following anyone yet.'),
    },
    {
      key: '5',
      title: 'Followers',
      icon: <TeamOutlined />,
      count: profileData.followers?.length || 0,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <TeamOutlined /> Followers ({profileData.followers?.length || 0})
        </span>
      ),
      children: renderPeopleGrid(profileData.followers, 'No followers yet.'),
    },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar />
      <div className="ed-profile-container">
        {/* Modern Editorial Profile Header Card */}
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
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Author Space
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
              <div
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setAvatarModalVisible(true)}
              >
                <Avatar
                  size={98}
                  src={profileData.profilePicture}
                  style={{
                    border: '4px solid #ffffff',
                    backgroundColor: '#0f172a',
                    fontSize: '38px',
                    fontWeight: 700,
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18)',
                  }}
                >
                  {profileData.username?.[0]?.toUpperCase()}
                </Avatar>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#0f172a',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    transition: 'transform 0.15s ease',
                  }}
                  title="Change profile photo"
                >
                  <CameraOutlined />
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalVisible(true)}
                  className="ed-profile-action-btn"
                >
                  <EditOutlined /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordModalVisible(true)}
                  className="ed-profile-action-btn"
                >
                  <LockOutlined /> Security
                </button>
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
                  {profileData.username}
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
                  {profileData.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MailOutlined style={{ color: '#6366f1' }} /> {profileData.email}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <EnvironmentOutlined style={{ color: '#6366f1' }} />{' '}
                    {profileData.location || 'Location not set'}
                  </span>
                </div>
              </div>

              {/* Modern Unified Stats Ribbon */}
              <div className="ed-profile-stats-ribbon">
                {[
                  { label: 'Articles', value: postedBlogs.length, targetKey: '1' },
                  { label: 'Followers', value: profileData.followers?.length || 0, targetKey: '5' },
                  { label: 'Following', value: profileData.following?.length || 0, targetKey: '4' },
                  { label: 'Likes', value: totalLikesReceived, targetKey: '3' },
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

        {/* Modern Editorial Edit Profile Modal */}
        <Modal
          title={null}
          open={profileModalVisible}
          onCancel={() => setProfileModalVisible(false)}
          footer={null}
          width={480}
          centered
          className="ed-profile-modal"
        >
          <div className="ed-modal-header">
            <span className="ed-modal-kicker">Account Details</span>
            <h3 className="ed-modal-title">Edit Profile</h3>
            <p className="ed-modal-sub">
              Update how your name, email, and location appear across your stories and author card.
            </p>
          </div>

          <Form
            layout="vertical"
            initialValues={profileData}
            onFinish={handleEditProfile}
            requiredMark={false}
            className="ed-modal-form"
          >
            <Form.Item
              label="Display Name / Username"
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Your username"
                className="ed-modal-input"
              />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="you@example.com"
                className="ed-modal-input"
              />
            </Form.Item>

            <Form.Item label="Location" name="location">
              <Input
                prefix={<EnvironmentOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="e.g., Nairobi, Kenya"
                className="ed-modal-input"
              />
            </Form.Item>

            <div className="ed-modal-actions">
              <button
                type="button"
                onClick={() => setProfileModalVisible(false)}
                className="ed-modal-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ed-modal-btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Form>
        </Modal>

        {/* Modern Editorial Change Password Modal */}
        <Modal
          title={null}
          open={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          footer={null}
          width={480}
          centered
          className="ed-profile-modal"
        >
          <div className="ed-modal-header">
            <span className="ed-modal-kicker">Security & Access</span>
            <h3 className="ed-modal-title">Change Password</h3>
            <p className="ed-modal-sub">
              Choose a strong password of at least 6 characters to keep your creator account secure.
            </p>
          </div>

          <Form
            layout="vertical"
            onFinish={handleChangePassword}
            requiredMark={false}
            validateTrigger="onChange"
            className="ed-modal-form"
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Enter current password"
                className="ed-modal-input"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Create new password"
                className="ed-modal-input"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmNewPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Repeat new password"
                className="ed-modal-input"
              />
            </Form.Item>

            <div className="ed-modal-actions">
              <button
                type="button"
                onClick={() => setPasswordModalVisible(false)}
                className="ed-modal-btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="ed-modal-btn-primary">
                Update Password
              </button>
            </div>
          </Form>
        </Modal>

        {/* Modern Editorial Update Profile Photo Modal */}
        <Modal
          title={null}
          open={avatarModalVisible}
          onCancel={() => setAvatarModalVisible(false)}
          footer={null}
          width={440}
          centered
          className="ed-profile-modal"
        >
          <div className="ed-modal-header">
            <span className="ed-modal-kicker">Profile Identity</span>
            <h3 className="ed-modal-title">Update Profile Photo</h3>
            <p className="ed-modal-sub">
              Upload a square portrait photo. Appears on your byline and author hover card.
            </p>
          </div>

          <div className="ed-avatar-picker-stage">
            <Avatar
              size={120}
              src={previewImage || profileData.profilePicture}
              style={{
                backgroundColor: '#111827',
                fontSize: 40,
                fontWeight: 700,
                border: '3px solid #ffffff',
                boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
              }}
            >
              {profileData.username?.[0]?.toUpperCase()}
            </Avatar>
            {selectedFile && (
              <span className="ed-avatar-filename">{selectedFile.name}</span>
            )}
          </div>

          <div className="ed-modal-actions" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Upload
                beforeUpload={() => false}
                onChange={handleFileChange}
                showUploadList={false}
              >
                <button type="button" className="ed-modal-btn-secondary">
                  <UploadOutlined /> Choose Photo
                </button>
              </Upload>
              {profileData.profilePicture && (
                <Tooltip title="Remove current photo">
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="ed-modal-btn-danger"
                  >
                    <DeleteOutlined />
                  </button>
                </Tooltip>
              )}
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              className="ed-modal-btn-primary"
            >
              {loading ? 'Uploading...' : 'Save Photo'}
            </button>
          </div>
        </Modal>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

          .ed-profile-modal .ant-modal-content {
            border-radius: 20px;
            padding: 28px 28px 24px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14);
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          }
          .ed-modal-header {
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
          }
          .ed-modal-kicker {
            display: block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .ed-modal-title {
            font-family: 'Newsreader', Georgia, serif;
            font-size: 1.65rem;
            font-weight: 500;
            color: #111827;
            margin: 0 0 6px;
            letter-spacing: -0.02em;
          }
          .ed-modal-sub {
            font-size: 13px;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
          }
          .ed-modal-form .ant-form-item {
            margin-bottom: 16px;
          }
          .ed-modal-form .ant-form-item-label > label {
            font-size: 12.5px;
            font-weight: 600;
            color: #374151;
          }
          .ed-modal-input.ant-input-affix-wrapper,
          .ed-modal-input.ant-input {
            height: 44px;
            border-radius: 10px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            font-size: 14px;
            padding: 0 14px;
            transition: all 0.15s ease;
          }
          .ed-modal-input.ant-input-affix-wrapper:hover,
          .ed-modal-input.ant-input-affix-wrapper-focused,
          .ed-modal-input.ant-input:focus {
            background: #ffffff;
            border-color: #111827;
            box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
          }
          .ed-modal-input .ant-input {
            background: transparent !important;
            font-size: 14px;
          }
          .ed-avatar-picker-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 20px;
            margin-bottom: 8px;
            border-radius: 14px;
            background: #f9fafb;
            border: 1px dashed #d1d5db;
          }
          .ed-avatar-filename {
            font-size: 12.5px;
            color: #4b5563;
            font-weight: 500;
          }
          .ed-modal-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
          }
          .ed-modal-btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 40px;
            padding: 0 20px;
            border-radius: 999px;
            border: 1px solid #111827;
            background: #111827;
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .ed-modal-btn-primary:hover:not(:disabled) {
            background: #1f2937;
          }
          .ed-modal-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .ed-modal-btn-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 40px;
            padding: 0 18px;
            border-radius: 999px;
            border: 1px solid #d1d5db;
            background: #ffffff;
            color: #374151;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .ed-modal-btn-secondary:hover {
            border-color: #111827;
            color: #111827;
          }
          .ed-modal-btn-danger {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #dc2626;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .ed-modal-btn-danger:hover {
            background: #fee2e2;
          }

          /* Modern Editorial Profile Tabs & Header */
          .ed-profile-action-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 38px;
            padding: 0 18px;
            border-radius: 999px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #1e293b;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: inherit;
          }
          .ed-profile-action-btn:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #0f172a;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          }
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
}

export default Profile;
