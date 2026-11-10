export const TOGGLE_LIKE = 'TOGGLE_LIKE';
export const SET_LIKE_STATE = 'SET_LIKE_STATE';
export const TOGGLE_BOOKMARK = 'TOGGLE_BOOKMARK';
export const SET_BOOKMARK_STATE = 'SET_BOOKMARK_STATE';
export const SHARE_BLOG = 'SHARE_BLOG';

export const toggleLike = (blogId) => ({
  type: TOGGLE_LIKE,
  payload: blogId,
});

export const setLikeState = (blogId, isLiked, reactionType = null) => ({
  type: SET_LIKE_STATE,
  payload: { blogId, isLiked: Boolean(isLiked), reactionType: isLiked ? reactionType || 'love' : null },
});

export const toggleBookmark = (blogId) => ({
  type: TOGGLE_BOOKMARK,
  payload: blogId,
});

export const setBookmarkState = (blogId, isBookmarked) => ({
  type: SET_BOOKMARK_STATE,
  payload: { blogId, isBookmarked: Boolean(isBookmarked) },
});

export const shareBlog = (blogId) => ({
  type: SHARE_BLOG,
  payload: blogId,
});
