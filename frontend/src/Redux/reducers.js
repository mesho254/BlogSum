import {
  TOGGLE_LIKE,
  SET_LIKE_STATE,
  TOGGLE_BOOKMARK,
  SET_BOOKMARK_STATE,
  SHARE_BLOG,
} from './actions';

const safeParse = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const initialState = {
  likes: safeParse('likes', {}),
  reactions: safeParse('reactions', {}),
  bookmarks: safeParse('bookmarks', {}),
  shares: safeParse('shares', {}),
};

const blogReducer = (state = initialState, action) => {
  let newState;
  switch (action.type) {
    case TOGGLE_LIKE: {
      const nextLiked = !state.likes[action.payload];
      newState = {
        ...state,
        likes: {
          ...state.likes,
          [action.payload]: nextLiked,
        },
        reactions: {
          ...state.reactions,
          [action.payload]: nextLiked ? state.reactions[action.payload] || 'love' : null,
        },
      };
      localStorage.setItem('likes', JSON.stringify(newState.likes));
      localStorage.setItem('reactions', JSON.stringify(newState.reactions));
      return newState;
    }
    case SET_LIKE_STATE: {
      const { blogId, isLiked, reactionType } = action.payload;
      newState = {
        ...state,
        likes: {
          ...state.likes,
          [blogId]: Boolean(isLiked),
        },
        reactions: {
          ...state.reactions,
          [blogId]: isLiked ? reactionType || 'love' : null,
        },
      };
      localStorage.setItem('likes', JSON.stringify(newState.likes));
      localStorage.setItem('reactions', JSON.stringify(newState.reactions));
      return newState;
    }
    case TOGGLE_BOOKMARK:
      newState = {
        ...state,
        bookmarks: {
          ...state.bookmarks,
          [action.payload]: !state.bookmarks[action.payload],
        },
      };
      localStorage.setItem('bookmarks', JSON.stringify(newState.bookmarks));
      return newState;
    case SET_BOOKMARK_STATE: {
      const { blogId, isBookmarked } = action.payload;
      newState = {
        ...state,
        bookmarks: {
          ...state.bookmarks,
          [blogId]: Boolean(isBookmarked),
        },
      };
      localStorage.setItem('bookmarks', JSON.stringify(newState.bookmarks));
      return newState;
    }
    case SHARE_BLOG:
      newState = {
        ...state,
        shares: {
          ...state.shares,
          [action.payload]: (state.shares[action.payload] || 0) + 1,
        },
      };
      localStorage.setItem('shares', JSON.stringify(newState.shares));
      return newState;
    default:
      return state;
  }
};

export default blogReducer;
