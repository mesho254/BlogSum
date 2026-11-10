import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import {
  Avatar,
  Tooltip,
  Skeleton,
  Popover,
  message,
} from 'antd';
import {
  CommentOutlined,
  BookOutlined,
  ShareAltOutlined,
  BookFilled,
  WhatsAppOutlined,
  MessageOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  AudioOutlined,
  PauseOutlined,
  CaretRightOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  StarFilled,
  StarOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { setLikeState, setBookmarkState, shareBlog } from '../Redux/actions';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactionPicker, {
  hasUserId,
  getUserReactionFromBlog,
  getTopReactions,
} from './ReactionPicker';
import AuthorHoverCard from './AuthorHoverCard';
import CommentsDrawer, {
  CommentsThreadContent,
  getTotalCommentsCount,
} from './CommentsDrawer';

const BlogDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const reduxLikes = useSelector((state) => state.likes || {});
  const reduxReactions = useSelector((state) => state.reactions || {});
  const reduxBookmarks = useSelector((state) => state.bookmarks || {});
  const reduxShares = useSelector((state) => state.shares || {});

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [railShareOpen, setRailShareOpen] = useState(false);
  const [speechState, setSpeechState] = useState('stopped');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const speechSynthesisRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const userId = user?._id || user?.id;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress =
        docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setScrollProgress(0);
    setActiveImageIdx(0);
    setSpeechState('stopped');
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, [id]);

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
    initialData: () => queryClient.getQueryData(['blogs'])?.find((b) => b._id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(['blogs'])?.dataUpdatedAt,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  const galleryImages = useMemo(() => {
    if (!blog) return [];
    const list =
      Array.isArray(blog.images) && blog.images.length > 0
        ? blog.images
        : blog.imageUrl
        ? [blog.imageUrl]
        : [];
    return Array.from(new Set([blog.imageUrl, ...list].filter(Boolean)));
  }, [blog]);

  const publishTime = blog?.publishDate || blog?.date;
  const isScheduledFuture = Boolean(
    publishTime && new Date(publishTime) > new Date()
  );
  const isDraft = blog?.status === 'draft';

  const authorId = blog?.author?._id;
  const isAuthor = Boolean(userId && authorId && String(userId) === String(authorId));
  const isAdmin = Boolean(
    user &&
      (user.roles === 'admin' ||
        String(user.username || '').trim().toLowerCase() === 'admin')
  );
  const canManage = Boolean(isAuthor || isAdmin);

  const handleToggleFeatured = async () => {
    if (!isAdmin || !blog) return;
    try {
      const { data } = await axiosInstance.put(`/api/admin/blogs/${blog._id}/status`, {
        isFeatured: !blog.isFeatured,
      });
      syncBlogDataEverywhere(data);
      message.success(
        data.isFeatured ? "Marked as Editor's Pick!" : "Removed from Editor's Picks"
      );
    } catch {
      message.error('Failed to update Featured status');
    }
  };

  const { data: isFollowing = false } = useQuery({
    queryKey: ['followState', authorId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/users/${authorId}/follow-state`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return Boolean(response.data.isFollowing);
    },
    enabled: Boolean(user?.token && authorId && !isAuthor),
    staleTime: 2 * 60 * 1000,
  });

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const endpoint = isFollowing
        ? `/api/users/${authorId}/unfollow`
        : `/api/users/${authorId}/follow`;
      await axiosInstance.put(endpoint, null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const next = !isFollowing;
      queryClient.setQueryData(['followState', authorId], next);
      queryClient.invalidateQueries({ queryKey: ['authorPreview', authorId] });
      message.success(
        next ? `Following ${blog.author?.username}` : `Unfollowed ${blog.author?.username}`
      );
    } catch {
      message.error('Could not update follow status');
    }
  };

  const liked = useMemo(() => {
    if (!blog) return false;
    if (typeof blog.userLiked === 'boolean') return blog.userLiked;
    if (userId && hasUserId(blog.likes, userId)) return true;
    if (userId && Array.isArray(blog.likes)) return false;
    return Boolean(reduxLikes[id]);
  }, [blog, userId, reduxLikes, id]);

  const reactionType = useMemo(() => {
    if (!blog || !liked) return null;
    return (
      getUserReactionFromBlog(blog, userId, reduxReactions[id]) ||
      reduxReactions[id] ||
      'love'
    );
  }, [blog, liked, userId, reduxReactions, id]);

  const bookmarked = useMemo(() => {
    if (!blog) return false;
    if (typeof blog.userBookmarked === 'boolean') return blog.userBookmarked;
    if (userId && hasUserId(blog.bookmarks, userId)) return true;
    if (userId && Array.isArray(blog.bookmarks)) return false;
    return Boolean(reduxBookmarks[id]);
  }, [blog, userId, reduxBookmarks, id]);

  const likesCount = blog?.likes?.length || 0;
  const bookmarkCount = blog?.bookmarks?.length || 0;
  const sharesCount = blog?.shares?.length || reduxShares[id] || 0;
  const totalCommentsCount = useMemo(
    () => getTotalCommentsCount(blog?.comments || []),
    [blog?.comments]
  );

  const topReactions = useMemo(
    () => getTopReactions(blog, liked ? reactionType || 'love' : null),
    [blog, liked, reactionType]
  );

  const relatedBlogs = useMemo(() => {
    const allBlogs = queryClient.getQueryData(['blogs']) || [];
    return allBlogs
      .filter((b) => String(b._id) !== String(id))
      .sort((a, b) => (a.category === blog?.category ? -1 : 1))
      .slice(0, 3);
  }, [blog?.category, id, queryClient]);

  const syncBlogDataEverywhere = (updatedBlog) => {
    const mergeList = (old) =>
      Array.isArray(old)
        ? old.map((b) => (String(b._id) === String(id) ? { ...b, ...updatedBlog } : b))
        : old;
    queryClient.setQueryData(['blog', id], (old) =>
      old ? { ...old, ...updatedBlog } : updatedBlog
    );
    queryClient.setQueryData(['blogs'], mergeList);
    queryClient.setQueryData(['postedBlogs'], mergeList);
    if (authorId) {
      queryClient.setQueryData(['otherBlogs', authorId], mergeList);
    }
  };

  const handleReactionUpdate = async (chosenReactionType = null) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const prevBlog = blog;
    const prevLiked = liked;
    const prevReaction = reactionType;

    let optimisticLiked;
    let optimisticReaction;

    if (chosenReactionType) {
      if (prevLiked && prevReaction === chosenReactionType) {
        optimisticLiked = false;
        optimisticReaction = null;
      } else {
        optimisticLiked = true;
        optimisticReaction = chosenReactionType;
      }
    } else {
      optimisticLiked = !prevLiked;
      optimisticReaction = optimisticLiked ? 'love' : null;
    }

    const currentLikes = Array.isArray(blog.likes) ? [...blog.likes] : [];
    const nextLikes = optimisticLiked
      ? hasUserId(currentLikes, userId)
        ? currentLikes
        : [...currentLikes, userId]
      : currentLikes.filter((u) => String(u?._id || u) !== String(userId));

    dispatch(setLikeState(id, optimisticLiked, optimisticReaction));
    syncBlogDataEverywhere({
      likes: nextLikes,
      userLiked: optimisticLiked,
      userReaction: optimisticReaction,
    });

    try {
      const payload = chosenReactionType ? { reactionType: chosenReactionType } : {};
      const response = await axiosInstance.put(`/api/blogs/${id}/like`, payload);
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

      dispatch(setLikeState(id, confirmedLiked, confirmedReaction));
      syncBlogDataEverywhere({
        ...serverData,
        userLiked: confirmedLiked,
        userReaction: confirmedReaction,
      });
    } catch {
      dispatch(setLikeState(id, prevLiked, prevReaction));
      if (prevBlog) syncBlogDataEverywhere(prevBlog);
      message.error('Failed to update reaction');
    }
  };

  const handleBookmarkClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const prevBookmarked = bookmarked;
    const nextBookmarked = !prevBookmarked;

    dispatch(setBookmarkState(id, nextBookmarked));
    try {
      const response = await axiosInstance.put(`/api/blogs/${id}/bookmark`);
      const serverData = response.data;
      const confirmedBookmarked =
        typeof serverData.userBookmarked === 'boolean'
          ? serverData.userBookmarked
          : hasUserId(serverData.bookmarks, userId);

      dispatch(setBookmarkState(id, confirmedBookmarked));
      syncBlogDataEverywhere({
        ...serverData,
        userBookmarked: confirmedBookmarked,
      });
      message.success(confirmedBookmarked ? 'Saved to reading list' : 'Removed from reading list');
    } catch {
      dispatch(setBookmarkState(id, prevBookmarked));
      message.error('Failed to bookmark article');
    }
  };

  const ShareBlog = async (platform) => {
    const blogUrl = `${window.location.origin}/blog/${id}`;
    setShareOpen(false);
    setRailShareOpen(false);

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(blogUrl);
        message.success('Link copied');
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

    dispatch(shareBlog(id));
    if (user) {
      try {
        const response = await axiosInstance.put(`/api/blogs/${id}/share`);
        syncBlogDataEverywhere(response.data);
      } catch (err) {
        console.error('Error recording share:', err);
      }
    }
  };

  const handleVoiceClick = () => {
    if (!window.speechSynthesis) {
      message.warning("Your browser doesn't support text-to-speech.");
      return;
    }

    if (speechState === 'playing') {
      speechSynthesisRef.current.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      speechSynthesisRef.current.resume();
      setSpeechState('playing');
    } else if (blog) {
      const text = `${blog.title}. ${blog.content.replace(/<[^>]+>/g, ' ')}`;
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = 1;

      utteranceRef.current = speech;
      speechSynthesisRef.current.speak(speech);
      setSpeechState('playing');

      speech.onend = () => setSpeechState('stopped');
      speech.onerror = () => setSpeechState('stopped');
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '140px 24px', maxWidth: '720px', margin: '0 auto' }}>
          <Skeleton active avatar paragraph={{ rows: 10 }} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '160px 24px', textAlign: 'center' }}>
          <p style={{ color: '#111827', fontSize: '16px' }}>
            Unable to load article: {error?.message || 'Something went wrong'}
          </p>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const shareMenuContent = (
    <div className="ed-share-popover">
      <button type="button" onClick={() => ShareBlog('copy')} className="ed-share-item">
        <CopyOutlined /> <span>Copy link</span>
      </button>
      <button type="button" onClick={() => ShareBlog('twitter')} className="ed-share-item">
        <TwitterOutlined /> <span>Share on X</span>
      </button>
      <button type="button" onClick={() => ShareBlog('linkedin')} className="ed-share-item">
        <LinkedinOutlined /> <span>Share on LinkedIn</span>
      </button>
      <button type="button" onClick={() => ShareBlog('whatsapp')} className="ed-share-item">
        <WhatsAppOutlined /> <span>WhatsApp</span>
      </button>
      <button type="button" onClick={() => ShareBlog('message')} className="ed-share-item">
        <MessageOutlined /> <span>Message</span>
      </button>
    </div>
  );

  return (
    <div className="ed-article-page">
      {/* Hairline Top Reading Progress */}
      <div className="ed-progress-line" style={{ width: `${scrollProgress}%` }} />

      <Navbar />

      <article className="ed-article-wrapper">
        {/* Centered Editorial Header Column (740px) */}
        <header className="ed-header-col">
          {(isScheduledFuture || isDraft) && (
            <div className="ed-status-banner">
              <div className="ed-status-banner__info">
                <ClockCircleOutlined />
                <span>
                  {isDraft
                    ? 'Draft · Only visible to you on your profile'
                    : `Scheduled · Will publish publicly on ${moment(publishTime).format('ddd, MMM D, YYYY [at] h:mm A')}`}
                </span>
              </div>
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => navigate(`/edit/${blog._id}`)}
                  className="ed-status-banner__btn"
                >
                  Edit / Reschedule
                </button>
              )}
            </div>
          )}

          {/* Top Kicker Row */}
          <div className="ed-kicker-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="ed-back-link"
            >
              <ArrowLeftOutlined style={{ fontSize: '11px' }} />
              <span>All Stories</span>
            </button>

            <div className="ed-kicker-meta">
              {blog.category && (
                <span className="ed-kicker-category">{blog.category}</span>
              )}
              <span className="ed-kicker-dot">·</span>
              <span>{moment(publishTime).format('MMMM D, YYYY')}</span>
              <span className="ed-kicker-dot">·</span>
              <span>{blog.readTime} min read</span>
            </div>
          </div>

          {/* Statement Editorial Title */}
          <h1 className="ed-title">{blog.title}</h1>

          {blog.subtitle && (
            <p className="ed-subtitle">{blog.subtitle}</p>
          )}

          {/* Minimalist Hairline Author & Action Bar */}
          <div className="ed-byline-bar">
            <div className="ed-byline-left">
              <AuthorHoverCard author={blog.author} isFollowing={isFollowing}>
                <Link to={`/profile/${blog.author?._id}`} className="ed-avatar-link">
                  <Avatar
                    src={blog.author?.profilePicture}
                    size={42}
                    style={{
                      backgroundColor: '#111827',
                      fontWeight: 600,
                    }}
                  >
                    {blog.author?.username?.[0]?.toUpperCase()}
                  </Avatar>
                </Link>
              </AuthorHoverCard>

              <div className="ed-byline-text">
                <div className="ed-byline-name-line">
                  <AuthorHoverCard author={blog.author} isFollowing={isFollowing}>
                    <Link
                      to={`/profile/${blog.author?._id}`}
                      className="ed-author-name"
                    >
                      {isAuthor ? blog.author?.username || 'You' : blog.author?.username}
                      {blog.author?.isVerified && (
                        <CheckCircleFilled
                          style={{ color: '#2563eb', fontSize: 13, marginLeft: 5 }}
                          title="Verified Writer"
                        />
                      )}
                    </Link>
                  </AuthorHoverCard>

                  {!isAuthor && user && authorId && (
                    <>
                      <span className="ed-kicker-dot">·</span>
                      <button
                        type="button"
                        onClick={handleToggleFollow}
                        className="ed-follow-link"
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </>
                  )}
                </div>
                <div className="ed-byline-sub">
                  {isAuthor ? 'Published by you' : 'Editorial Contributor'} ·{' '}
                  {moment(blog.date).fromNow()}
                </div>
              </div>
            </div>

            {/* Clean Minimal Utility Strip */}
            <div className="ed-byline-actions">
              <ReactionPicker
                liked={liked}
                reactionType={reactionType}
                likesCount={likesCount}
                onSelectReaction={(type) => handleReactionUpdate(type)}
                onToggleDefault={() => handleReactionUpdate(null)}
                size="small"
              />

              <Tooltip title="Discussion">
                <button
                  type="button"
                  onClick={() => setDrawerVisible(true)}
                  className="ed-util-btn"
                >
                  <CommentOutlined />
                  {totalCommentsCount > 0 && <span>{totalCommentsCount}</span>}
                </button>
              </Tooltip>

              <Tooltip
                title={
                  speechState === 'playing'
                    ? 'Pause audio'
                    : speechState === 'paused'
                    ? 'Resume audio'
                    : 'Listen to article'
                }
              >
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className={`ed-util-btn ${speechState === 'playing' ? 'is-active' : ''}`}
                >
                  {speechState === 'playing' ? (
                    <PauseOutlined />
                  ) : speechState === 'paused' ? (
                    <CaretRightOutlined />
                  ) : (
                    <AudioOutlined />
                  )}
                  <span className="ed-util-btn__label">
                    {speechState === 'playing'
                      ? 'Listening'
                      : speechState === 'paused'
                      ? 'Paused'
                      : 'Listen'}
                  </span>
                </button>
              </Tooltip>

              <Tooltip title={bookmarked ? 'Saved' : 'Save'}>
                <button
                  type="button"
                  onClick={handleBookmarkClick}
                  className={`ed-util-btn ${bookmarked ? 'is-active' : ''}`}
                >
                  {bookmarked ? <BookFilled /> : <BookOutlined />}
                </button>
              </Tooltip>

              <Popover
                content={shareMenuContent}
                trigger="click"
                placement="bottomRight"
                open={shareOpen}
                onOpenChange={setShareOpen}
              >
                <button type="button" className="ed-util-btn" title="Share">
                  <ShareAltOutlined />
                </button>
              </Popover>

              {isAdmin && (
                <Tooltip
                  title={
                    blog.isFeatured
                      ? "Remove from Editor's Picks (Admin)"
                      : "Mark as Editor's Pick (Admin)"
                  }
                >
                  <button
                    type="button"
                    onClick={handleToggleFeatured}
                    className={`ed-util-btn ${blog.isFeatured ? 'is-active' : ''}`}
                    style={
                      blog.isFeatured
                        ? { color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }
                        : undefined
                    }
                  >
                    {blog.isFeatured ? <StarFilled /> : <StarOutlined />}
                  </button>
                </Tooltip>
              )}

              {canManage && (
                <Tooltip title={isAuthor ? 'Edit story' : 'Edit story (Admin)'}>
                  <button
                    type="button"
                    onClick={() => navigate(`/edit/${blog._id}`)}
                    className="ed-util-btn"
                  >
                    <EditOutlined />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </header>

        {/* Wide Breakout Editorial Cover Figure / Multi-Image Slider (1040px) */}
        {galleryImages.length > 0 && (
          <figure className="ed-wide-figure">
            <div className="ed-slider-stage">
              <img
                src={galleryImages[activeImageIdx] || galleryImages[0]}
                alt={`${blog.title} - Slide ${activeImageIdx + 1}`}
                className="ed-wide-image"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="ed-slider-arrow ed-slider-arrow--prev"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === 0 ? galleryImages.length - 1 : prev - 1
                      )
                    }
                    aria-label="Previous image"
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    type="button"
                    className="ed-slider-arrow ed-slider-arrow--next"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === galleryImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="Next image"
                  >
                    <RightOutlined />
                  </button>

                  <div className="ed-slider-counter">
                    {activeImageIdx + 1} / {galleryImages.length}
                  </div>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="ed-slider-thumbs">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`ed-slider-thumb ${
                      activeImageIdx === idx ? 'is-active' : ''
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                    {idx === 0 && (
                      <span className="ed-slider-thumb__badge">Cover</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </figure>
        )}

        {/* Two-Column Editorial Reading Grid: Left Sticky Rail + 680px Prose Column */}
        <div className="ed-reading-grid">
          <aside className="ed-left-rail">
            <div className="ed-left-rail__sticky">
              <ReactionPicker
                liked={liked}
                reactionType={reactionType}
                likesCount={likesCount}
                onSelectReaction={(type) => handleReactionUpdate(type)}
                onToggleDefault={() => handleReactionUpdate(null)}
                size="small"
              />

              <button
                type="button"
                onClick={() => setDrawerVisible(true)}
                className="ed-rail-btn"
                title="Comments"
              >
                <CommentOutlined />
                <span>{totalCommentsCount}</span>
              </button>

              <button
                type="button"
                onClick={handleBookmarkClick}
                className={`ed-rail-btn ${bookmarked ? 'is-active' : ''}`}
                title={bookmarked ? 'Saved' : 'Save'}
              >
                {bookmarked ? <BookFilled /> : <BookOutlined />}
                {bookmarkCount > 0 && <span>{bookmarkCount}</span>}
              </button>

              <Popover
                content={shareMenuContent}
                trigger="click"
                placement="right"
                open={railShareOpen}
                onOpenChange={setRailShareOpen}
              >
                <button type="button" className="ed-rail-btn" title="Share">
                  <ShareAltOutlined />
                </button>
              </Popover>
            </div>
          </aside>

          {/* Focused 680px Prose Column */}
          <div className="ed-prose-col">
            <div
              dangerouslySetInnerHTML={{ __html: blog.content }}
              className="ed-prose-content"
            />

            {Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div className="ed-article-tags">
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/?tag=${encodeURIComponent(tag)}`}
                    className="ed-article-tag"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* End-of-Article Reaction & Share Strip */}
            <div className="ed-article-footer-bar">
              <div className="ed-article-footer-bar__left">
                <ReactionPicker
                  liked={liked}
                  reactionType={reactionType}
                  likesCount={likesCount}
                  onSelectReaction={(type) => handleReactionUpdate(type)}
                  onToggleDefault={() => handleReactionUpdate(null)}
                />
                {likesCount > 0 && topReactions.length > 1 && (
                  <div className="ed-reaction-summary">
                    {topReactions.map((r) => (
                      <span key={r.key} title={r.label}>
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="ed-article-footer-bar__right">
                <button
                  type="button"
                  onClick={() => setDrawerVisible(true)}
                  className="ed-footer-text-btn"
                >
                  <CommentOutlined />
                  <span>{totalCommentsCount} Responses</span>
                </button>
                <button
                  type="button"
                  onClick={handleBookmarkClick}
                  className="ed-footer-text-btn"
                >
                  {bookmarked ? <BookFilled /> : <BookOutlined />}
                  <span>{bookmarked ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => ShareBlog('copy')}
                  className="ed-footer-text-btn"
                >
                  <CopyOutlined />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            {/* Minimalist Editorial Author Sign-off */}
            <div className="ed-author-signoff">
              <AuthorHoverCard author={blog.author} isFollowing={isFollowing}>
                <Link to={`/profile/${blog.author?._id}`}>
                  <Avatar
                    src={blog.author?.profilePicture}
                    size={56}
                    style={{ backgroundColor: '#111827', fontWeight: 600 }}
                  >
                    {blog.author?.username?.[0]?.toUpperCase()}
                  </Avatar>
                </Link>
              </AuthorHoverCard>
              <div className="ed-author-signoff__body">
                <div className="ed-author-signoff__top">
                  <div>
                    <span className="ed-author-signoff__label">Written by</span>
                    <AuthorHoverCard author={blog.author} isFollowing={isFollowing}>
                      <Link
                        to={`/profile/${blog.author?._id}`}
                        className="ed-author-signoff__name"
                      >
                        {blog.author?.username || 'Author'}
                      </Link>
                    </AuthorHoverCard>
                  </div>
                  {!isAuthor && user && authorId && (
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      className={`ed-signoff-follow-btn ${
                        isFollowing ? 'is-following' : ''
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
                <p className="ed-author-signoff__bio">
                   Exploring ideas in {blog.category || 'technology and culture'}. Follow for new essays and perspectives.
                </p>
              </div>
            </div>

            {/* Clean Inline Responses Section */}
            <section className="ed-responses-section">
              <h3 className="ed-responses-heading">
                Responses ({totalCommentsCount})
              </h3>
              <CommentsThreadContent
                blogId={blog._id}
                blogAuthorId={blog.author?._id}
                comments={blog.comments || []}
              />
            </section>
          </div>
        </div>

        {/* Minimalist More to Read Grid */}
        {relatedBlogs.length > 0 && (
          <section className="ed-more-section">
            <div className="ed-more-header">
              <span>More from BlogSum</span>
              <Link to="/" className="ed-more-all">
                View archive →
              </Link>
            </div>
            <div className="ed-more-grid">
              {relatedBlogs.map((item) => (
                <Link
                  key={item._id}
                  to={`/blog/${item._id}`}
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
                  className="ed-more-item"
                >
                  <div className="ed-more-item__img-wrap">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="ed-more-item__img"
                    />
                  </div>
                  <div className="ed-more-item__meta">
                    <span>{item.category}</span>
                    <span>·</span>
                    <span>{item.readTime} min read</span>
                  </div>
                  <h4 className="ed-more-item__title">{item.title}</h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <CommentsDrawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        blogId={blog._id}
        blogTitle={blog.title}
        blogAuthorId={blog.author?._id}
        comments={blog.comments || []}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .ed-article-page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .ed-progress-line {
          position: fixed;
          top: 0;
          left: 0;
          height: 2px;
          background: #111827;
          z-index: 2000;
          transition: width 0.1s linear;
        }
        .ed-article-wrapper {
          padding-top: 112px;
          padding-bottom: 96px;
        }
        .ed-header-col {
          max-width: 740px;
          width: 92%;
          margin: 0 auto;
        }
        .ed-kicker-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }
        .ed-back-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: none;
          background: transparent;
          padding: 0;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .ed-back-link:hover {
          color: #111827;
        }
        .ed-kicker-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b7280;
        }
        .ed-kicker-category {
          color: #111827;
          font-weight: 700;
        }
        .ed-kicker-dot {
          color: #9ca3af;
        }
        .ed-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2.35rem, 4.6vw, 3.5rem);
          font-weight: 500;
          color: #111827;
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 18px;
        }
        .ed-subtitle {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(1.18rem, 2.2vw, 1.42rem);
          font-weight: 400;
          color: #4b5563;
          line-height: 1.48;
          margin: 0 0 26px;
        }
        .ed-status-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
        .ed-status-banner__info {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ed-status-banner__btn {
          border: 1px solid #111827;
          background: #ffffff;
          color: #111827;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-status-banner__btn:hover {
          background: #111827;
          color: #ffffff;
        }
        .ed-byline-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 36px;
        }
        .ed-byline-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ed-byline-name-line {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ed-author-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          text-decoration: none;
        }
        .ed-author-name:hover {
          text-decoration: underline;
        }
        .ed-follow-link {
          border: none;
          background: transparent;
          padding: 0;
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
          cursor: pointer;
        }
        .ed-follow-link:hover {
          text-decoration: underline;
        }
        .ed-byline-sub {
          font-size: 12.5px;
          color: #6b7280;
          margin-top: 2px;
        }
        .ed-byline-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ed-util-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
        }
        .ed-util-btn:hover {
          color: #111827;
          background: #f3f4f6;
        }
        .ed-util-btn.is-active {
          color: #111827;
          background: #f3f4f6;
          font-weight: 600;
        }
        .ed-util-btn__label {
          font-size: 12.5px;
        }
        .ed-wide-figure {
          max-width: 1020px;
          width: 94%;
          margin: 0 auto 48px;
        }
        .ed-slider-stage {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f4f6;
        }
        .ed-wide-image {
          width: 100%;
          max-height: 540px;
          object-fit: cover;
          border-radius: 12px;
          display: block;
          background: #f3f4f6;
          transition: opacity 0.25s ease;
        }
        .ed-slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(17, 24, 39, 0.72);
          backdrop-filter: blur(6px);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.15s ease;
          z-index: 5;
        }
        .ed-slider-arrow:hover {
          background: #111827;
          transform: translateY(-50%) scale(1.06);
        }
        .ed-slider-arrow--prev {
          left: 16px;
        }
        .ed-slider-arrow--next {
          right: 16px;
        }
        .ed-slider-counter {
          position: absolute;
          bottom: 14px;
          right: 16px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.78);
          backdrop-filter: blur(6px);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .ed-slider-thumbs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .ed-slider-thumb {
          position: relative;
          width: 76px;
          height: 50px;
          border-radius: 7px;
          overflow: hidden;
          border: 2px solid transparent;
          padding: 0;
          background: #f3f4f6;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.15s ease;
        }
        .ed-slider-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ed-slider-thumb:hover {
          opacity: 0.9;
        }
        .ed-slider-thumb.is-active {
          opacity: 1;
          border-color: #111827;
        }
        .ed-slider-thumb__badge {
          position: absolute;
          bottom: 3px;
          left: 4px;
          padding: 1px 5px;
          border-radius: 4px;
          background: rgba(17, 24, 39, 0.82);
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ed-reading-grid {
          max-width: 960px;
          width: 92%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 64px minmax(0, 680px);
          gap: 48px;
          justify-content: center;
        }
        @media (max-width: 900px) {
          .ed-reading-grid {
            grid-template-columns: minmax(0, 680px);
          }
          .ed-left-rail {
            display: none;
          }
        }
        .ed-left-rail {
          position: relative;
        }
        .ed-left-rail__sticky {
          position: sticky;
          top: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .ed-rail-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-rail-btn span {
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          margin-top: 2px;
        }
        .ed-rail-btn:hover {
          border-color: #111827;
          color: #111827;
        }
        .ed-rail-btn.is-active {
          border-color: #111827;
          color: #111827;
          background: #f9fafb;
        }
        .ed-prose-col {
          max-width: 680px;
          width: 100%;
        }
        .ed-prose-content {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.22rem;
          line-height: 1.78;
          color: #1f2937;
          letter-spacing: -0.003em;
        }
        .ed-prose-content > p:first-of-type::first-letter {
          float: left;
          font-size: 3.4rem;
          line-height: 0.88;
          padding-right: 10px;
          padding-top: 4px;
          font-weight: 500;
          color: #111827;
        }
        .ed-prose-content p {
          margin-bottom: 1.45em;
        }
        .ed-prose-content h1,
        .ed-prose-content h2,
        .ed-prose-content h3 {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          color: #111827;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-top: 1.8em;
          margin-bottom: 0.6em;
          line-height: 1.25;
        }
        .ed-prose-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 24px 0;
        }
        .ed-prose-content blockquote {
          margin: 28px 0;
          padding-left: 20px;
          border-left: 2px solid #111827;
          font-style: italic;
          color: #374151;
          font-size: 1.3rem;
        }
        .ed-article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 36px;
        }
        .ed-article-tag {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .ed-article-tag:hover {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }
        .ed-article-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 48px;
          padding: 18px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }
        .ed-article-footer-bar__left,
        .ed-article-footer-bar__right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ed-reaction-summary {
          display: inline-flex;
          gap: 4px;
          font-size: 14px;
        }
        .ed-footer-text-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .ed-footer-text-btn:hover {
          color: #111827;
          background: #f3f4f6;
        }
        .ed-author-signoff {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 36px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .ed-author-signoff__body {
          flex: 1;
        }
        .ed-author-signoff__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ed-author-signoff__label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .ed-author-signoff__name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          text-decoration: none;
        }
        .ed-author-signoff__bio {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
          margin: 8px 0 0;
        }
        .ed-signoff-follow-btn {
          padding: 7px 18px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-signoff-follow-btn.is-following {
          background: transparent;
          color: #111827;
        }
        .ed-responses-section {
          padding-top: 40px;
        }
        .ed-responses-heading {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 24px;
          letter-spacing: -0.015em;
        }
        .ed-more-section {
          max-width: 1020px;
          width: 92%;
          margin: 72px auto 0;
          padding-top: 40px;
          border-top: 1px solid #e5e7eb;
        }
        .ed-more-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #111827;
        }
        .ed-more-all {
          color: #6b7280;
          text-decoration: none;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
        }
        .ed-more-all:hover {
          color: #111827;
        }
        .ed-more-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 28px;
        }
        .ed-more-item {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }
        .ed-more-item__img-wrap {
          overflow: hidden;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #f3f4f6;
          aspect-ratio: 16 / 10;
        }
        .ed-more-item__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }
        .ed-more-item:hover .ed-more-item__img {
          transform: scale(1.03);
        }
        .ed-more-item__meta {
          display: flex;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .ed-more-item__title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: #111827;
          margin: 0;
          line-height: 1.3;
        }
        .ed-more-item:hover .ed-more-item__title {
          text-decoration: underline;
        }
        .ed-share-popover {
          display: flex;
          flex-direction: column;
          min-width: 160px;
        }
        .ed-share-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          text-align: left;
        }
        .ed-share-item:hover {
          background: #f3f4f6;
          color: #111827;
        }

        /* Wide screen responsive expansion (23" & 27" monitors) */
        @media (min-width: 1536px) {
          .ed-header-col {
            max-width: 880px;
          }
          .ed-wide-figure {
            max-width: 1380px;
          }
          .ed-wide-image {
            max-height: 620px;
          }
          .ed-reading-grid {
            max-width: 1120px;
            grid-template-columns: 64px minmax(0, 780px);
            gap: 56px;
          }
          .ed-more-section {
            max-width: 1380px;
          }
        }
        @media (min-width: 1920px) {
          .ed-header-col {
            max-width: 980px;
          }
          .ed-wide-figure {
            max-width: 1540px;
            width: 95%;
          }
          .ed-wide-image {
            max-height: 680px;
          }
          .ed-reading-grid {
            max-width: 1220px;
            grid-template-columns: 72px minmax(0, 840px);
            gap: 64px;
          }
          .ed-more-section {
            max-width: 1540px;
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default BlogDetail;
