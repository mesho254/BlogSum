export const TOGGLE_LIKE = 'TOGGLE_LIKE';
export const TOGGLE_BOOKMARK = 'TOGGLE_BOOKMARK';
export const SHARE_BLOG = 'SHARE_BLOG';

export const toggleLike = (blogId) => ({
  type: TOGGLE_LIKE,
  payload: blogId,
});

export const toggleBookmark = (blogId) => ({
  type: TOGGLE_BOOKMARK,
  payload: blogId,
});

export const shareBlog = (blogId) => ({
  type: SHARE_BLOG,
  payload: blogId,
});
