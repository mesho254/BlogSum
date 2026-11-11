import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Avatar, Button, Skeleton, message, Modal, Select } from 'antd';
import {
  ReadOutlined,
  UserOutlined,
  PlusCircleOutlined,
  ArrowLeftOutlined,
  CompassOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import Navbar from '../components/NavBar';
import BlogCard from '../components/BlogCard';
import useAuth from '../hooks/useAuth';

const PublicationDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addStoryModalVisible, setAddStoryModalVisible] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: publication, isLoading, isError, refetch } = useQuery({
    queryKey: ['publication', slug],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/publications/${slug}`);
      return res.data;
    },
    enabled: Boolean(slug),
  });

  const { data: userBlogs = [] } = useQuery({
    queryKey: ['userBlogsForPub'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/blogs/user/blogs');
      return res.data || [];
    },
    enabled: Boolean(addStoryModalVisible && user?.token),
  });

  const handleAddStory = async () => {
    if (!selectedBlogId || !publication?._id) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/api/publications/${publication._id}/add-story`,
        { blogId: selectedBlogId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      message.success('Story added to publication successfully!');
      setAddStoryModalVisible(false);
      setSelectedBlogId(null);
      refetch();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add story');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '120px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <Skeleton active avatar paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (isError || !publication) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '140px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <CompassOutlined style={{ fontSize: 48, color: '#94a3b8', marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Publication Not Found
          </h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            The publication &quot;{slug}&quot; could not be found or may have moved.
          </p>
          <Button type="primary" onClick={() => navigate('/')} style={{ borderRadius: '999px', fontWeight: 700 }}>
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const stories = publication.stories || [];
  const isOwner = user && String(user._id) === String(publication.owner?._id);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      <Navbar />

      <div className="ed-publication-container">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px', borderRadius: '999px', fontWeight: 600, color: '#475569' }}
        >
          Back
        </Button>

        {/* Publication Masthead Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 14px 36px -12px rgba(15, 23, 42, 0.06)',
            marginBottom: '36px',
          }}
        >
          {/* Banner */}
          <div
            className="ed-pub-banner"
            style={{
              background: publication.banner
                ? `url(${publication.banner}) center/cover no-repeat`
                : 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #312e81 100%)',
            }}
          />

          <div style={{ padding: '0 32px 32px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '-44px',
                marginBottom: '20px',
              }}
            >
              <Avatar
                size={88}
                src={publication.logo}
                style={{
                  border: '4px solid #ffffff',
                  backgroundColor: '#4f46e5',
                  fontSize: '32px',
                  fontWeight: 800,
                  boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.35)',
                }}
              >
                {publication.name[0]?.toUpperCase()}
              </Avatar>

              {user && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={() => setAddStoryModalVisible(true)}
                    style={{
                      borderRadius: '999px',
                      fontWeight: 700,
                      height: '38px',
                      padding: '0 20px',
                      background: '#0f172a',
                      borderColor: '#0f172a',
                    }}
                  >
                    Add Story
                  </Button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ maxWidth: 720 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {publication.name}
                </h1>
                {publication.description && (
                  <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
                    {publication.description}
                  </p>
                )}

                {/* Topics Pills */}
                {publication.topics && publication.topics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {publication.topics.map((topic) => (
                      <span
                        key={topic}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: '#eef2ff',
                          color: '#4f46e5',
                          border: '1px solid #c7d2fe',
                        }}
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Publication Meta Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  minWidth: '220px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, letterSpacing: '0.05em' }}>
                  Editorial Team
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={publication.owner?.profilePicture} size={36} style={{ backgroundColor: '#0f172a' }}>
                    {publication.owner?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <div>
                    <Link
                      to={`/profile/${publication.owner?._id}`}
                      style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', textDecoration: 'none', display: 'block' }}
                    >
                      {publication.owner?.username}
                    </Link>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Founder & Editor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stories in this Publication */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px' }}>
            Stories in {publication.name} ({stories.length})
          </h2>

          {stories.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <ReadOutlined style={{ fontSize: 44, color: '#94a3b8', marginBottom: 16 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                No Stories Published in This Publication Yet
              </h3>
              <p style={{ color: '#64748b', maxWidth: 440, margin: '0 auto 20px', fontSize: '0.9rem' }}>
                Authors and editors can contribute their stories to this curated publication.
              </p>
              {user && (
                <Button
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  onClick={() => setAddStoryModalVisible(true)}
                  style={{ borderRadius: '999px', fontWeight: 700, background: '#0f172a', borderColor: '#0f172a' }}
                >
                  Submit a Story
                </Button>
              )}
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {stories.map((story) => (
                <Col xs={24} sm={24} md={12} lg={8} xl={6} xxl={6} key={story._id} style={{ display: 'flex' }}>
                  <BlogCard blog={story} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>

      <style>{`
        .ed-publication-container {
          width: 94%;
          max-width: 1280px;
          margin: 0 auto;
          padding-top: 100px;
          transition: max-width 0.2s ease;
        }
        .ed-pub-banner {
          height: 180px;
          position: relative;
          transition: height 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-publication-container {
            max-width: 1560px;
            width: 94%;
          }
          .ed-pub-banner {
            height: 230px;
          }
        }
        @media (min-width: 1920px) {
          .ed-publication-container {
            max-width: 1720px;
            width: 95%;
          }
          .ed-pub-banner {
            height: 270px;
          }
        }
        @media (min-width: 2560px) {
          .ed-publication-container {
            max-width: 2160px;
            width: 95%;
          }
          .ed-pub-banner {
            height: 320px;
          }
        }
        @media (max-width: 768px) {
          .ed-publication-container {
            width: 95%;
            padding-top: 84px;
          }
          .ed-pub-banner {
            height: 130px;
          }
        }
      `}</style>

      {/* Add Story Modal */}
      <Modal
        title={`Add Story to ${publication.name}`}
        open={addStoryModalVisible}
        onCancel={() => setAddStoryModalVisible(false)}
        onOk={handleAddStory}
        confirmLoading={submitting}
        okText="Add Story"
        centered
      >
        <div style={{ paddingTop: 12 }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: 12 }}>
            Select one of your published stories to feature in this publication:
          </p>
          <Select
            placeholder="Select a story..."
            style={{ width: '100%' }}
            value={selectedBlogId}
            onChange={(val) => setSelectedBlogId(val)}
            options={userBlogs.map((b) => ({
              value: b._id,
              label: `${b.title} (${b.category || 'Story'})`,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PublicationDetail;

