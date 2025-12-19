import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import {
  Avatar,
  Tooltip,
  Button,
  Drawer,
  Input,
  List,
  Skeleton,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  BookOutlined,
  ShareAltOutlined,
  BookFilled,
  WhatsAppOutlined,
  MessageOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  AudioOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLike, toggleBookmark, shareBlog } from '../Redux/actions';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
const BlogDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const likes = useSelector((state) => state.likes);
  const bookmarks = useSelector((state) => state.bookmarks);
  const shares = useSelector((state) => state.shares);

  const liked = likes[id] || false;
  const bookmarked = bookmarks[id] || false;
  const sharesCount = shares[id] || 0;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [speechState, setSpeechState] = useState('stopped'); // 'stopped', 'playing', 'paused'

  const speechSynthesisRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch blog data with useQuery
  const {
    data: blog,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/blogs/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      // Cancel any ongoing speech when navigating to a new blog
      if (speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
        setSpeechState('stopped');
      }
    },
  });

  // Mutation for liking
  const likeMutation = useMutation({
    mutationFn: () => axiosInstance.put(`/api/blogs/${id}/like`),
    onSuccess: (response) => {
      queryClient.setQueryData(['blog', id], (old) => ({
        ...old,
        likes: response.data.likes,
      }));
      dispatch(toggleLike(id));
    },
    onError: () => {
      message.error('Failed to like blog');
    },
  });

  // Mutation for bookmarking
  const bookmarkMutation = useMutation({
    mutationFn: () => axiosInstance.put(`/api/blogs/${id}/bookmark`),
    onSuccess: () => {
      dispatch(toggleBookmark(id));
    },
    onError: () => {
      message.error('Failed to bookmark blog');
    },
  });

  // Mutation for adding comment
  const commentMutation = useMutation({
    mutationFn: (commentText) =>
      axiosInstance.post(`/api/blogs/${id}/comment`, { comment: commentText }),
    onSuccess: (response) => {
      queryClient.setQueryData(['blog', id], (old) => ({
        ...old,
        comments: response.data,
      }));
      setNewComment('');
      message.success('Comment added!');
    },
    onError: () => {
      message.error('Failed to add comment');
    },
  });

  const handleLikeClick = () => {
    likeMutation.mutate();
  };

  const handleBookmarkClick = () => {
    bookmarkMutation.mutate();
  };

  const handleCommentClick = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const ShareBlog = (platform) => {
    const blogUrl = `${window.location.origin}/blog/${id}`;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(blogUrl)}`;
        break;
      case 'message':
        shareUrl = `sms:?&body=${encodeURIComponent(blogUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(blogUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(blogUrl)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
    dispatch(shareBlog(id));
  };

  const handleVoiceClick = () => {
    if (!window.speechSynthesis) {
      alert("Sorry, your browser doesn't support text-to-speech.");
      return;
    }

    if (speechState === 'playing') {
      speechSynthesisRef.current.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      speechSynthesisRef.current.resume();
      setSpeechState('playing');
    } else if (blog) {
      const text = `${blog.title}. ${blog.content.replace(/<[^>]+>/g, '')}`;
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = 1;

      utteranceRef.current = speech;
      speechSynthesisRef.current.speak(speech);
      setSpeechState('playing');

      speech.onend = () => setSpeechState('stopped');
      speech.onerror = () => setSpeechState('stopped');
    }
  };

  const handleBack = () => {
    navigate(-1);
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px', maxWidth: '800px', margin: '100px auto' }}>
          <Skeleton active avatar paragraph={{ rows: 10 }} />
        </div>
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '100px' }}>
          <p>Error loading blog: {error?.message || 'Something went wrong'}</p>
        </div>
      </>
    );
  }

  // No blog (shouldn't happen with valid ID)
  if (!blog) return null;

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '80px auto' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: '20px' }}
        >
          Back
        </Button>
        <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '10px' }}>
          {blog.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#8c8c8c' }}>
          <Link to={`/profile/${blog.author._id}`}>
            <Avatar src={blog.author.profilePicture} />
          </Link>
          <Link to={`/profile/${blog.author._id}`}>
            <span style={{ marginLeft: '10px' }}>
              {user && user.username === blog.author.username ? 'You' : blog.author.username}
            </span>
          </Link>
          <span style={{ marginLeft: '10px' }}>{moment(blog.date).format('DD MMM YYYY')}</span>
          <span style={{ marginLeft: '10px' }}>
            <ClockCircleOutlined /> {blog.readTime} min read
          </span>
          <Tooltip
            title={
              speechState === 'playing'
                ? 'Pause reading'
                : speechState === 'paused'
                ? 'Resume reading'
                : 'Read aloud'
            }
          >
            <Button icon={<AudioOutlined />} onClick={handleVoiceClick} style={{ marginLeft: '10px' }} />
          </Tooltip>
        </div>

        <img
          src={blog.imageUrl}
          alt={blog.title}
          style={{ width: '100%', height: 'auto', borderRadius: '10px', marginBottom: '20px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Tooltip title="Like">
            <span onClick={handleLikeClick} style={{ cursor: 'pointer' }}>
              {liked ? <HeartFilled style={{ color: 'red' }} /> : <HeartOutlined />}{' '}
              {blog.likes.length}
            </span>
          </Tooltip>
          <Tooltip title="Comments">
            <span onClick={handleCommentClick} style={{ cursor: 'pointer' }}>
              <CommentOutlined style={{ color: 'blue' }} /> {blog.comments.length}
            </span>
          </Tooltip>
          <Tooltip title="Bookmark">
            <span onClick={handleBookmarkClick} style={{ cursor: 'pointer' }}>
              {bookmarked ? <BookFilled style={{ color: 'yellowgreen' }} /> : <BookOutlined />}
            </span>
          </Tooltip>
          <Tooltip title="Share">
            <span onClick={handleShareClick} style={{ cursor: 'pointer' }}>
              <ShareAltOutlined style={{ color: 'green' }} /> {sharesCount}
            </span>
          </Tooltip>
        </div>

        {showShareIcons && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <Tooltip title="Share on WhatsApp">
              <WhatsAppOutlined
                style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }}
                onClick={() => ShareBlog('whatsapp')}
              />
            </Tooltip>
            <Tooltip title="Share via Message">
              <MessageOutlined
                style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }}
                onClick={() => ShareBlog('message')}
              />
            </Tooltip>
            <Tooltip title="Share on Twitter">
              <TwitterOutlined
                style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }}
                onClick={() => ShareBlog('twitter')}
              />
            </Tooltip>
            <Tooltip title="Share on LinkedIn">
              <LinkedinOutlined
                style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }}
                onClick={() => ShareBlog('linkedin')}
              />
            </Tooltip>
          </div>
        )}

        <div
          style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#4a4a4a' }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
          className="blog-content"
        />

        <Drawer
          title="Comments"
          placement="left"
          onClose={handleDrawerClose}
          open={drawerVisible}
          width={400}
          style={{ marginTop: '90px' }}
        >
          <List
            style={{ overflowY: 'auto', marginBottom: '200px' }}
            dataSource={blog.comments}
            renderItem={(comment) => (
              <List.Item key={comment._id}>
                <List.Item.Meta
                  avatar={<Avatar src={comment.user.profilePicture} />}
                  title={comment.user.username}
                  description={comment.comment}
                />
              </List.Item>
            )}
          />
          {user ? (
            <div style={{ position: 'fixed', bottom: 5, left: 24, right: 24, background: '#fff' }}>
              <Input.TextArea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                placeholder="Add a comment..."
                style={{ marginBottom: '10px' }}
              />
              <Button
                type="primary"
                onClick={handleAddComment}
                loading={commentMutation.isPending}
                block
              >
                Submit
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Login to comment</p>
            </div>
          )}
        </Drawer>

        <style>{`
          .blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 10px 0;
          }
        `}</style>
      </div>
    </>
  );
};

export default BlogDetail;