import { TOGGLE_LIKE, TOGGLE_BOOKMARK, SHARE_BLOG } from './actions';

const initialState = {
  likes: JSON.parse(localStorage.getItem('likes')) || {},
  bookmarks: JSON.parse(localStorage.getItem('bookmarks')) || {},
  shares: JSON.parse(localStorage.getItem('shares')) || {},
};

const blogReducer = (state = initialState, action) => {
  let newState;
  switch (action.type) {
    case TOGGLE_LIKE:
      newState = {
        ...state,
        likes: {
          ...state.likes,
          [action.payload]: !state.likes[action.payload],
        },
      };
      localStorage.setItem('likes', JSON.stringify(newState.likes));
      return newState;
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
