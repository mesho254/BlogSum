import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { Avatar, Typography, Tag } from 'antd';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

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
  const [blogs, setBlogs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const {user} = useAuth()

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get('/api/blogs'); // Adjust the endpoint as needed
        setBlogs(response.data);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % blogs.length);
    }, 30000); 

    return () => clearInterval(interval);
  }, [blogs]);

  if (blogs.length === 0) {
    return null; // or a loading indicator
  }

  const currentBlog = blogs[currentIndex];

  const plainContent = stripHtmlTags(currentBlog.content);
  const truncatedContent = truncateContent(plainContent, 150);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', overflow: 'hidden', borderRadius: '8px', marginBottom: '20px' }}>
      <img 
        src={currentBlog.imageUrl} 
        alt={currentBlog.title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, borderRadius: '8px' }}
      />
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'white', background: 'rgba(0, 0, 0, 0.5)', padding: '20px', borderRadius: '8px' }}>
        <div style={{ maxWidth: '60%' }}>
          <Tag color="volcano" style={{ marginBottom: '10px', fontSize: '14px' }}>
            {currentBlog.category}
          </Tag>
          <Title level={2} style={{ marginBottom: '10px', color: 'white' }}>{currentBlog.title}</Title>
          <Paragraph style={{ marginBottom: '10px', color: 'white' }} ellipsis={{ rows: 3, expandable: false }}>
            {truncatedContent}
          </Paragraph>
          <Link to={`/blog/${currentBlog._id}`} style={{ textDecoration: 'none', color:"#fff" }}>
            Read More...
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to={`/profile/${currentBlog.author._id}`}><Avatar src={currentBlog.author.profilePicture} size="large" style={{ marginRight: '10px' }} /></Link>
          <div>
            <Text style={{ color: 'white' }}>{user && user.username === currentBlog.author.username ? 'You' : currentBlog.author.username}</Text>
            <br />
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
