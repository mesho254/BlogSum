import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Spin, Avatar, Tag, Button, Empty, Breadcrumb } from 'antd';
import {
  ReadOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  ShareAltOutlined,
  BookOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import NavBar from '../components/NavBar';

const SeriesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosInstance.get(`/api/series/${id}`);
        setSeries(data);
      } catch (err) {
        console.error('Error fetching series details:', err);
        setError('This story collection or series could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: series?.title || 'BlogSum Series',
          text: series?.description || 'Read this collection on BlogSum',
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Series link copied to clipboard!');
    }
  };

  return (
    <div className="series-details-page">
      <NavBar />

      <main className="series-main-container">
        {loading ? (
          <div className="series-loading-shell">
            <Spin size="large" />
            <p>Curating collection...</p>
          </div>
        ) : error || !series ? (
          <div className="series-error-shell">
            <Empty description={error || 'Series not found'}>
              <Button type="primary" onClick={() => navigate('/')}>
                Back to Explore
              </Button>
            </Empty>
          </div>
        ) : (
          <article className="series-content-layout">
            {/* Breadcrumb Navigation */}
            <div className="series-breadcrumb">
              <Breadcrumb
                items={[
                  { title: <Link to="/">Home</Link> },
                  { title: <Link to="/profile">Series</Link> },
                  { title: series.title },
                ]}
              />
            </div>

            {/* Series Hero Header */}
            <header className="series-hero-card">
              <div className="series-hero-inner">
                <div className="series-hero-meta-badges">
                  <span className="series-pill-badge">
                    <BookOutlined style={{ marginRight: 6 }} />
                    Editorial Series
                  </span>
                  <span className="series-count-badge">
                    {series.storiesCount} {series.storiesCount === 1 ? 'Part' : 'Parts'}
                  </span>
                  <span className="series-time-badge">
                    <ClockCircleOutlined style={{ marginRight: 5 }} />
                    {series.totalReadTime}
                  </span>
                </div>

                <h1 className="series-title">{series.title}</h1>

                {series.description && (
                  <p className="series-description">{series.description}</p>
                )}

                {/* Author Info Bar */}
                <div className="series-author-bar">
                  <div
                    className="series-author-pill"
                    onClick={() => navigate(`/profile/${series.author?._id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar
                      size={44}
                      src={series.author?.profilePicture}
                      icon={<UserOutlined />}
                      style={{ border: '2px solid #fff' }}
                    />
                    <div className="series-author-text">
                      <span className="series-author-name">
                        {series.author?.username || 'Editorial Author'}
                      </span>
                      <span className="series-author-sub">Curator & Author</span>
                    </div>
                  </div>

                  <div className="series-hero-actions">
                    <Button
                      icon={<ShareAltOutlined />}
                      onClick={handleShare}
                      className="series-action-btn"
                    >
                      Share Series
                    </Button>

                    {series.stories && series.stories.length > 0 && (
                      <Button
                        type="primary"
                        icon={<ReadOutlined />}
                        onClick={() => navigate(`/blog/${series.stories[0]._id}`)}
                        className="series-start-btn"
                      >
                        Start Reading Chapter 1
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {series.coverImage && (
                <div className="series-hero-cover-wrap">
                  <img
                    src={series.coverImage}
                    alt={series.title}
                    className="series-hero-cover-img"
                  />
                </div>
              )}
            </header>

            {/* Table of Contents & Chapter List */}
            <section className="series-chapters-section">
              <div className="series-section-header">
                <div>
                  <h2 className="series-section-title">Table of Contents</h2>
                  <p className="series-section-subtitle">
                    Follow the narrative sequentially or jump directly to any chapter below.
                  </p>
                </div>
              </div>

              <div className="series-chapters-list">
                {(series.stories || []).map((story, index) => {
                  const partNumber = String(index + 1).padStart(2, '0');
                  const storyCover = story.imageUrl || (story.images && story.images[0]) || '';

                  return (
                    <div
                      key={story._id}
                      className="series-chapter-item"
                      onClick={() => navigate(`/blog/${story._id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="series-chapter-number-box">
                        <span className="series-chapter-part-label">PART</span>
                        <span className="series-chapter-num">{partNumber}</span>
                      </div>

                      <div className="series-chapter-info">
                        <div className="series-chapter-tags">
                          {story.category && (
                            <Tag color="blue" className="series-story-tag">
                              {story.category}
                            </Tag>
                          )}
                          <span className="series-chapter-read-time">
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {story.readTime || '5 min read'}
                          </span>
                          <span className="series-chapter-date">
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {new Date(story.publishDate || story.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <h3 className="series-chapter-title">{story.title}</h3>

                        {story.subtitle && (
                          <p className="series-chapter-subtitle">{story.subtitle}</p>
                        )}
                      </div>

                      {storyCover ? (
                        <div className="series-chapter-thumb-wrap">
                          <img
                            src={storyCover}
                            alt={story.title}
                            className="series-chapter-thumb"
                          />
                        </div>
                      ) : null}

                      <div className="series-chapter-arrow">
                        <ArrowRightOutlined />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </article>
        )}
      </main>

      <style>{`
        .series-details-page {
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          color: #0f172a;
          padding-bottom: 80px;
        }

        .series-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        @media (min-width: 1536px) {
          .series-main-container {
            max-width: 1560px;
            padding: 40px 32px;
          }
        }

        @media (min-width: 1920px) {
          .series-main-container {
            max-width: 1720px;
            padding: 48px 40px;
          }
        }

        .series-loading-shell,
        .series-error-shell {
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .series-breadcrumb {
          margin-bottom: 24px;
        }

        .series-hero-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          display: flex;
          gap: 40px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .series-hero-inner {
          flex: 1;
        }

        .series-hero-meta-badges {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .series-pill-badge {
          display: inline-flex;
          align-items: center;
          background: #eef2ff;
          color: #4338ca;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 4px 12px;
          border-radius: 9999px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .series-count-badge,
        .series-time-badge {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }

        .series-title {
          font-family: 'Newsreader', serif;
          font-size: 2.6rem;
          font-weight: 700;
          line-height: 1.18;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
        }

        .series-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #475569;
          margin: 0 0 28px 0;
          max-width: 720px;
        }

        .series-author-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        .series-author-pill {
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .series-author-pill:hover {
          opacity: 0.85;
        }

        .series-author-name {
          display: block;
          font-weight: 700;
          color: #0f172a;
          font-size: 0.95rem;
        }

        .series-author-sub {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
        }

        .series-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .series-start-btn {
          height: 44px;
          padding: 0 24px;
          border-radius: 12px;
          background: #0f172a !important;
          border-color: #0f172a !important;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
        }

        .series-action-btn {
          height: 44px;
          border-radius: 12px;
          font-weight: 600;
        }

        .series-hero-cover-wrap {
          width: 320px;
          height: 220px;
          flex-shrink: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .series-hero-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 900px) {
          .series-hero-card {
            flex-direction: column;
            padding: 28px 20px;
          }
          .series-hero-cover-wrap {
            width: 100%;
            height: 200px;
          }
          .series-title {
            font-size: 2rem;
          }
        }

        /* Chapter List */
        .series-chapters-section {
          margin-top: 48px;
        }

        .series-section-header {
          margin-bottom: 24px;
        }

        .series-section-title {
          font-family: 'Newsreader', serif;
          font-size: 1.85rem;
          font-weight: 700;
          margin: 0 0 6px 0;
          color: #0f172a;
        }

        .series-section-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }

        .series-chapters-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .series-chapter-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .series-chapter-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.08);
          transform: translateY(-2px);
        }

        .series-chapter-number-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .series-chapter-part-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .series-chapter-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .series-chapter-info {
          flex: 1;
          min-width: 0;
        }

        .series-chapter-tags {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 0.8rem;
          color: #64748b;
        }

        .series-chapter-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.35;
        }

        .series-chapter-subtitle {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .series-chapter-thumb-wrap {
          width: 80px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .series-chapter-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .series-chapter-arrow {
          font-size: 1.1rem;
          color: #94a3b8;
          padding-left: 8px;
          transition: transform 0.2s, color 0.2s;
        }

        .series-chapter-item:hover .series-chapter-arrow {
          color: #0f172a;
          transform: translateX(4px);
        }

        @media (max-width: 640px) {
          .series-chapter-item {
            padding: 16px;
            gap: 12px;
          }
          .series-chapter-thumb-wrap {
            display: none;
          }
          .series-chapter-number-box {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default SeriesDetails;
