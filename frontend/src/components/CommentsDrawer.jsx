import React, { useState, useMemo } from 'react';
import { Drawer, Avatar, Input, Button, Empty, message } from 'antd';
import {
  CommentOutlined,
  HeartOutlined,
  HeartFilled,
  SendOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import AuthorHoverCard from './AuthorHoverCard';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '💡', '🙌'];

const hasLiked = (likes = [], userId) =>
  Boolean(userId && Array.isArray(likes) && likes.some((id) => String(id?._id || id) === String(userId)));

export const getTotalCommentsCount = (comments = []) => {
  if (!Array.isArray(comments)) return 0;
  return comments.reduce(
    (sum, c) => sum + 1 + (Array.isArray(c.replies) ? c.replies.length : 0),
    0
  );
};

export const CommentsThreadContent = ({
  blogId,
  blogAuthorId,
  comments = [],
  onCommentsUpdated,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [collapsedThreads, setCollapsedThreads] = useState({});
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'

  const sortedComments = useMemo(() => {
    const list = [...(comments || [])];
    if (sortBy === 'popular') {
      return list.sort(
        (a, b) =>
          (b.likes?.length || 0) +
          (b.replies?.length || 0) -
          ((a.likes?.length || 0) + (a.replies?.length || 0))
      );
    }
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [comments, sortBy]);

  const syncUpdatedComments = (updatedComments) => {
    if (onCommentsUpdated) {
      onCommentsUpdated(updatedComments);
    }
    queryClient.setQueryData(['blog', blogId], (old) =>
      old ? { ...old, comments: updatedComments } : old
    );
    queryClient.setQueryData(['blogs'], (old) =>
      Array.isArray(old)
        ? old.map((b) => (String(b._id) === String(blogId) ? { ...b, comments: updatedComments } : b))
        : old
    );
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await axiosInstance.post(`/api/blogs/${blogId}/comment`, {
        comment: newComment.trim(),
      });
      setNewComment('');
      syncUpdatedComments(response.data);
      message.success('Comment posted');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId, mentionPrefix = '') => {
    if (!user) {
      navigate('/login');
      return;
    }
    const rawReply = (replyTextMap[commentId] || '').trim();
    if (!rawReply) return;

    setSubmittingReplyId(commentId);
    try {
      const response = await axiosInstance.post(
        `/api/blogs/${blogId}/comment/${commentId}/reply`,
        {
          comment: mentionPrefix ? `${mentionPrefix} ${rawReply}` : rawReply,
        }
      );
      setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId(null);
      setCollapsedThreads((prev) => ({ ...prev, [commentId]: false }));
      syncUpdatedComments(response.data);
      message.success('Reply added');
    } catch (error) {
      console.error('Error replying to comment:', error);
      message.error('Failed to post reply');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const handleToggleCommentLike = async (commentId, replyId = null) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await axiosInstance.put(
        `/api/blogs/${blogId}/comment/${commentId}/like`,
        replyId ? { replyId } : {}
      );
      syncUpdatedComments(response.data);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const toggleCollapseThread = (commentId) => {
    setCollapsedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Comment Composer Card */}
      {user ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Avatar
              src={user.profilePicture}
              size={38}
              style={{
                backgroundColor: '#4f46e5',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.username?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Input.TextArea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 5 }}
                placeholder="Add a thoughtful comment..."
                style={{
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13.5px',
                  padding: '10px 12px',
                }}
                onPressEnter={(e) => {
                  if ((e.metaKey || e.ctrlKey) && newComment.trim()) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewComment((prev) => `${prev}${emoji}`)}
                      style={{
                        border: 'none',
                        background: '#ffffff',
                        borderRadius: '8px',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submittingComment}
                  disabled={!newComment.trim()}
                  onClick={handleAddComment}
                  style={{
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    height: '34px',
                    padding: '0 16px',
                    background: newComment.trim()
                      ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                      : undefined,
                    border: 'none',
                  }}
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 10px', color: '#475569', fontSize: '13.5px', fontWeight: 500 }}>
            Sign in to join the discussion and reply to comments
          </p>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate('/login')}
            style={{
              borderRadius: '999px',
              fontWeight: 600,
              padding: '0 18px',
              height: '32px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              border: 'none',
            }}
          >
            Login to Comment
          </Button>
        </div>
      )}

      {/* Sort & Filter Bar */}
      {sortedComments.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>
            {sortedComments.length} {sortedComments.length === 1 ? 'Comment' : 'Comments'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['newest', 'popular'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortBy(mode)}
                style={{
                  border: 'none',
                  background: sortBy === mode ? '#eef2ff' : 'transparent',
                  color: sortBy === mode ? '#4f46e5' : '#64748b',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {mode === 'newest' ? 'Most Recent' : 'Top Liked'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Threaded Comments List */}
      {sortedComments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
              No comments yet. Start the conversation!
            </span>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedComments.map((comment) => {
            const commentAuthor = comment.user || {};
            const commentAuthorId = commentAuthor._id || commentAuthor;
            const isBlogAuthor =
              Boolean(blogAuthorId && commentAuthorId) &&
              String(commentAuthorId) === String(blogAuthorId);
            const commentLiked = hasLiked(comment.likes, user?._id);
            const commentLikesCount = comment.likes?.length || 0;
            const replies = Array.isArray(comment.replies) ? comment.replies : [];
            const isReplying = activeReplyCommentId === comment._id;
            const isCollapsed = Boolean(collapsedThreads[comment._id]);

            return (
              <div key={comment._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AuthorHoverCard author={commentAuthor}>
                  <Link to={commentAuthorId ? `/profile/${commentAuthorId}` : '#'}>
                    <Avatar
                      src={commentAuthor.profilePicture}
                      size={36}
                      style={{
                        backgroundColor: '#4f46e5',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(commentAuthor.username || 'U')[0].toUpperCase()}
                    </Avatar>
                  </Link>
                </AuthorHoverCard>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Comment Bubble */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '0 16px 16px 16px',
                      padding: '10px 14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <AuthorHoverCard author={commentAuthor}>
                          <Link
                            to={commentAuthorId ? `/profile/${commentAuthorId}` : '#'}
                            style={{
                              fontWeight: 700,
                              fontSize: '13px',
                              color: '#0f172a',
                              textDecoration: 'none',
                            }}
                          >
                            {commentAuthor.username || 'User'}
                          </Link>
                        </AuthorHoverCard>
                        {isBlogAuthor && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: '#eef2ff',
                              color: '#4f46e5',
                              padding: '1px 7px',
                              borderRadius: '999px',
                              border: '1px solid #c7d2fe',
                            }}
                          >
                            Author
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                        {comment.date ? moment(comment.date).fromNow() : 'Just now'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13.5px',
                        color: '#334155',
                        lineHeight: 1.55,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {comment.comment}
                    </div>
                  </div>

                  {/* Comment Action Bar (Like, Reply, Collapse/Expand Replies) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginTop: '6px',
                      paddingLeft: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCommentLike(comment._id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: commentLiked ? 700 : 600,
                        color: commentLiked ? '#e11d48' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {commentLiked ? <HeartFilled /> : <HeartOutlined />}
                      <span>Like{commentLikesCount > 0 ? ` (${commentLikesCount})` : ''}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyCommentId(isReplying ? null : comment._id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isReplying ? '#4f46e5' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <MessageOutlined style={{ fontSize: '11.5px' }} />
                      <span>Reply</span>
                    </button>

                    {replies.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleCollapseThread(comment._id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#4f46e5',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isCollapsed ? (
                          <>
                            <DownOutlined style={{ fontSize: '10px' }} />
                            <span>
                              View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </>
                        ) : (
                          <>
                            <UpOutlined style={{ fontSize: '10px' }} />
                            <span>
                              Hide {replies.length === 1 ? 'reply' : 'replies'} ({replies.length})
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Inline Reply Box */}
                  {isReplying && (
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        paddingLeft: '8px',
                      }}
                    >
                      <Input
                        size="small"
                        value={replyTextMap[comment._id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [comment._id]: e.target.value,
                          }))
                        }
                        placeholder={`Reply to ${commentAuthor.username || 'comment'}...`}
                        style={{
                          borderRadius: '999px',
                          padding: '6px 12px',
                          fontSize: '12.5px',
                        }}
                        onPressEnter={() => handleAddReply(comment._id)}
                        autoFocus
                      />
                      <Button
                        type="primary"
                        size="small"
                        loading={submittingReplyId === comment._id}
                        disabled={!(replyTextMap[comment._id] || '').trim()}
                        onClick={() => handleAddReply(comment._id)}
                        style={{
                          borderRadius: '999px',
                          height: '30px',
                          padding: '0 14px',
                          fontWeight: 600,
                          fontSize: '12px',
                          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                          border: 'none',
                        }}
                      >
                        Reply
                      </Button>
                    </div>
                  )}

                  {/* Nested Replies Thread */}
                  {replies.length > 0 && !isCollapsed && (
                    <div
                      style={{
                        marginTop: '10px',
                        marginLeft: '8px',
                        paddingLeft: '14px',
                        borderLeft: '2px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {replies.map((reply) => {
                        const replyUser = reply.user || {};
                        const replyUserId = replyUser._id || replyUser;
                        const isReplyBlogAuthor =
                          Boolean(blogAuthorId && replyUserId) &&
                          String(replyUserId) === String(blogAuthorId);
                        const replyLiked = hasLiked(reply.likes, user?._id);
                        const replyLikesCount = reply.likes?.length || 0;

                        return (
                          <div
                            key={reply._id || `${reply.date}-${reply.comment}`}
                            style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                          >
                            <AuthorHoverCard author={replyUser}>
                              <Link to={replyUserId ? `/profile/${replyUserId}` : '#'}>
                                <Avatar
                                  src={replyUser.profilePicture}
                                  size={28}
                                  style={{
                                    backgroundColor: '#6366f1',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {(replyUser.username || 'U')[0].toUpperCase()}
                                </Avatar>
                              </Link>
                            </AuthorHoverCard>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '0 14px 14px 14px',
                                  padding: '8px 12px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '6px',
                                    marginBottom: '2px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <AuthorHoverCard author={replyUser}>
                                      <Link
                                        to={replyUserId ? `/profile/${replyUserId}` : '#'}
                                        style={{
                                          fontWeight: 700,
                                          fontSize: '12px',
                                          color: '#0f172a',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        {replyUser.username || 'User'}
                                      </Link>
                                    </AuthorHoverCard>
                                    {isReplyBlogAuthor && (
                                      <span
                                        style={{
                                          fontSize: '9.5px',
                                          fontWeight: 700,
                                          background: '#eef2ff',
                                          color: '#4f46e5',
                                          padding: '0 6px',
                                          borderRadius: '999px',
                                          border: '1px solid #c7d2fe',
                                        }}
                                      >
                                        Author
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                    {reply.date ? moment(reply.date).fromNow() : 'Just now'}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    lineHeight: 1.5,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {reply.comment}
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '4px',
                                  paddingLeft: '4px',
                                }}
                              >
                                {reply._id && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCommentLike(comment._id, reply._id)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      padding: 0,
                                      fontSize: '11px',
                                      fontWeight: replyLiked ? 700 : 600,
                                      color: replyLiked ? '#e11d48' : '#64748b',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    {replyLiked ? <HeartFilled /> : <HeartOutlined />}
                                    <span>
                                      Like{replyLikesCount > 0 ? ` (${replyLikesCount})` : ''}
                                    </span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReplyCommentId(comment._id);
                                    setReplyTextMap((prev) => ({
                                      ...prev,
                                      [comment._id]: `@${replyUser.username || 'user'} `,
                                    }));
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: 0,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CommentsDrawer = ({
  open,
  onClose,
  blogId,
  blogTitle,
  blogAuthorId,
  comments = [],
  onCommentsUpdated,
}) => {
  const totalCount = getTotalCommentsCount(comments);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                color: '#4f46e5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              <CommentOutlined />
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Discussion ({totalCount})
              </div>
              {blogTitle && (
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    fontWeight: 500,
                    maxWidth: '280px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {blogTitle}
                </div>
              )}
            </div>
          </div>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={440}
      styles={{
        body: { padding: '18px 20px', background: '#ffffff' },
        header: { borderBottom: '1px solid #f1f5f9', padding: '16px 20px' },
      }}
    >
      <CommentsThreadContent
        blogId={blogId}
        blogAuthorId={blogAuthorId}
        comments={comments}
        onCommentsUpdated={onCommentsUpdated}
      />
    </Drawer>
  );
};

export default CommentsDrawer;

