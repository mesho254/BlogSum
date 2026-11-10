import React, { useState, useEffect } from 'react';
import { Avatar, Skeleton } from 'antd';
import {
  ClockCircleOutlined,
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import AuthorHoverCard from './AuthorHoverCard';

const stripHtmlTags = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

const truncateContent = (content, maxLength) => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
};

const getCachedBlogs = () => {
  try {
    const raw = localStorage.getItem('blogsum_blogs_cache');
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  const {
    data: blogs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/blogs');
      try {
        localStorage.setItem('blogsum_blogs_cache', JSON.stringify(response.data));
      } catch {
        // Ignore quota errors
      }
      return response.data;
    },
    placeholderData: getCachedBlogs,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (blogs.length > 0) {
      const randomStart = Math.floor(Math.random() * Math.min(blogs.length, 5));
      setCurrentIndex(randomStart);
    }
  }, [blogs.length]);

  useEffect(() => {
    if (blogs.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % blogs.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [blogs.length]);

  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: '1280px',
          width: '94%',
          height: '460px',
          margin: '0 auto 24px',
          background: '#f8fafc',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0',
        }}
      >
        <Skeleton active paragraph={{ rows: 4 }} style={{ width: '80%' }} />
      </div>
    );
  }

  if (isError) {
    console.error('Error fetching banner blogs:', error);
    return null;
  }

  if (blogs.length === 0) {
    return null;
  }

  const currentBlog = blogs[currentIndex] || blogs[0];
  const plainContent = stripHtmlTags(currentBlog.content);
  const truncatedContent = truncateContent(plainContent, 165);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + blogs.length) % blogs.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % blogs.length);
  };

  return (
    <div className="modern-hero-banner">
      <img
        src={currentBlog.imageUrl}
        alt={currentBlog.title}
        className="modern-hero-banner__image"
      />
      <div className="modern-hero-banner__gradient" />

      {/* Top Featured Badge + Slide Arrows */}
      <div className="modern-hero-banner__topbar">
        <div className="modern-hero-banner__featured-pill">
          <span className="modern-hero-banner__pulse" />
          <span>FEATURED STORY</span>
        </div>

        {blogs.length > 1 && (
          <div className="modern-hero-banner__controls">
            <button
              type="button"
              onClick={handlePrev}
              className="modern-hero-banner__nav-btn"
              aria-label="Previous featured story"
            >
              <LeftOutlined />
            </button>
            <span className="modern-hero-banner__counter">
              {currentIndex + 1} / {blogs.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="modern-hero-banner__nav-btn"
              aria-label="Next featured story"
            >
              <RightOutlined />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Glassmorphic Content Card */}
      <div className="modern-hero-banner__glass-card">
        <div className="modern-hero-banner__content">
          <div className="modern-hero-banner__meta-row">
            <span className="modern-hero-banner__cat">{currentBlog.category}</span>
            <span className="modern-hero-banner__readtime">
              <ClockCircleOutlined /> {currentBlog.readTime} min read
            </span>
          </div>

          <Link to={`/blog/${currentBlog._id}`} className="modern-hero-banner__title-link">
            <h1 className="modern-hero-banner__title">{currentBlog.title}</h1>
          </Link>

          <p className="modern-hero-banner__excerpt">{truncatedContent}</p>

          <Link to={`/blog/${currentBlog._id}`} className="modern-hero-banner__cta">
            <span>Read Full Article</span>
            <ArrowRightOutlined style={{ fontSize: '12px' }} />
          </Link>
        </div>

        <div className="modern-hero-banner__author">
          <AuthorHoverCard author={currentBlog.author}>
            <Link to={`/profile/${currentBlog.author?._id}`}>
              <Avatar
                src={currentBlog.author?.profilePicture}
                size={46}
                style={{
                  border: '2px solid rgba(255, 255, 255, 0.85)',
                  backgroundColor: '#4f46e5',
                  fontWeight: 700,
                }}
              >
                {currentBlog.author?.username?.[0]?.toUpperCase()}
              </Avatar>
            </Link>
          </AuthorHoverCard>
          <div>
            <AuthorHoverCard author={currentBlog.author}>
              <Link
                to={`/profile/${currentBlog.author?._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="modern-hero-banner__author-name">
                  {user && user.username === currentBlog.author?.username
                    ? 'You'
                    : currentBlog.author?.username}
                </div>
              </Link>
            </AuthorHoverCard>
            <div className="modern-hero-banner__author-date">
              {new Date(currentBlog.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modern-hero-banner {
          position: relative;
          max-width: 1280px;
          width: 94%;
          height: 470px;
          margin: 0 auto 28px;
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 24px 48px -14px rgba(15, 23, 42, 0.22);
          background: #0f172a;
        }
        .modern-hero-banner__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
          transition: transform 0.7s ease;
        }
        .modern-hero-banner:hover .modern-hero-banner__image {
          transform: scale(1.03);
        }
        .modern-hero-banner__gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.35) 0%,
            rgba(15, 23, 42, 0.15) 40%,
            rgba(15, 23, 42, 0.82) 100%
          );
        }
        .modern-hero-banner__topbar {
          position: absolute;
          top: 22px;
          left: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 2;
        }
        .modern-hero-banner__featured-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f8fafc;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        .modern-hero-banner__pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.25);
        }
        .modern-hero-banner__controls {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #f8fafc;
        }
        .modern-hero-banner__nav-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .modern-hero-banner__nav-btn:hover {
          background: rgba(255, 255, 255, 0.28);
        }
        .modern-hero-banner__counter {
          font-size: 11.5px;
          font-weight: 700;
          padding: 0 4px;
        }
        .modern-hero-banner__glass-card {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: 24px 28px;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.62);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .modern-hero-banner__content {
          max-width: 680px;
          flex: 1;
          min-width: 260px;
        }
        .modern-hero-banner__meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .modern-hero-banner__cat {
          padding: 4px 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
        }
        .modern-hero-banner__readtime {
          font-size: 12px;
          color: rgba(248, 250, 252, 0.85);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .modern-hero-banner__title-link {
          text-decoration: none;
        }
        .modern-hero-banner__title {
          font-size: clamp(1.45rem, 2.5vw, 2.05rem);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 8px;
          line-height: 1.25;
        }
        .modern-hero-banner__excerpt {
          color: rgba(241, 245, 249, 0.85);
          font-size: 0.94rem;
          line-height: 1.55;
          margin: 0 0 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .modern-hero-banner__cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 999px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .modern-hero-banner__cta:hover {
          transform: translateX(3px);
          color: #4f46e5;
          box-shadow: 0 6px 16px rgba(255, 255, 255, 0.2);
        }
        .modern-hero-banner__author {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .modern-hero-banner__author-name {
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
        }
        .modern-hero-banner__author-date {
          color: rgba(241, 245, 249, 0.72);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default Banner;
