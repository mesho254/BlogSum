import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Avatar, Tooltip, Button, Drawer, Input, List, Skeleton } from 'antd';
import { ClockCircleOutlined, HeartOutlined, HeartFilled, CommentOutlined, BookOutlined, ShareAltOutlined, BookFilled, WhatsAppOutlined, MessageOutlined, TwitterOutlined, LinkedinOutlined, AudioOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLike, toggleBookmark, shareBlog } from '../Redux/actions';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [speechState, setSpeechState] = useState('stopped'); // 'stopped', 'playing', 'paused'
  
  const dispatch = useDispatch();
  const likes = useSelector(state => state.likes);
  const bookmarks = useSelector(state => state.bookmarks);
  const shares = useSelector(state => state.shares);
  const liked = likes[id] || false;
  const bookmarked = bookmarks[id] || false;
  const sharesCount = shares[id] || 0;

  const speechSynthesisRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const {user } = useAuth()
  

  useEffect(() => {
    const getBlog = async () => {
      if (speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      const response = await axiosInstance.get(`/api/blogs/${id}`);
      setBlog(response.data);
      setLikesCount(response.data.likes.length);
      setComments(response.data.comments);
    };
    getBlog();
  }, [id]);

  const handleLikeClick = async () => {
    try {
      const response = await axiosInstance.put(`/api/blogs/${id}/like`);
      const updatedLikes = response.data.likes.length;
      dispatch(toggleLike(id));
      setLikesCount(updatedLikes);
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleBookmarkClick = async () => {
    try {
      await axiosInstance.put(`/api/blogs/${id}/bookmark`);
      dispatch(toggleBookmark(id));
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  const handleCommentClick = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;
    try {
      const response = await axiosInstance.post(`/api/blogs/${id}/comment`, { comment: newComment });
      setComments(response.data);  // response.data now contains the updated comments
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const ShareBlog = (platform) => {
    const blogUrl = `${window.location.origin}/blog/${id}`;
    let shareUrl = '';

    switch(platform) {
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
    if (window.speechSynthesis) {
      if (speechState === 'playing') {
        speechSynthesisRef.current.pause();
        setSpeechState('paused');
      } else if (speechState === 'paused') {
        speechSynthesisRef.current.resume();
        setSpeechState('playing');
      } else {
        const speech = new SpeechSynthesisUtterance();
        speech.text = blog.title + " " + blog.content.replace(/<[^>]+>/g, '');
        speech.rate = 1; // You can adjust the speech rate if needed

        utteranceRef.current = speech;
        speechSynthesisRef.current.speak(speech);
        setSpeechState('playing');

        speech.onend = () => {
          setSpeechState('stopped');
        };
      }
    } else {
      alert("Sorry, your browser doesn't support text-to-speech.");
    }
  };

  if (!blog) return <div><div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
  <Skeleton active avatar paragraph={{ rows: 4 }} />
</div></div>;

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '80px auto' }}>
        <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '10px' }}>{blog.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#8c8c8c' }}>
          <Link to={`/profile/${blog.author._id}`}><Avatar src={blog.author.profilePicture} /></Link>
          <Link to={`/profile/${blog.author._id}`}><span style={{ marginLeft: '10px' }}>{user && user.username === blog.author.username ? 'You' : blog.author.username}</span></Link>
          <span style={{ marginLeft: '10px' }}>{moment(blog.date).format('DD MMM YYYY')}</span>
          <span style={{ marginLeft: '10px' }}><ClockCircleOutlined /> {blog.readTime} min read</span>
          <Tooltip title={speechState === 'playing' ? "Pause reading" : speechState === 'paused' ? "Resume reading" : "Read aloud"}>
            <Button icon={<AudioOutlined />} onClick={handleVoiceClick} style={{ marginLeft: '10px' }} />
          </Tooltip>
        </div>

        <img src={blog.imageUrl} alt={blog.title} style={{ width: '100%', height: 'auto', borderRadius: '10px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Tooltip title="Like">
            <span onClick={handleLikeClick} style={{ cursor: "pointer" }}>
              {liked ? <HeartFilled style={{ color: "red" }} /> : <HeartOutlined />} {likesCount}
            </span>
          </Tooltip>
          <Tooltip title="Comments">
            <span onClick={handleCommentClick} style={{ cursor: "pointer" }}><CommentOutlined style={{ color: "blue" }} /> {comments.length}</span>
          </Tooltip>
          <Tooltip title="Bookmark">
            <span onClick={handleBookmarkClick} style={{ cursor: "pointer" }}>
              {bookmarked ? <BookFilled style={{ color: "yellowgreen" }} /> : <BookOutlined />}
            </span>
          </Tooltip>
          <Tooltip title="Share">
            <span onClick={handleShareClick} style={{ cursor: "pointer" }}><ShareAltOutlined style={{ color: "green" }} /> {sharesCount}</span>
          </Tooltip>
        </div>
        {showShareIcons && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <Tooltip title="Share on WhatsApp">
              <WhatsAppOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }} onClick={() => ShareBlog('whatsapp')} />
            </Tooltip>
            <Tooltip title="Share via Message">
              <MessageOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }} onClick={() => ShareBlog('message')} />
            </Tooltip>
            <Tooltip title="Share on Twitter">
              <TwitterOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }} onClick={() => ShareBlog('twitter')} />
            </Tooltip>
            <Tooltip title="Share on LinkedIn">
              <LinkedinOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }} onClick={() => ShareBlog('linkedin')} />
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
        visible={drawerVisible}
        width={400}
        style={{marginTop:"90px"}}
      >
        <List
        style={{overflowY:"auto", marginBottom:"200px"}}
          dataSource={comments}
          renderItem={comment => (
            <List.Item key={comment._id} style={{overflowY:"auto"}}>
              <List.Item.Meta
                avatar={<Avatar src={comment.user.profilePicture} />}
                title={comment.user.username}
                description={comment.comment}
              />
            </List.Item>
          )}
        />
        {user ? (
          <div style={{position:"fixed", bottom:5, marginTop:"70px"}}>
        <Input.TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          placeholder="Add a comment..."
          style={{ marginTop: '20px' }}
        />
        <Button type="primary" onClick={handleAddComment} style={{ marginTop: '10px' }}>
          Submit
        </Button>
        </div>):(
          <div>
            <p>Login First To comment</p>
          </div>
        )}
      </Drawer>
        <style>
          {`
            .blog-content img {
              width: 80px;
              height: 80px;
              object-fit: cover;
            }
          `}
        </style>
      </div>
    </>
  );
};

export default BlogDetail;
