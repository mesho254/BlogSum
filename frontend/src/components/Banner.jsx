import React, { useState, useEffect } from 'react';
import { Avatar, Typography, Tag, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';

const { Title, Paragraph, Text } = Typography;

const stripHtmlTags = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const truncateContent = (content, maxLength) => {
  if (content.length <= maxLength) return content;
  return content.substr(0, maxLength) + '...';
};

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  // Fetch blogs using TanStack Query
  const {
    data: blogs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['bannerBlogs'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/blogs');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000,
  });

  // Set random starting index once blogs are loaded
  useEffect(() => {
    if (blogs.length > 0) {
      const randomStart = Math.floor(Math.random() * blogs.length);
      setCurrentIndex(randomStart);
    }
  }, [blogs]);

  // Auto-rotate every 30 seconds
  useEffect(() => {
    if (blogs.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % blogs.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [blogs]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '500px',
          background: '#f0f0f0',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton active paragraph={{ rows: 4 }} style={{ width: '80%' }} />
      </div>
    );
  }

  // Error state
  if (isError) {
    console.error('Error fetching banner blogs:', error);
    return null; // Silently fail or show fallback UI
  }

  // No blogs
  if (blogs.length === 0) {
    return null;
  }

  const currentBlog = blogs[currentIndex];

  const plainContent = stripHtmlTags(currentBlog.content);
  const truncatedContent = truncateContent(plainContent, 150);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        overflow: 'hidden',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <img
        src={currentBlog.imageUrl}
        alt={currentBlog.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          borderRadius: '8px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        <div style={{ maxWidth: '60%' }}>
          <Tag color="volcano" style={{ marginBottom: '10px', fontSize: '14px' }}>
            {currentBlog.category}
          </Tag>
          <Title level={2} style={{ margin: '0 0 10px 0', color: 'white' }}>
            {currentBlog.title}
          </Title>
          <Paragraph style={{ marginBottom: '10px', color: 'white' }} ellipsis={{ rows: 3 }}>
            {truncatedContent}
          </Paragraph>
          <Link
            to={`/blog/${currentBlog._id}`}
            style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}
          >
            Read More →
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to={`/profile/${currentBlog.author._id}`}>
            <Avatar
              src={currentBlog.author.profilePicture}
              size="large"
              style={{ marginRight: '10px' }}
            />
          </Link>
          <div>
            <Text style={{ color: 'white', display: 'block' }}>
              {user && user.username === currentBlog.author.username
                ? 'You'
                : currentBlog.author.username}
            </Text>
            <Text style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              {new Date(currentBlog.date).toLocaleDateString()} • {currentBlog.readTime} mins read
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;