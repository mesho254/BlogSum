import React, { useState, useEffect } from 'react';
import { useDispatch,  } from 'react-redux';
import { Card, Avatar, Tooltip, Drawer, Input, Button, List, message} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClockCircleOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  BookOutlined,
  ShareAltOutlined,
  BookFilled,
  EditOutlined,
  DeleteOutlined,
  WhatsAppOutlined,
  MessageOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { toggleLike, toggleBookmark, shareBlog } from '../Redux/actions';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';

const stripHtmlTags = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const truncateContent = (content, maxLength) => {
  if (content.length <= maxLength) return content;
  return content.substr(0, maxLength) + '...';
};

const BlogCard = ({ blog }) => {
  const dispatch = useDispatch();
  // const likes = useSelector(state => state.likes);
  // const bookmarks = useSelector(state => state.bookmarks);
  // const shares = useSelector(state => state.shares);
  // const liked = likes[blog._id] || false;
  // const bookmarked = bookmarks[blog._id] || false;
  // const sharesCount = shares[blog._id] || 0;
  const [likesCount, setLikesCount] = useState(blog.likes.length);
  const [bookmarkCount, setBookmarkCount] = useState(blog.bookmarks.length);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(blog.comments);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [sharesCount, setSharesCount] = useState(blog.shares.length);
  const [shared, setShared] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      if (user) {
        try {
          const likeResponse = await axiosInstance.get(`/api/users/${blog._id}/like-status`);
          setLiked(likeResponse.data.isLiked);

          const bookmarkResponse = await axiosInstance.get(`/api/users/${blog._id}/bookmark-status`);
          setBookmarked(bookmarkResponse.data.isBookmarked);

          const shareResponse = await axiosInstance.get(`/api/users/${blog._id}/share-count`);
          setSharesCount(shareResponse.data.isShared);

        } catch (error) {
          console.error('Error fetching like, bookmark, or share status', error);
        }
      }
    };

    fetchStatus();
  }, [user, blog._id]);
  

  useEffect(() => {
    const fetchFollowState = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/${blog.author._id}/follow-state`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setIsFollowing(response.data.isFollowing);
      } catch (error) {
        console.error('Error fetching follow state', error);
      }
    };

    if (user) {
      fetchFollowState();
    }
  }, [user, blog.author._id]);

  const handleFollow = async () => {
    try {
      await axiosInstance.put(`/api/users/${blog.author._id}/follow`, null, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setIsFollowing(true);
      message.success(`You are now following ${blog.author.username} `);
    } catch (error) {
      console.error('Error following the user', error);
      message.error('Error following the user');
    }
  };

  const handleUnfollow = async () => {
    try {
      await axiosInstance.put(`/api/users/${blog.author._id}/unfollow`, null, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setIsFollowing(false);
      message.success(`You have unfollowed ${blog.author.username} `);
    } catch (error) {
      console.error('Error unfollowing the user', error);
      message.error('Error unfollowing the user');
    }
  };

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setBookmarked(!bookmarked);
    setBookmarkCount(bookmarked ? bookmarkCount - 1 : bookmarkCount + 1);
    try {
      const response = await axiosInstance.put(`/api/blogs/${blog._id}/bookmark`);
      dispatch(toggleBookmark(blog._id));
      setBookmarkCount(response.data.bookmarks.length);
      setBookmarked(response.data.bookmarkedBlogs);
      message.success(`${bookmarked ? 'Unbookmarked' : 'Bookmarked'} ${blog.title}`);
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleLikeClick = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    try {
      const response = await axiosInstance.put(`/api/blogs/${blog._id}/like`);
      dispatch(toggleLike(blog._id));
      setLikesCount(response.data.likes.length);
      setLiked(response.data.likedBlogs);
      message.success(`${liked ? 'Unliked' : 'Liked'} ${blog.title}`);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };


  const handleCommentClick = async () => {
    setDrawerVisible(true);
    try {
      const response = await axiosInstance.get(`/api/blogs/${blog._id}`);
      setComments(response.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;
    try {
      const response = await axiosInstance.post(`/api/blogs/${blog._id}/comment`, { comment: newComment });
      setComments(response.data);  // response.data now contains the updated comments
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleEditSubmit = () => {
    navigate(`/edit/${blog._id}`);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/blogs/${blog._id}`);
      // Handle removing the blog from the UI
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const ShareBlog = async (platform) => {
    const blogUrl = `${window.location.origin}/blog/${blog._id}`;
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
    try {
     const response = await axiosInstance.put(`/api/blogs/${blog._id}/share`);
     const updatedShares = response.data.shares.length;
     dispatch(shareBlog(blog._id));
     setSharesCount(updatedShares);
     setShared(response.data.MyShares)
    } catch (error) {
      console.error("Error sharing blog:", error);
    }
  };

  const plainContent = stripHtmlTags(blog.content);
  const truncatedContent = truncateContent(plainContent, 150);

  return (
    <>
      <Card
        hoverable
        cover={
          <div style={{ position: 'relative' }}>
            <Link to={`/blog/${blog._id}`} style={{ textDecoration: 'none' }}>
              <img alt={blog.title} src={blog.imageUrl} style={{ borderRadius: '10px', width: '100%', height: '200px', objectFit: 'cover' }} />
            </Link>
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#000', color: '#fff', padding: '5px 10px', borderRadius: '5px' }}>
              {blog.category}
            </div>
            <Tooltip title={bookmarked ? 'Bookmarked' : 'Bookmark'}>
              <span onClick={handleBookmarkClick} 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection:"column",
                alignItems: 'center',
              }}>
                {bookmarked ? <BookFilled style={{color:"yellow", fontSize:"23px"}}/> : <BookOutlined style={{fontSize:"23px"}}/>}
                <span style={{fontSize:"16", fontWeight:"bolder", fontFamily:"sans-serif", marginTop: '5px', border:"1px solid black",color:"#fff" ,borderRadius:"50%", height:"22px", width:"22px", maxHeight:"60px", maxWidth:"60px", alignItems:"center", textAlign:"center"}}>{bookmarkCount}</span>
              </span>
            </Tooltip>
          </div>
        }
        style={{ borderRadius: '10px', overflow: 'hidden', position: 'relative', border: 'none', maxWidth: "400px" }}
      >
        <Card.Meta
          description={<div style={{ color: '#8c8c8c' }}>{moment(blog.date).format('DD MMM YYYY')} • <ClockCircleOutlined /> {blog.readTime} min read</div>}
        />
        <Link to={`/blog/${blog._id}`} style={{ textDecoration: 'none' }}>
        <h3 style={{ fontSize: '1.2em', fontWeight: 'bold', display: 'block', marginBottom: '10px',  textDecoration: 'none', color:"black"  }}>{blog.title}</h3>
        </Link>
        <p style={{ color: '#8c8c8c', marginTop: '10px' }}>{truncatedContent}</p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom:"20px" }}>
        <Link to={`/profile/${blog.author._id}`}><Avatar src={blog.author.profilePicture} size="large"/></Link> 
          <div >
          <Link to={`/profile/${blog.author._id}`}><span style={{ marginLeft: '10px', marginRight:"80px", color: '#8c8c8c' }}>{user && user.username === blog.author.username ? 'You' : blog.author.username}</span></Link>
          {user && user._id !== blog.author._id && isFollowing ? (
            <Button style={{ marginLeft: 'auto' }} onClick={handleUnfollow} size="small">following</Button>
          ) : (
            user && user._id !== blog.author._id && <Button  style={{ marginLeft: 'auto' }} onClick={handleFollow} size="small">Follow</Button>
          )}
          </div>
          {user && user._id === blog.author._id && (
            <div style={{ marginLeft: 'auto' }}>
              <Tooltip title="Edit">
                <Button icon={<EditOutlined style={{color:"blueviolet"}}/>} onClick={handleEditSubmit} />
              </Tooltip>
              <Tooltip title="Delete">
                <Button icon={<DeleteOutlined style={{color:"red"}}/>} onClick={handleDelete} />
              </Tooltip>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <Tooltip title={liked ? 'Unlike' : 'Like'}>
            <span onClick={handleLikeClick} style={{ marginRight: '20px', cursor: 'pointer', color: liked ? 'red' : 'gray' }}>
              {liked ? <HeartFilled /> : <HeartOutlined />} {likesCount}
            </span>
          </Tooltip>
          <Tooltip title="Comments">
            <span onClick={handleCommentClick}><CommentOutlined style={{color:"blueviolet"}}/> {comments.length}</span>
          </Tooltip>
          <Tooltip title="Share">
            <span onClick={handleShareClick} style={{ cursor: 'pointer', color: shared ? 'green' : 'black'  }}>
              <ShareAltOutlined /><span>{sharesCount}</span>
            </span>
          </Tooltip>
        </div>
        {showShareIcons && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <Tooltip title="Share on WhatsApp">
              <WhatsAppOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer', color:"green" }} onClick={() => ShareBlog('whatsapp')} />
            </Tooltip>
            <Tooltip title="Share via Message">
              <MessageOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer' }} onClick={() => ShareBlog('message')} />
            </Tooltip>
            <Tooltip title="Share on Twitter">
              <TwitterOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer', color:"blueviolet" }} onClick={() => ShareBlog('twitter')} />
            </Tooltip>
            <Tooltip title="Share on LinkedIn">
              <LinkedinOutlined style={{ fontSize: '24px', margin: '0 8px', cursor: 'pointer', color:"blue" }} onClick={() => ShareBlog('linkedin')} />
            </Tooltip>
          </div>
        )}
      </Card>

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
          <div style={{position:"fixed", bottom:0, marginTop:"70px"}}>
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
    </>
  );
};

export default BlogCard;
