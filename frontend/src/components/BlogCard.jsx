import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Tooltip, Button, Popover, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClockCircleOutlined,
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
  CopyOutlined,
  UserAddOutlined,
  CheckOutlined,
  PictureOutlined,
  StarFilled,
  CheckCircleFilled,
} from '@ant-design/icons';
import moment from 'moment';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setLikeState, setBookmarkState, shareBlog } from '../Redux/actions';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import ReactionPicker, {
  hasUserId,
  getUserReactionFromBlog,
  getTopReactions,
} from './ReactionPicker';
import AuthorHoverCard from './AuthorHoverCard';
import CommentsDrawer, { getTotalCommentsCount } from './CommentsDrawer';

const CATEGORY_COLORS = {
  Technology: { dot: '#38bdf8', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Business: { dot: '#60a5fa', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Design: { dot: '#f472b6', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Finance: { dot: '#4ade80', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Science: { dot: '#2dd4bf', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Health: { dot: '#34d399', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Lifestyle: { dot: '#fb7185', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Education: { dot: '#fbbf24', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Travel: { dot: '#a78bfa', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Culture: { dot: '#fb923c', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Productivity: { dot: '#818cf8', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Career: { dot: '#38bdf8', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Food: { dot: '#f87171', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Entertainment: { dot: '#c084fc', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
  Sports: { dot: '#a3e635', pillBg: 'rgba(15, 23, 42, 0.78)', text: '#f8fafc' },
};

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

const BlogCard = ({ blog, onTagClick }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  const reduxLikes = useSelector((state) => state.likes || {});
  const reduxReactions = useSelector((state) => state.reactions || {});
  const reduxBookmarks = useSelector((state) => state.bookmarks || {});

  const userId = user?._id || user?.id;

  const computeInitialLiked = () => {
    if (typeof blog.userLiked === 'boolean') return blog.userLiked;
    if (userId && hasUserId(blog.likes, userId)) return true;
    if (userId && Array.isArray(blog.likes)) return false;
    return Boolean(reduxLikes[blog._id]);
  };

  const computeInitialReaction = () => {
    const fromBlog = getUserReactionFromBlog(blog, userId, reduxReactions[blog._id]);
    if (fromBlog) return fromBlog;
    if (computeInitialLiked()) return reduxReactions[blog._id] || 'love';
    return null;
  };

  const [likesCount, setLikesCount] = useState(blog.likes?.length || 0);
  const [liked, setLiked] = useState(computeInitialLiked);
  const [reactionType, setReactionType] = useState(computeInitialReaction);

  const [bookmarkCount, setBookmarkCount] = useState(blog.bookmarks?.length || 0);
  const [bookmarked, setBookmarked] = useState(() =>
    userId ? hasUserId(blog.bookmarks, userId) : Boolean(reduxBookmarks[blog._id])
  );

  const [sharesCount, setSharesCount] = useState(blog.shares?.length || 0);
  const [shared, setShared] = useState(() => hasUserId(blog.shares, userId));

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [comments, setComments] = useState(blog.comments || []);
  const [shareOpen, setShareOpen] = useState(false);

  // Sync card counts and status whenever cached blog data or user changes
  useEffect(() => {
    const nextLiked =
      typeof blog.userLiked === 'boolean'
        ? blog.userLiked
        : userId
        ? hasUserId(blog.likes, userId)
        : Boolean(reduxLikes[blog._id]);

    const nextReaction = nextLiked
      ? getUserReactionFromBlog(blog, userId, reduxReactions[blog._id]) ||
        reduxReactions[blog._id] ||
        'love'
      : null;

    const nextBookmarked =
      typeof blog.userBookmarked === 'boolean'
        ? blog.userBookmarked
        : userId
        ? hasUserId(blog.bookmarks, userId)
        : Boolean(reduxBookmarks[blog._id]);

    setLikesCount(blog.likes?.length || 0);
    setLiked(nextLiked);
    setReactionType(nextReaction);
    setBookmarkCount(blog.bookmarks?.length || 0);
    setBookmarked(nextBookmarked);
    setSharesCount(blog.shares?.length || 0);
    setShared(hasUserId(blog.shares, userId));
    setComments(blog.comments || []);
  }, [blog, userId]);

  const authorId = blog.author?._id;
  const isAuthor = Boolean(userId && authorId && String(userId) === String(authorId));
  const isAdmin = Boolean(
    user &&
      (user.roles === 'admin' ||
        String(user.username || '').trim().toLowerCase() === 'admin')
  );
  const canManage = Boolean(isAuthor || isAdmin);

  const { data: isFollowing = false } = useQuery({
    queryKey: ['followState', authorId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/users/${authorId}/follow-state`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return Boolean(response.data.isFollowing);
    },
    enabled: Boolean(user?.token && authorId && !isAuthor),
    staleTime: 2 * 60 * 1000,
  });

  const handleFollow = async (e) => {
    e?.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await axiosInstance.put(`/api/users/${authorId}/follow`, null, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      queryClient.setQueryData(['followState', authorId], true);
      queryClient.invalidateQueries({ queryKey: ['authorPreview', authorId] });
      message.success(`You are now following ${blog.author.username}`);
    } catch (error) {
      console.error('Error following the user', error);
      message.error('Error following the user');
    }
  };

  const handleUnfollow = async (e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.put(`/api/users/${authorId}/unfollow`, null, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      queryClient.setQueryData(['followState', authorId], false);
      queryClient.invalidateQueries({ queryKey: ['authorPreview', authorId] });
      message.success(`You have unfollowed ${blog.author.username}`);
    } catch (error) {
      console.error('Error unfollowing the user', error);
      message.error('Error unfollowing the user');
    }
  };

  const updateBlogInQueryCache = (updatedBlogData) => {
    const mergeItem = (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((item) =>
        String(item._id) === String(blog._id) ? { ...item, ...updatedBlogData } : item
      );
    };
    queryClient.setQueryData(['blogs'], mergeItem);
    queryClient.setQueryData(['postedBlogs'], mergeItem);
    if (authorId) {
      queryClient.setQueryData(['otherBlogs', authorId], mergeItem);
    }
    queryClient.setQueryData(['blog', blog._id], (old) =>
      old ? { ...old, ...updatedBlogData } : updatedBlogData
    );
  };

  const performReactionUpdate = async (chosenReactionType = null) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const prevLiked = liked;
    const prevReaction = reactionType;
    const prevCount = likesCount;

    let optimisticLiked;
    let optimisticReaction;
    let optimisticCount;

    if (chosenReactionType) {
      if (prevLiked && prevReaction === chosenReactionType) {
        optimisticLiked = false;
        optimisticReaction = null;
        optimisticCount = Math.max(0, prevCount - 1);
      } else {
        optimisticLiked = true;
        optimisticReaction = chosenReactionType;
        optimisticCount = prevLiked ? prevCount : prevCount + 1;
      }
    } else {
      optimisticLiked = !prevLiked;
      optimisticReaction = optimisticLiked ? 'love' : null;
      optimisticCount = optimisticLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    }

    // Immediate optimistic update (keeps red heart / reaction visible!)
    setLiked(optimisticLiked);
    setReactionType(optimisticReaction);
    setLikesCount(optimisticCount);
    dispatch(setLikeState(blog._id, optimisticLiked, optimisticReaction));

    try {
      const payload = chosenReactionType ? { reactionType: chosenReactionType } : {};
      const response = await axiosInstance.put(`/api/blogs/${blog._id}/like`, payload);
      const serverData = response.data;

      const confirmedLiked =
        typeof serverData.userLiked === 'boolean'
          ? serverData.userLiked
          : hasUserId(serverData.likes, userId);

      const confirmedReaction = confirmedLiked
        ? serverData.userReaction ||
          getUserReactionFromBlog(serverData, userId, optimisticReaction) ||
          optimisticReaction ||
          'love'
        : null;

      const confirmedCount = Array.isArray(serverData.likes)
        ? serverData.likes.length
        : optimisticCount;

      setLiked(confirmedLiked);
      setReactionType(confirmedReaction);
      setLikesCount(confirmedCount);
      dispatch(setLikeState(blog._id, confirmedLiked, confirmedReaction));

      updateBlogInQueryCache({
        ...serverData,
        userLiked: confirmedLiked,
        userReaction: confirmedReaction,
      });
      queryClient.invalidateQueries({ queryKey: ['likedBlogs'] });
    } catch (error) {
      setLiked(prevLiked);
      setReactionType(prevReaction);
      setLikesCount(prevCount);
      dispatch(setLikeState(blog._id, prevLiked, prevReaction));
      console.error('Error updating reaction:', error);
      message.error('Could not update reaction');
    }
  };

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const prevBookmarked = bookmarked;
    const prevCount = bookmarkCount;
    const nextBookmarked = !prevBookmarked;
    const nextCount = nextBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setBookmarked(nextBookmarked);
    setBookmarkCount(nextCount);
    dispatch(setBookmarkState(blog._id, nextBookmarked));

    try {
      const response = await axiosInstance.put(`/api/blogs/${blog._id}/bookmark`);
      const serverData = response.data;
      const confirmedBookmarked =
        typeof serverData.userBookmarked === 'boolean'
          ? serverData.userBookmarked
          : hasUserId(serverData.bookmarks, userId);
      const confirmedCount = Array.isArray(serverData.bookmarks)
        ? serverData.bookmarks.length
        : nextCount;

      setBookmarked(confirmedBookmarked);
      setBookmarkCount(confirmedCount);
      dispatch(setBookmarkState(blog._id, confirmedBookmarked));
      updateBlogInQueryCache({
        ...serverData,
        userBookmarked: confirmedBookmarked,
      });
      queryClient.invalidateQueries({ queryKey: ['bookmarkedBlogs'] });
      message.success(confirmedBookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch (error) {
      setBookmarked(prevBookmarked);
      setBookmarkCount(prevCount);
      dispatch(setBookmarkState(blog._id, prevBookmarked));
      console.error('Error updating bookmark:', error);
    }
  };

  const handleCommentClick = async () => {
    setDrawerVisible(true);
    try {
      const response = await axiosInstance.get(`/api/blogs/${blog._id}`);
      if (response.data?.comments) {
        setComments(response.data.comments);
        updateBlogInQueryCache({ comments: response.data.comments });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleEditSubmit = (e) => {
    e?.stopPropagation();
    navigate(`/edit/${blog._id}`);
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    try {
      await axiosInstance.delete(`/api/blogs/${blog._id}`);
      queryClient.setQueryData(['blogs'], (old = []) => old.filter((b) => b._id !== blog._id));
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['postedBlogs'] });
      message.success('Blog deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      message.error('Failed to delete blog');
    }
  };

  const handleSharePlatform = async (platform) => {
    const blogUrl = `${window.location.origin}/blog/${blog._id}`;
    setShareOpen(false);

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(blogUrl);
        message.success('Article link copied to clipboard!');
      } catch {
        message.info(blogUrl);
      }
    } else {
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
    }

    if (!user) return;
    try {
      const response = await axiosInstance.put(`/api/blogs/${blog._id}/share`);
      const updatedShares = response.data.shares?.length ?? sharesCount + 1;
      dispatch(shareBlog(blog._id));
      setSharesCount(updatedShares);
      setShared(true);
      updateBlogInQueryCache(response.data);
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  const truncatedContent = useMemo(
    () => truncateContent(stripHtmlTags(blog.content), 135),
    [blog.content]
  );

  const topReactions = useMemo(
    () => getTopReactions(blog, liked ? reactionType || 'love' : null),
    [blog, liked, reactionType]
  );

  const totalCommentsCount = useMemo(() => getTotalCommentsCount(comments), [comments]);
  const catStyle = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS.Technology;

  const coverImage =
    blog.imageUrl || (Array.isArray(blog.images) && blog.images[0]) || '';
  const totalPhotos =
    Array.isArray(blog.images) && blog.images.length > 0
      ? blog.images.length
      : coverImage
      ? 1
      : 0;
  const publishTime = blog.publishDate || blog.date;
  const isScheduledFuture = Boolean(
    publishTime && new Date(publishTime) > new Date()
  );
  const isDraft = blog.status === 'draft';
  const tagsList = Array.isArray(blog.tags) ? blog.tags : [];

  const shareMenuContent = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px',
      }}
    >
      <Tooltip title="WhatsApp">
        <button
          type="button"
          onClick={() => handleSharePlatform('whatsapp')}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: '#dcfce7',
            color: '#16a34a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          <WhatsAppOutlined />
        </button>
      </Tooltip>
      <Tooltip title="LinkedIn">
        <button
          type="button"
          onClick={() => handleSharePlatform('linkedin')}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: '#dbeafe',
            color: '#2563eb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          <LinkedinOutlined />
        </button>
      </Tooltip>
      <Tooltip title="X / Twitter">
        <button
          type="button"
          onClick={() => handleSharePlatform('twitter')}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: '#e0f2fe',
            color: '#0284c7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          <TwitterOutlined />
        </button>
      </Tooltip>
      <Tooltip title="SMS Message">
        <button
          type="button"
          onClick={() => handleSharePlatform('message')}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: '#f3e8ff',
            color: '#7c3aed',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          <MessageOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Copy Link">
        <button
          type="button"
          onClick={() => handleSharePlatform('copy')}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: '#f1f5f9',
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          <CopyOutlined />
        </button>
      </Tooltip>
    </div>
  );

  return (
    <>
      <article className="modern-blog-card">
        {/* Image Cover Header (Always features 1 primary image on list) */}
        <div className="modern-blog-card__media">
          <Link to={`/blog/${blog._id}`} className="modern-blog-card__image-link">
            <img
              alt={blog.title}
              src={coverImage}
              loading="lazy"
              decoding="async"
              className="modern-blog-card__image"
            />
            <div className="modern-blog-card__image-overlay" />
          </Link>

          {/* Frosted Category Pill */}
          <div
            className="modern-blog-card__category"
            style={{
              background: catStyle.pillBg,
              color: catStyle.text,
            }}
          >
            <span
              className="modern-blog-card__category-dot"
              style={{ backgroundColor: catStyle.dot }}
            />
            <span>{blog.category}</span>
          </div>

          {/* Sleek Floating Bookmark Pill */}
          <Tooltip title={bookmarked ? 'Saved in Bookmarks' : 'Save Article'}>
            <button
              type="button"
              onClick={handleBookmarkClick}
              className={`modern-blog-card__bookmark ${bookmarked ? 'is-bookmarked' : ''}`}
              aria-label="Bookmark article"
            >
              {bookmarked ? (
                <BookFilled style={{ fontSize: '15px', color: '#fbbf24' }} />
              ) : (
                <BookOutlined style={{ fontSize: '15px', color: '#ffffff' }} />
              )}
              <span>{bookmarkCount}</span>
            </button>
          </Tooltip>

          {/* Scheduled / Draft Status Pill (for Author Profile view) */}
          {(isScheduledFuture || isDraft) && (
            <div className="modern-blog-card__schedule-badge">
              <ClockCircleOutlined style={{ fontSize: '11px' }} />
              <span>
                {isDraft
                  ? 'Draft · Not Yet Published'
                  : `Not Yet Published · ${moment(publishTime).format('ddd, DD MMM h:mm A')}`}
              </span>
            </div>
          )}

          {/* Multi-Image Slider Indicator (Featured 1 of N) */}
          {totalPhotos > 1 && (
            <div className="modern-blog-card__photo-badge">
              <PictureOutlined style={{ fontSize: '11px' }} />
              <span>1/{totalPhotos} photos</span>
            </div>
          )}
        </div>

        {/* Card Content Body */}
        <div className="modern-blog-card__body">
          {/*Date & Read Time Meta */}
          <div className="modern-blog-card__meta">
            {blog.isFeatured && (
              <>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#d97706',
                    fontWeight: 700,
                  }}
                >
                  <StarFilled style={{ fontSize: 11 }} /> Editor&apos;s Pick
                </span>
                <span className="modern-blog-card__meta-sep">•</span>
              </>
            )}
            <span>
              {isScheduledFuture
                ? `Publishes ${moment(publishTime).format('DD MMM YYYY')}`
                : moment(publishTime).format('DD MMM YYYY')}
            </span>
            <span className="modern-blog-card__meta-sep">•</span>
            <span className="modern-blog-card__readtime">
              <ClockCircleOutlined style={{ fontSize: '12px' }} /> {blog.readTime} min read
            </span>
          </div>

          {/* Title */}
          <Link to={`/blog/${blog._id}`} className="modern-blog-card__title-link">
            <h3 className="modern-blog-card__title">{blog.title}</h3>
          </Link>

          {/* Excerpt */}
          <p className="modern-blog-card__excerpt">
            {blog.subtitle ? truncateContent(blog.subtitle, 120) : truncatedContent}
          </p>

          {/* Tags Strip on Blog Card */}
          {tagsList.length > 0 && (
            <div className="modern-blog-card__tags">
              {tagsList.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) {
                      onTagClick(tag);
                    } else {
                      navigate(`/?tag=${encodeURIComponent(tag)}`);
                    }
                  }}
                  className="modern-blog-card__tag"
                >
                  #{tag}
                </button>
              ))}
              {tagsList.length > 3 && (
                <span className="modern-blog-card__tag-more">
                  +{tagsList.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Author Row with LinkedIn-Style Hover Profile Card */}
          <div className="modern-blog-card__author-row">
            <div className="modern-blog-card__author-info">
              <AuthorHoverCard
                author={blog.author}
                isFollowing={isFollowing}
              >
                <Link
                  to={`/profile/${blog.author?._id}`}
                  className="modern-blog-card__avatar-wrap"
                >
                  <Avatar
                    src={blog.author?.profilePicture}
                    size={40}
                    style={{
                      backgroundColor: '#4f46e5',
                      fontWeight: 700,
                      border: '2px solid #eef2ff',
                    }}
                  >
                    {blog.author?.username?.[0]?.toUpperCase()}
                  </Avatar>
                </Link>
              </AuthorHoverCard>

              <div className="modern-blog-card__author-text">
                <AuthorHoverCard
                  author={blog.author}
                  isFollowing={isFollowing}
                >
                  <Link
                    to={`/profile/${blog.author?._id}`}
                    className="modern-blog-card__author-name"
                  >
                    {isAuthor ? 'You' : blog.author?.username || 'Author'}
                    {blog.author?.isVerified && (
                      <CheckCircleFilled
                        style={{ color: '#2563eb', fontSize: 12, marginLeft: 4 }}
                        title="Verified Writer"
                      />
                    )}
                  </Link>
                </AuthorHoverCard>
                <span className="modern-blog-card__author-sub">
                  {isAuthor ? 'Published by you' : 'Author'}
                </span>
              </div>
            </div>

            {/* Follow Button OR Author Edit/Delete Actions */}
            <div className="modern-blog-card__author-actions">
              {!isAuthor && user && authorId && (
                <button
                  type="button"
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  className={`modern-blog-card__follow-btn ${
                    isFollowing ? 'is-following' : ''
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckOutlined style={{ fontSize: '11px' }} /> Following
                    </>
                  ) : (
                    <>
                      <UserAddOutlined style={{ fontSize: '11px' }} /> Follow
                    </>
                  )}
                </button>
              )}

              {canManage && (
                <div className="modern-blog-card__owner-btns">
                  <Tooltip title={isAuthor ? 'Edit Article' : 'Edit Article (Admin)'}>
                    <button
                      type="button"
                      onClick={handleEditSubmit}
                      className="modern-blog-card__icon-btn is-edit"
                      aria-label="Edit article"
                    >
                      <EditOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title={isAuthor ? 'Delete Article' : 'Delete Article (Admin)'}>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="modern-blog-card__icon-btn is-delete"
                      aria-label="Delete article"
                    >
                      <DeleteOutlined />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          {/* LinkedIn-Style Social Proof Summary Bar */}
          {(likesCount > 0 || totalCommentsCount > 0 || sharesCount > 0) && (
            <div className="modern-blog-card__social-summary">
              <div className="modern-blog-card__reaction-stack">
                {likesCount > 0 && (
                  <>
                    <div className="modern-blog-card__reaction-badges">
                      {topReactions.map((r, idx) => (
                        <span
                          key={r.key}
                          className="modern-blog-card__reaction-mini"
                          style={{
                            backgroundColor: r.badgeBg,
                            zIndex: 3 - idx,
                            marginLeft: idx === 0 ? 0 : '-5px',
                          }}
                          title={r.label}
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                    <span className="modern-blog-card__reaction-total">
                      {liked
                        ? likesCount === 1
                          ? 'You reacted'
                          : `You and ${likesCount - 1} ${likesCount - 1 === 1 ? 'other' : 'others'}`
                        : `${likesCount} ${likesCount === 1 ? 'reaction' : 'reactions'}`}
                    </span>
                  </>
                )}
              </div>

              <div className="modern-blog-card__summary-right">
                {totalCommentsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleCommentClick}
                    className="modern-blog-card__summary-link"
                  >
                    {totalCommentsCount} {totalCommentsCount === 1 ? 'comment' : 'comments'}
                  </button>
                )}
                {sharesCount > 0 && (
                  <span>
                    {sharesCount} {sharesCount === 1 ? 'share' : 'shares'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bottom Interactive Action Bar */}
          <div className="modern-blog-card__footer">
            <ReactionPicker
              liked={liked}
              reactionType={reactionType}
              likesCount={likesCount}
              onSelectReaction={(type) => performReactionUpdate(type)}
              onToggleDefault={() => performReactionUpdate(null)}
              size="small"
            />

            <button
              type="button"
              onClick={handleCommentClick}
              className="modern-blog-card__action-btn"
            >
              <CommentOutlined style={{ fontSize: '15px', color: '#6366f1' }} />
              <span>Comment</span>
              {totalCommentsCount > 0 && (
                <span className="modern-blog-card__action-count">{totalCommentsCount}</span>
              )}
            </button>

            <Popover
              content={shareMenuContent}
              trigger="click"
              placement="topRight"
              open={shareOpen}
              onOpenChange={setShareOpen}
              overlayInnerStyle={{
                borderRadius: '999px',
                padding: '4px 6px',
              }}
            >
              <button
                type="button"
                className={`modern-blog-card__action-btn ${shared ? 'is-shared' : ''}`}
              >
                <ShareAltOutlined style={{ fontSize: '15px' }} />
                <span>Share</span>
                {sharesCount > 0 && (
                  <span className="modern-blog-card__action-count">{sharesCount}</span>
                )}
              </button>
            </Popover>
          </div>
        </div>
      </article>

      {/* Threaded Comments & Replies Drawer */}
      <CommentsDrawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        blogId={blog._id}
        blogTitle={blog.title}
        blogAuthorId={blog.author?._id}
        comments={comments}
        onCommentsUpdated={(updated) => setComments(updated)}
      />

      <style>{`
        .modern-blog-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 10px 28px -10px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
          overflow: visible;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 410px;
          width: 100%;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
          position: relative;
        }
        .modern-blog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 22px 44px -12px rgba(15, 23, 42, 0.13), 0 4px 12px -2px rgba(79, 70, 229, 0.06);
          border-color: rgba(199, 210, 254, 0.9);
        }
        .modern-blog-card__media {
          position: relative;
          height: 210px;
          width: 100%;
          overflow: hidden;
          border-radius: 19px 19px 0 0;
          background: #0f172a;
        }
        .modern-blog-card__image-link {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
        }
        .modern-blog-card__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modern-blog-card:hover .modern-blog-card__image {
          transform: scale(1.05);
        }
        .modern-blog-card__image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.38) 0%,
            rgba(15, 23, 42, 0) 40%,
            rgba(15, 23, 42, 0.45) 100%
          );
          pointer-events: none;
        }
        .modern-blog-card__category {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
        }
        .modern-blog-card__category-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .modern-blog-card__bookmark {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(15, 23, 42, 0.68);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }
        .modern-blog-card__bookmark:hover {
          background: rgba(15, 23, 42, 0.85);
          transform: translateY(-1px);
        }
        .modern-blog-card__bookmark.is-bookmarked {
          background: rgba(15, 23, 42, 0.88);
          border-color: rgba(251, 191, 36, 0.55);
          color: #fde68a;
        }
        .modern-blog-card__schedule-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(180, 83, 9, 0.92);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
        }
        .modern-blog-card__photo-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.78);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
        }
        .modern-blog-card__body {
          padding: 18px 20px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .modern-blog-card__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
        }
        .modern-blog-card__meta-sep {
          color: #cbd5e1;
        }
        .modern-blog-card__readtime {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #4f46e5;
          background: #eef2ff;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
        }
        .modern-blog-card__title-link {
          text-decoration: none;
        }
        .modern-blog-card__title {
          font-size: 1.18rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.38;
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.18s ease;
        }
        .modern-blog-card__title-link:hover .modern-blog-card__title {
          color: #4f46e5;
        }
        .modern-blog-card__excerpt {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.58;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .modern-blog-card__tags {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .modern-blog-card__tag {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          padding: 2px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .modern-blog-card__tag:hover {
          border-color: #0f172a;
          background: #0f172a;
          color: #ffffff;
        }
        .modern-blog-card__tag-more {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
        }
        .modern-blog-card__author-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #f1f5f9;
          margin-bottom: 12px;
        }
        .modern-blog-card__author-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .modern-blog-card__author-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .modern-blog-card__author-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
        }
        .modern-blog-card__author-name:hover {
          color: #4f46e5;
        }
        .modern-blog-card__author-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .modern-blog-card__author-actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .modern-blog-card__follow-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #c7d2fe;
          background: #eef2ff;
          color: #4f46e5;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .modern-blog-card__follow-btn:hover {
          background: #4f46e5;
          color: #ffffff;
          border-color: #4f46e5;
        }
        .modern-blog-card__follow-btn.is-following {
          background: #ffffff;
          color: #475569;
          border-color: #cbd5e1;
        }
        .modern-blog-card__owner-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .modern-blog-card__icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.18s ease;
        }
        .modern-blog-card__icon-btn.is-edit {
          color: #6366f1;
        }
        .modern-blog-card__icon-btn.is-edit:hover {
          background: #eef2ff;
          border-color: #c7d2fe;
        }
        .modern-blog-card__icon-btn.is-delete {
          color: #ef4444;
        }
        .modern-blog-card__icon-btn.is-delete:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }
        .modern-blog-card__social-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px 10px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 8px;
          font-size: 11.5px;
          color: #64748b;
        }
        .modern-blog-card__reaction-stack {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .modern-blog-card__reaction-badges {
          display: inline-flex;
          align-items: center;
        }
        .modern-blog-card__reaction-mini {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          border: 1.5px solid #ffffff;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
        }
        .modern-blog-card__reaction-total {
          font-weight: 600;
          color: #475569;
        }
        .modern-blog-card__summary-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modern-blog-card__summary-link {
          border: none;
          background: transparent;
          padding: 0;
          color: #64748b;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .modern-blog-card__summary-link:hover {
          color: #4f46e5;
          text-decoration: underline;
        }
        .modern-blog-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          padding-top: 2px;
        }
        .modern-blog-card__action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .modern-blog-card__action-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .modern-blog-card__action-btn.is-shared {
          color: #059669;
          background: rgba(5, 150, 105, 0.08);
        }
        .modern-blog-card__action-count {
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          background: #f1f5f9;
          color: #475569;
        }
      `}</style>
    </>
  );
};

export default BlogCard;
