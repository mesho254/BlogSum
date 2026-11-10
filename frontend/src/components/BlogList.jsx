import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Skeleton } from 'antd';
import {
  SearchOutlined,
  CloseCircleFilled,
  AppstoreOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BlogCard from './BlogCard';
import axiosInstance from '../axiosConfig';

const ALL_CATEGORIES = [
  'All',
  'Technology',
  'Business',
  'Design',
  'Finance',
  'Science',
  'Health',
  'Lifestyle',
  'Education',
  'Travel',
  'Culture',
  'Productivity',
  'Career',
  'Food',
  'Entertainment',
  'Sports',
];

const SORT_OPTIONS = [
  { key: 'Newest', label: 'Newest' },
  { key: 'Popular', label: 'Popular' },
  { key: 'Oldest', label: 'Oldest' },
];

const getCachedBlogs = () => {
  try {
    const raw = localStorage.getItem('blogsum_blogs_cache');
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const INITIAL_BATCH = 9;
const BATCH_INCREMENT = 6;

const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState(() => searchParams.get('tag') || '');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const urlTag = searchParams.get('tag') || '';
    if (urlTag !== selectedTag) {
      setSelectedTag(urlTag);
      setVisibleCount(INITIAL_BATCH);
    }
  }, [searchParams]);

  // Press '/' anywhere outside inputs to focus the blog search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    data: rawBlogs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/blogs');
      try {
        localStorage.setItem('blogsum_blogs_cache', JSON.stringify(response.data));
      } catch {
        // Ignore quota errors
      }
      return response.data;
    },
    placeholderData: getCachedBlogs,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

  // Never display draft or future-scheduled blogs on the public feed
  const blogs = useMemo(() => {
    const now = new Date();
    return rawBlogs.filter((b) => {
      if (!b || b.status === 'draft') return false;
      const pubTime = b.publishDate || b.date;
      if (pubTime && new Date(pubTime) > now) return false;
      return true;
    });
  }, [rawBlogs]);

  // Compute live counts per category
  const categoryCounts = useMemo(() => {
    const counts = { All: blogs.length };
    blogs.forEach((b) => {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    return counts;
  }, [blogs]);

  const visibleCategories = useMemo(() => {
    if (showAllCategories) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter(
      (cat, idx) =>
        idx < 8 ||
        (categoryCounts[cat] || 0) > 0 ||
        selectedCategory === cat
    );
  }, [showAllCategories, categoryCounts, selectedCategory]);

  // Extract top unique tags across all published blogs
  const popularTags = useMemo(() => {
    const map = new Map();
    blogs.forEach((b) => {
      if (Array.isArray(b.tags)) {
        b.tags.forEach((rawTag) => {
          const t = String(rawTag || '').trim().toLowerCase();
          if (t) map.set(t, (map.get(t) || 0) + 1);
        });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([tag, count]) => ({ tag, count }));
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    let filtered = [...blogs];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((blog) => blog.category === selectedCategory);
    }

    if (selectedTag) {
      const target = selectedTag.toLowerCase();
      filtered = filtered.filter(
        (blog) =>
          Array.isArray(blog.tags) &&
          blog.tags.some((t) => String(t).toLowerCase() === target)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
      filtered = filtered.filter(
        (blog) =>
          blog.title?.toLowerCase().includes(q) ||
          blog.subtitle?.toLowerCase().includes(q) ||
          blog.author?.username?.toLowerCase().includes(q) ||
          blog.category?.toLowerCase().includes(q) ||
          (Array.isArray(blog.tags) &&
            blog.tags.some((t) => String(t).toLowerCase().includes(q)))
      );
    }

    filtered.sort((a, b) => {
      if (selectedSort === 'Popular') {
        const scoreA = (a.likes?.length || 0) * 2 + (a.comments?.length || 0) + (a.bookmarks?.length || 0);
        const scoreB = (b.likes?.length || 0) * 2 + (b.comments?.length || 0) + (b.bookmarks?.length || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      const dateA = new Date(a.publishDate || a.date);
      const dateB = new Date(b.publishDate || b.date);
      const diff = dateB - dateA;
      if (diff !== 0) {
        return selectedSort === 'Oldest' ? -diff : diff;
      }
      return selectedSort === 'Oldest'
        ? String(a._id).localeCompare(String(b._id))
        : String(b._id).localeCompare(String(a._id));
    });

    return filtered;
  }, [blogs, selectedCategory, selectedTag, selectedSort, searchQuery]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setVisibleCount(INITIAL_BATCH);
  };

  const handleTagSelect = (tag) => {
    const nextTag = selectedTag === tag ? '' : tag;
    setSelectedTag(nextTag);
    setVisibleCount(INITIAL_BATCH);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTag) {
      nextParams.set('tag', nextTag);
    } else {
      nextParams.delete('tag');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSortChange = (sortKey) => {
    setSelectedSort(sortKey);
    setVisibleCount(INITIAL_BATCH);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setVisibleCount(INITIAL_BATCH);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedTag('');
    setSearchQuery('');
    setSelectedSort('Newest');
    setVisibleCount(INITIAL_BATCH);
    if (searchParams.has('tag')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('tag');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const displayedBlogs = useMemo(
    () => filteredBlogs.slice(0, visibleCount),
    [filteredBlogs, visibleCount]
  );

  const hasMore = visibleCount < filteredBlogs.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, filteredBlogs.length));
      setIsLoadingMore(false);
    }, 280);
  }, [isLoadingMore, hasMore, filteredBlogs.length]);

  // Infinite Scroll Trigger as user scrolls down near the bottom
  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '350px 0px',
        threshold: 0.05,
      }
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    Boolean(selectedTag) ||
    Boolean(searchQuery.trim()) ||
    selectedSort !== 'Newest';

  return (
    <section className="bloglist-section">
      {/* Editorial Publication Header + Minimal Search */}
      <div className="bloglist-ed-header">
        <div className="bloglist-ed-header__titles">
          <h2 className="bloglist-ed-title">Latest Stories</h2>
          <p className="bloglist-ed-subtitle">
            Essays, field notes, and perspectives across technology, culture, and life.
          </p>
        </div>

        <div className={`bloglist-ed-search ${searchFocused ? 'is-focused' : ''}`}>
          <SearchOutlined className="bloglist-ed-search__icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by title, author, or #tag..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bloglist-ed-search__input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
                searchInputRef.current?.focus();
              }}
              className="bloglist-ed-search__clear"
              aria-label="Clear search"
            >
              <CloseCircleFilled />
            </button>
          )}
        </div>
      </div>

      {/* Hairline Editorial Navigation & Sort Bar */}
      <div className="bloglist-ed-nav">
        <div className="bloglist-ed-tabs" role="tablist" aria-label="Categories">
          {visibleCategories.map((category) => {
            const isActive = selectedCategory === category;
            const count = categoryCounts[category] || 0;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleCategoryChange(category)}
                className={`bloglist-ed-tab ${isActive ? 'is-active' : ''}`}
              >
                <span>{category === 'All' ? 'All' : category}</span>
                <sup className="bloglist-ed-tab__count">{count}</sup>
              </button>
            );
          })}
          {ALL_CATEGORIES.length > visibleCategories.length && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="bloglist-ed-more-cats"
            >
              +{ALL_CATEGORIES.length - visibleCategories.length} more
            </button>
          )}
          {showAllCategories && (
            <button
              type="button"
              onClick={() => setShowAllCategories(false)}
              className="bloglist-ed-more-cats"
            >
              Less
            </button>
          )}
        </div>

        <div className="bloglist-ed-sort" aria-label="Sort stories">
          <span className="bloglist-ed-sort__label">Sort:</span>
          {SORT_OPTIONS.map((opt, idx) => {
            const isActive = selectedSort === opt.key;
            return (
              <React.Fragment key={opt.key}>
                {idx > 0 && <span className="bloglist-ed-sort__sep">/</span>}
                <button
                  type="button"
                  onClick={() => handleSortChange(opt.key)}
                  className={`bloglist-ed-sort__btn ${isActive ? 'is-active' : ''}`}
                >
                  {opt.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Editorial Topics / Tags Bar */}
      {(popularTags.length > 0 || selectedTag) && (
        <div className="bloglist-ed-topics">
          <span className="bloglist-ed-topics__label">Topics:</span>
          <div className="bloglist-ed-topics__list">
            {popularTags.map(({ tag, count }) => {
              const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className={`bloglist-ed-topic ${isActive ? 'is-active' : ''}`}
                >
                  <span>#{tag}</span>
                  {count > 1 && <span className="bloglist-ed-topic__count">{count}</span>}
                </button>
              );
            })}
            {selectedTag &&
              !popularTags.some(
                (t) => t.tag.toLowerCase() === selectedTag.toLowerCase()
              ) && (
                <button
                  type="button"
                  onClick={() => handleTagSelect(selectedTag)}
                  className="bloglist-ed-topic is-active"
                >
                  <span>#{selectedTag}</span>
                </button>
              )}
          </div>
        </div>
      )}

      {/* Active Filter Summary Bar */}
      {hasActiveFilters && (
        <div className="bloglist-ed-status">
          <span>
            Showing {filteredBlogs.length} of {blogs.length} stories
            {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            {selectedTag ? ` tagged #${selectedTag}` : ''}
            {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="bloglist-ed-reset"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div style={{ padding: '40px 0', width: '100%' }}>
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={6} key={n}>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Skeleton.Image active style={{ width: '100%', height: 180, marginBottom: 16 }} />
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      ) : isError ? (
        <div className="bloglist-empty-card">
          <p style={{ color: '#ef4444', fontWeight: 600, margin: 0 }}>
            Failed to load blogs. Please refresh the page and try again.
          </p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bloglist-empty-card">
          <div className="bloglist-empty-card__icon">
            <AppstoreOutlined />
          </div>
          <h3 className="bloglist-empty-card__title">No matching articles found</h3>
          <p className="bloglist-empty-card__desc">
            We couldn&apos;t find any posts matching your current filter or search query.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="bloglist-empty-card__btn"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ minHeight: '300px' }}>
            <Row gutter={[24, 24]} align="stretch">
              {displayedBlogs.map((blog) => (
                <Col
                  xs={24}
                  sm={12}
                  md={12}
                  lg={8}
                  xl={6}
                  key={blog._id}
                  style={{ display: 'flex' }}
                >
                  <BlogCard blog={blog} onTagClick={handleTagSelect} />
                </Col>
              ))}
            </Row>
          </div>

          {/* Infinite Scroll Trigger Sentinel & Status */}
          <div ref={sentinelRef} className="bloglist-infinite-zone">
            {hasMore ? (
              <div className="bloglist-loadmore-wrap">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="bloglist-loadmore-btn"
                >
                  {isLoadingMore ? (
                    <>
                      <LoadingOutlined spin style={{ fontSize: '15px' }} />
                      <span>Loading more stories...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Stories</span>
                      <span className="bloglist-loadmore-count">
                        ({displayedBlogs.length} of {filteredBlogs.length})
                      </span>
                    </>
                  )}
                </button>
              </div>
            ) : filteredBlogs.length > 0 ? (
              <div className="bloglist-end-wrap">
                <span className="bloglist-end-divider" />
                <span className="bloglist-end-label">
                  ✦ You&apos;re all caught up &middot; {filteredBlogs.length} stories
                </span>
                <span className="bloglist-end-divider" />
              </div>
            ) : null}
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .bloglist-section {
          max-width: 1280px;
          width: 94%;
          margin: 20px auto 56px;
          padding: 8px 0;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .bloglist-section {
            max-width: 1560px;
          }
        }
        @media (min-width: 1920px) {
          .bloglist-section {
            max-width: 1720px;
            width: 95%;
          }
        }
        .bloglist-ed-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .bloglist-ed-header__titles {
          max-width: 600px;
        }
        .bloglist-ed-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2rem, 3.2vw, 2.75rem);
          font-weight: 500;
          color: #111827;
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 8px;
        }
        .bloglist-ed-subtitle {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-size: 0.95rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .bloglist-ed-search {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 260px;
          max-width: 340px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border-bottom: 1.5px solid #d1d5db;
          transition: border-color 0.2s ease;
        }
        .bloglist-ed-search.is-focused {
          border-bottom-color: #111827;
        }
        .bloglist-ed-search__icon {
          font-size: 14px;
          color: #6b7280;
          flex-shrink: 0;
        }
        .bloglist-ed-search.is-focused .bloglist-ed-search__icon {
          color: #111827;
        }
        .bloglist-ed-search__input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          font-size: 13.5px;
          color: #111827;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }
        .bloglist-ed-search__input::placeholder {
          color: #9ca3af;
        }
        .bloglist-ed-search__clear {
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          font-size: 13px;
        }
        .bloglist-ed-search__clear:hover {
          color: #111827;
        }
        .bloglist-ed-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 18px;
        }
        .bloglist-ed-more-cats {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #4b5563;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bloglist-ed-more-cats:hover {
          border-color: #111827;
          color: #111827;
        }
        .bloglist-ed-topics {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .bloglist-ed-topics__label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #9ca3af;
        }
        .bloglist-ed-topics__list {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }
        .bloglist-ed-topic {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #4b5563;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bloglist-ed-topic:hover {
          border-color: #111827;
          color: #111827;
        }
        .bloglist-ed-topic.is-active {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }
        .bloglist-ed-topic__count {
          font-size: 10.5px;
          opacity: 0.7;
        }
        .bloglist-ed-tabs {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          overflow: visible;
        }
        .bloglist-ed-tab {
          position: relative;
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          padding: 14px 0;
          border: none;
          background: transparent;
          color: #6b7280;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s ease;
        }
        .bloglist-ed-tab:hover {
          color: #111827;
        }
        .bloglist-ed-tab.is-active {
          color: #111827;
          font-weight: 600;
        }
        .bloglist-ed-tab.is-active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: #111827;
        }
        .bloglist-ed-tab__count {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
        }
        .bloglist-ed-tab.is-active .bloglist-ed-tab__count {
          color: #111827;
        }
        .bloglist-ed-sort {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 0;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-size: 12.5px;
        }
        .bloglist-ed-sort__label {
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 11px;
          font-weight: 600;
          margin-right: 2px;
        }
        .bloglist-ed-sort__sep {
          color: #d1d5db;
        }
        .bloglist-ed-sort__btn {
          border: none;
          background: transparent;
          padding: 0;
          color: #6b7280;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .bloglist-ed-sort__btn:hover {
          color: #111827;
        }
        .bloglist-ed-sort__btn.is-active {
          color: #111827;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .bloglist-ed-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 20px;
          font-size: 13px;
          color: #6b7280;
        }
        .bloglist-ed-reset {
          border: none;
          background: transparent;
          padding: 0;
          color: #111827;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        .bloglist-empty-card {
          text-align: center;
          padding: 64px 24px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px dashed #cbd5e1;
          margin: 24px 0;
        }
        .bloglist-empty-card__icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .bloglist-empty-card__title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }
        .bloglist-empty-card__desc {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0 0 18px;
        }
        .bloglist-empty-card__btn {
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 20px;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
        }
        .bloglist-infinite-zone {
          margin-top: 48px;
          margin-bottom: 24px;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bloglist-loadmore-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .bloglist-loadmore-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bloglist-loadmore-btn:hover:not(:disabled) {
          border-color: #0f172a;
          background: #0f172a;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
        }
        .bloglist-loadmore-btn:disabled {
          opacity: 0.8;
          cursor: wait;
        }
        .bloglist-loadmore-count {
          font-size: 0.8rem;
          opacity: 0.7;
          font-weight: 500;
        }
        .bloglist-end-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
        }
        .bloglist-end-divider {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
        .bloglist-end-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
      `}</style>
    </section>
  );
};

export default BlogList;
