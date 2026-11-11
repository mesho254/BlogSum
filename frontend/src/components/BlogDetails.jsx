import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import axiosInstance from '../axiosConfig';
import {
  Avatar,
  Tooltip,
  Skeleton,
  Popover,
  Modal,
  Input,
  Button,
  message,
  Spin,
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
  ArrowRightOutlined,
  CopyOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  StarFilled,
  StarOutlined,
  CheckCircleFilled,
  CoffeeOutlined,
  HighlightOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { setLikeState, setBookmarkState, shareBlog } from '../Redux/actions';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext';
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

  const { socket } = useSocket() || {};
  const [liveReaders, setLiveReaders] = useState(1);
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [customTip, setCustomTip] = useState('');
  const [tipNote, setTipNote] = useState('');
  const [tipSubmitted, setTipSubmitted] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [tipProcessing, setTipProcessing] = useState(false);
  const [tipCaptureData, setTipCaptureData] = useState(null);
  const paypalBtnContainerRef = useRef(null);

  const tipAmountRef = useRef(tipAmount);
  const tipCustomRef = useRef(customTip);
  const tipNoteRef = useRef(tipNote);

  useEffect(() => {
    tipAmountRef.current = tipAmount;
  }, [tipAmount]);

  useEffect(() => {
    tipCustomRef.current = customTip;
  }, [customTip]);

  useEffect(() => {
    tipNoteRef.current = tipNote;
  }, [tipNote]);

  // Dynamically load PayPal SDK script
  useEffect(() => {
    if (!tipModalVisible) return;

    const clientId =
      import.meta.env.VITE_PAYPAL_CLIENT_ID ||
      'Ad7HnVMa1NyvuhbrxhPJLXVzpR_pVxd_f8kcr9EK1Kk_GPF-KvMjFSqo2iZysM8JHNa0Wrr-pn5YdQQx';

    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    setPaypalLoading(true);
    const scriptId = 'paypal-js-sdk';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&enable-funding=card`;
      script.async = true;
      script.onload = () => {
        setPaypalLoaded(true);
        setPaypalLoading(false);
      };
      script.onerror = () => {
        console.error('Failed to load PayPal SDK script');
        setPaypalLoading(false);
      };
      document.body.appendChild(script);
    } else {
      setPaypalLoaded(true);
      setPaypalLoading(false);
    }
  }, [tipModalVisible]);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectionToolbar, setSelectionToolbar] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [highlightedSnippets, setHighlightedSnippets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`blogsum_highlights_${id}`)) || [];
    } catch {
      return [];
    }
  });

  // Real-time reader presence
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('joinStory', id);
    const handlePresence = ({ storyId, count }) => {
      if (String(storyId) === String(id)) {
        setLiveReaders(Math.max(1, count));
      }
    };
    socket.on('storyPresence', handlePresence);
    return () => {
      socket.emit('leaveStory', id);
      socket.off('storyPresence', handlePresence);
    };
  }, [socket, id]);

  const handleTextMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim();
    if (selectedText && selectedText.length >= 4) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionToolbar({
          visible: true,
          x: Math.max(10, rect.left + rect.width / 2),
          y: rect.top + window.scrollY - 44,
          text: selectedText,
        });
      } catch {
        setSelectionToolbar((prev) => ({ ...prev, visible: false }));
      }
    } else {
      setSelectionToolbar((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleApplyHighlight = () => {
    if (!selectionToolbar.text) return;
    const updated = [...highlightedSnippets, selectionToolbar.text];
    setHighlightedSnippets(updated);
    try {
      localStorage.setItem(`blogsum_highlights_${id}`, JSON.stringify(updated));
    } catch {}
    message.success('Quote highlighted and saved to your reading notebook!');
    setSelectionToolbar((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  const handleQuoteInComment = () => {
    if (!selectionToolbar.text) return;
    setDrawerVisible(true);
    message.info('Quote referenced in responses!');
    setSelectionToolbar((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  const handleCopyQuote = () => {
    if (!selectionToolbar.text) return;
    const textToCopy = `"${selectionToolbar.text}" — ${blog?.title || 'BlogSum'}\n${window.location.href}`;
    navigator.clipboard?.writeText(textToCopy);
    message.success('Quote copied to clipboard!');
    setSelectionToolbar((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  const changePlaybackRate = (newRate) => {
    setPlaybackRate(newRate);
    if (speechState === 'playing' || speechState === 'paused') {
      speechSynthesisRef.current?.cancel();
      const text = `${blog?.title || ''}. ${(blog?.content || '').replace(/<[^>]+>/g, ' ')}`;
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = newRate;
      utteranceRef.current = speech;
      speechSynthesisRef.current?.speak(speech);
      setSpeechState('playing');
      speech.onend = () => setSpeechState('stopped');
      speech.onerror = () => setSpeechState('stopped');
    }
  };

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

  // Render PayPal buttons into modal
  useEffect(() => {
    if (
      !tipModalVisible ||
      !paypalLoaded ||
      !window.paypal ||
      !paypalBtnContainerRef.current ||
      tipSubmitted
    ) {
      return;
    }

    paypalBtnContainerRef.current.innerHTML = '';

    try {
      window.paypal
        .Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 42,
          },
          createOrder: async () => {
            const rawCustom = parseFloat(tipCustomRef.current);
            const effectiveAmount =
              !isNaN(rawCustom) && rawCustom > 0 ? rawCustom : tipAmountRef.current || 5;

            const res = await axiosInstance.post('/api/tips/paypal/create-order', {
              amount: effectiveAmount,
              blogId: id,
              tierName:
                tipCustomRef.current && !isNaN(rawCustom)
                  ? 'Custom'
                  : tipAmountRef.current === 2
                  ? 'Espresso'
                  : tipAmountRef.current === 5
                  ? 'Cappuccino'
                  : 'Artisan Roast',
              note: tipNoteRef.current,
              senderName: user ? user.username : 'Generous Reader',
            });

            return res.data.orderId;
          },
          onApprove: async (data) => {
            setTipProcessing(true);
            try {
              const res = await axiosInstance.post('/api/tips/paypal/capture-order', {
                orderId: data.orderID,
                blogId: id,
                note: tipNoteRef.current,
              });

              setTipSubmitted(true);
              setTipCaptureData(res.data.tip);
              message.success('Thank you! Your tip was safely received via PayPal.');
            } catch (err) {
              console.error('PayPal capture error:', err);
              message.error(err.response?.data?.error || 'PayPal payment capture failed');
            } finally {
              setTipProcessing(false);
            }
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            message.error('An error occurred during PayPal checkout.');
          },
        })
        .render(paypalBtnContainerRef.current);
    } catch (renderErr) {
      console.error('Error rendering PayPal Buttons:', renderErr);
    }
  }, [tipModalVisible, paypalLoaded, tipSubmitted, id]);

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

  const { data: seriesData } = useQuery({
    queryKey: ['seriesByBlog', id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/series/by-blog/${id}`);
      return response.data?.series ? response.data : null;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (blog?.title) {
      document.title = `${blog.title} — BlogSum`;

      const setMetaTag = (attr, key, content) => {
        if (!content) return;
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      const plainTextExcerpt = (blog.subtitle || blog.content || '').replace(/<[^>]*>/g, '').slice(0, 160);
      const coverImage = blog.imageUrl || (blog.images && blog.images[0]) || '';

      setMetaTag('property', 'og:title', blog.title);
      setMetaTag('property', 'og:description', plainTextExcerpt);
      setMetaTag('property', 'og:type', 'article');
      if (coverImage) setMetaTag('property', 'og:image', coverImage);

      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:title', blog.title);
      setMetaTag('name', 'twitter:description', plainTextExcerpt);
      if (coverImage) setMetaTag('name', 'twitter:image', coverImage);
    }
  }, [blog]);

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
              <span className="ed-kicker-dot">·</span>
              <span className="ed-live-presence">
                <span className="ed-live-presence__dot" />
                <span>{liveReaders} reading</span>
              </span>
            </div>
          </div>

          {/* Series Ribbon Banner */}
          {seriesData?.series && (
            <div className="ed-series-ribbon">
              <div className="ed-series-ribbon__tag">
                <BookOutlined style={{ marginRight: 6 }} />
                <span>PART {seriesData.currentPart} OF {seriesData.totalParts}</span>
              </div>
              <Link
                to={`/series/${seriesData.series.slug || seriesData.series._id}`}
                className="ed-series-ribbon__title"
              >
                <span>{seriesData.series.title}</span>
                <ArrowRightOutlined style={{ marginLeft: 6, fontSize: 11 }} />
              </Link>
            </div>
          )}

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

              {!isAuthor && (
                <Tooltip title="Send a micro-tip to the author">
                  <button
                    type="button"
                    onClick={() => {
                      setTipModalVisible(true);
                      setTipSubmitted(false);
                    }}
                    className="ed-util-btn ed-tip-btn"
                  >
                    <CoffeeOutlined style={{ color: '#d97706' }} />
                    <span className="ed-util-btn__label">Tip</span>
                  </button>
                </Tooltip>
              )}

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
          <div className="ed-prose-col" onMouseUp={handleTextMouseUp}>
            {/* Medium-style Floating Inline Highlighting & Quote Toolbar */}
            {selectionToolbar.visible && (
              <div
                className="ed-selection-toolbar"
                style={{
                  position: 'absolute',
                  left: selectionToolbar.x,
                  top: selectionToolbar.y,
                  transform: 'translateX(-50%)',
                  zIndex: 1050,
                }}
              >
                <button
                  type="button"
                  onClick={handleApplyHighlight}
                  className="ed-sel-tool-btn"
                  title="Highlight Passage"
                >
                  <HighlightOutlined style={{ color: '#eab308' }} />
                  <span>Highlight</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuoteInComment}
                  className="ed-sel-tool-btn"
                  title="Quote in Response"
                >
                  <CommentOutlined style={{ color: '#6366f1' }} />
                  <span>Quote</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="ed-sel-tool-btn"
                  title="Copy Quote"
                >
                  <CopyOutlined />
                  <span>Copy</span>
                </button>
              </div>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
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

            {/* Series Journey Sequential Navigation */}
            {seriesData?.series && (seriesData.prevStory || seriesData.nextStory) && (
              <div className="ed-series-journey">
                <div className="ed-series-journey__header">
                  <div className="ed-series-journey__label">
                    <BookOutlined style={{ marginRight: 6 }} />
                    Collection Journey · Part {seriesData.currentPart} of {seriesData.totalParts}
                  </div>
                  <Link
                    to={`/series/${seriesData.series.slug || seriesData.series._id}`}
                    className="ed-series-journey__viewall"
                  >
                    View All Chapters →
                  </Link>
                </div>
                <div className="ed-series-journey__grid">
                  {seriesData.prevStory ? (
                    <Link
                      to={`/blog/${seriesData.prevStory._id}`}
                      className="ed-series-nav-card ed-series-nav-card--prev"
                    >
                      <span className="ed-series-nav-dir">← Previous Chapter</span>
                      <span className="ed-series-nav-title">{seriesData.prevStory.title}</span>
                    </Link>
                  ) : (
                    <div className="ed-series-nav-card ed-series-nav-card--blank">
                      <span className="ed-series-nav-dir">Chapter 1</span>
                      <span className="ed-series-nav-title">Beginning of Series</span>
                    </div>
                  )}

                  {seriesData.nextStory ? (
                    <Link
                      to={`/blog/${seriesData.nextStory._id}`}
                      className="ed-series-nav-card ed-series-nav-card--next"
                    >
                      <span className="ed-series-nav-dir">Next Chapter →</span>
                      <span className="ed-series-nav-title">{seriesData.nextStory.title}</span>
                    </Link>
                  ) : (
                    <div className="ed-series-nav-card ed-series-nav-card--blank">
                      <span className="ed-series-nav-dir">Conclusion</span>
                      <span className="ed-series-nav-title">End of Series</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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

      {/* Floating Sticky Audio Narration Dock */}
      {speechState !== 'stopped' && (
        <div className="ed-audio-dock">
          <div className="ed-audio-dock__info">
            <div className="ed-audio-dock__icon">
              <AudioOutlined />
            </div>
            <div className="ed-audio-dock__meta">
              <span className="ed-audio-dock__title">{blog.title}</span>
              <span className="ed-audio-dock__sub">
                Narrated by Web Speech Engine · {speechState === 'playing' ? 'Playing' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="ed-audio-dock__controls">
            <div className="ed-audio-dock__speeds">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changePlaybackRate(rate)}
                  className={`ed-audio-speed-btn ${playbackRate === rate ? 'is-active' : ''}`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleVoiceClick}
              className="ed-audio-dock__play-btn"
            >
              {speechState === 'playing' ? <PauseOutlined /> : <CaretRightOutlined />}
            </button>

            <button
              type="button"
              onClick={() => {
                speechSynthesisRef.current?.cancel();
                setSpeechState('stopped');
              }}
              className="ed-audio-dock__close-btn"
              title="Close player"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>
      )}

      {/* Author Tipping Jar Modal */}
      <Modal
        title={null}
        open={tipModalVisible}
        onCancel={() => setTipModalVisible(false)}
        footer={null}
        centered
        width={460}
      >
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <CoffeeOutlined style={{ fontSize: 28, color: '#d97706' }} />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
            Tip {blog.author?.username || 'the Author'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
            Show appreciation for this story and fuel independent editorial deep-dives.
          </p>

          {tipSubmitted ? (
            <div
              style={{
                padding: '28px 20px',
                background: '#f0fdf4',
                borderRadius: 16,
                border: '1px solid #bbf7d0',
                textAlign: 'center',
              }}
            >
              <CheckCircleFilled style={{ fontSize: 42, color: '#16a34a', marginBottom: 12 }} />
              <h4
                style={{
                  fontWeight: 800,
                  color: '#15803d',
                  margin: '0 0 6px',
                  fontSize: '1.25rem',
                }}
              >
                Tip Received via PayPal!
              </h4>
              <p style={{ color: '#166534', margin: '0 0 14px', fontSize: '0.94rem' }}>
                Your <strong>${tipCaptureData?.amount || customTip || tipAmount} USD</strong> tip has
                been processed and delivered to <strong>{blog.author?.username}</strong>. Thank you
                for supporting independent writing!
              </p>
              {tipCaptureData?.paypalCaptureId && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#166534',
                    background: '#dcfce7',
                    padding: '6px 12px',
                    borderRadius: 8,
                    display: 'inline-block',
                    fontFamily: 'monospace',
                    marginBottom: 16,
                  }}
                >
                  Transaction ID: {tipCaptureData.paypalCaptureId}
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setTipModalVisible(false);
                    setTipSubmitted(false);
                  }}
                  style={{
                    padding: '9px 24px',
                    borderRadius: 999,
                    border: 'none',
                    background: '#15803d',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {[
                  { label: 'Espresso', amount: 2 },
                  { label: 'Cappuccino', amount: 5 },
                  { label: 'Artisan Roast', amount: 10 },
                ].map((tier) => {
                  const isSelected = !customTip && tipAmount === tier.amount;
                  return (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setTipAmount(tier.amount);
                        setCustomTip('');
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        background: isSelected ? '#0f172a' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '1.15rem' }}>${tier.amount}</div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          opacity: 0.8,
                          textTransform: 'uppercase',
                        }}
                      >
                        {tier.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginBottom: 14 }}>
                <Input
                  prefix="$"
                  placeholder="Or enter custom tip amount..."
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{ height: 40, borderRadius: 10 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input.TextArea
                  rows={2}
                  placeholder="Include an encouraging note to the author (optional)..."
                  value={tipNote}
                  onChange={(e) => setTipNote(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </div>

              {/* PayPal Payment Integration Area */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '16px 14px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>
                    Pay securely with PayPal or Card:
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    Total: ${parseFloat(customTip) || tipAmount || 5} USD
                  </span>
                </div>

                {paypalLoading && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px 0',
                      color: '#64748b',
                      fontSize: '0.88rem',
                    }}
                  >
                    <Spin size="small" style={{ marginRight: 8 }} />
                    Connecting to PayPal...
                  </div>
                )}

                {tipProcessing && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '12px 0',
                      color: '#d97706',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    <Spin size="small" style={{ marginRight: 8 }} />
                    Verifying and capturing PayPal tip...
                  </div>
                )}

                <div
                  id="paypal-tip-button-container"
                  ref={paypalBtnContainerRef}
                  style={{ minHeight: 90 }}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

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

        /* Series Ribbon & Journey Styles */
        .ed-series-ribbon {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 9999px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .ed-series-ribbon__tag {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #4f46e5;
          text-transform: uppercase;
        }
        .ed-series-ribbon__title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: color 0.15s;
        }
        .ed-series-ribbon__title:hover {
          color: #4f46e5;
        }

        .ed-series-journey {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          margin: 40px 0 32px 0;
        }
        .ed-series-journey__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ed-series-journey__label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #4338ca;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ed-series-journey__viewall {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
        }
        .ed-series-journey__viewall:hover {
          color: #0f172a;
        }
        .ed-series-journey__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 640px) {
          .ed-series-journey__grid {
            grid-template-columns: 1fr;
          }
        }
        .ed-series-nav-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ed-series-nav-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
          transform: translateY(-2px);
        }
        .ed-series-nav-dir {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
        }
        .ed-series-nav-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ed-series-nav-card--blank {
          opacity: 0.45;
          background: #f1f5f9;
          cursor: default;
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

        /* Real-Time Live Readers Presence */
        .ed-live-presence {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #16a34a;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          padding: 3px 9px;
          letter-spacing: 0.02em;
        }
        .ed-live-presence__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulse-presence 2s infinite;
        }
        @keyframes pulse-presence {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        /* Author Micro-Tip Button */
        .ed-tip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #fef08a !important;
          background: #fefce8 !important;
          color: #854d0e !important;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-tip-btn:hover {
          background: #fef08a !important;
          color: #713f12 !important;
          transform: translateY(-1px);
        }

        /* Inline Text Selection Toolbar */
        .ed-selection-toolbar {
          position: absolute;
          transform: translate(-50%, -100%);
          display: flex;
          align-items: center;
          gap: 4px;
          background: #0f172a;
          border-radius: 999px;
          padding: 4px 6px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          animation: fadeInToolbar 0.15s ease;
        }
        @keyframes fadeInToolbar {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        .ed-sel-tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: #f1f5f9;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ed-sel-tool-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        /* Floating Audio Narration Dock */
        .ed-audio-dock {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 620px;
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          z-index: 1500;
          color: #ffffff;
        }
        .ed-audio-dock__info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .ed-audio-dock__icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          font-size: 16px;
          flex-shrink: 0;
        }
        .ed-audio-dock__meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ed-audio-dock__title {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #f8fafc;
        }
        .ed-audio-dock__sub {
          font-size: 11px;
          color: #94a3b8;
        }
        .ed-audio-dock__controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .ed-audio-dock__speeds {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 2px;
        }
        .ed-audio-speed-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ed-audio-speed-btn:hover {
          color: #ffffff;
        }
        .ed-audio-speed-btn.is-active {
          background: #38bdf8;
          color: #0f172a;
        }
        .ed-audio-dock__play-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #ffffff;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          transition: transform 0.15s, background 0.15s;
        }
        .ed-audio-dock__play-btn:hover {
          transform: scale(1.06);
          background: #f1f5f9;
        }
        .ed-audio-dock__close-btn {
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .ed-audio-dock__close-btn:hover {
          color: #ffffff;
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
