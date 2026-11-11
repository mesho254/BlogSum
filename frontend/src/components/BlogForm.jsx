import React, { useState, useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  Input,
  Upload,
  message,
  Select,
  Checkbox,
  DatePicker,
  Tooltip,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
  EyeOutlined,
  EditOutlined,
  ColumnWidthOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TagOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';
import moment from 'moment';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import Navbar from './NavBar';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const { Option } = Select;

export const BLOG_CATEGORIES = [
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

const CATEGORY_TAG_SUGGESTIONS = {
  Technology: ['AI', 'Cybersecurity', 'Web Dev', 'Cloud', 'Software', 'Open Source'],
  Business: ['Startups', 'Leadership', 'Strategy', 'Marketing', 'Remote Work'],
  Design: ['UI/UX', 'Typography', 'Product Design', 'Minimalism', 'Branding'],
  Finance: ['Investing', 'Fintech', 'Personal Finance', 'Markets', 'Economy'],
  Science: ['Research', 'Space', 'Climate', 'Biotech', 'Physics'],
  Health: ['Wellness', 'Nutrition', 'Mental Health', 'Fitness', 'Longevity'],
  Lifestyle: ['Minimalism', 'Habits', 'Mindfulness', 'Home', 'Creativity'],
  Education: ['Learning', 'Study Tips', 'EdTech', 'Tutorials', 'Books'],
  Travel: ['Destinations', 'Digital Nomad', 'Adventure', 'Guides', 'Culture'],
  Default: ['Insights', 'Guide', 'Opinion', 'Tutorial', 'Future'],
};

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const BlogForm = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('3');
  const [autoReadTime, setAutoReadTime] = useState(true);
  const [category, setCategory] = useState('Technology');
  const [allowComments, setAllowComments] = useState(true);

  // Up to 5 images: each item is { id, url, file: File | null, isExisting: boolean }
  const [mediaItems, setMediaItems] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Tags state
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Publishing schedule state: 'now' | 'schedule' | 'draft'
  const [publishMode, setPublishMode] = useState('now');
  const [scheduledDate, setScheduledDate] = useState(null); // dayjs object

  // View mode: 'split' | 'editor' | 'preview'
  const [viewMode, setViewMode] = useState('split');
  const [previewTab, setPreviewTab] = useState('article'); // 'article' | 'card'

  // Loading & publishing status
  const [fetchingBlog, setFetchingBlog] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [publishStage, setPublishStage] = useState('');

  const previewBodyRef = useRef(null);

  // Word count & automatic read time
  const wordCount = useMemo(() => {
    const plain = stripHtml(content);
    if (!plain) return 0;
    return plain.split(/\s+/).filter(Boolean).length;
  }, [content]);

  useEffect(() => {
    if (autoReadTime) {
      const estimated = Math.max(1, Math.ceil(wordCount / 200));
      setReadTime(String(estimated));
    }
  }, [wordCount, autoReadTime]);

  // Fetch existing blog when editing (/edit/:id) — including Featured Image & Gallery Images!
  useEffect(() => {
    const fetchBlog = async () => {
      setFetchingBlog(true);
      try {
        const response = await axiosInstance.get(`/api/blogs/${id}`);
        const fetched = response.data;

        setTitle(fetched.title || '');
        setSubtitle(fetched.subtitle || '');
        setContent(fetched.content || '');
        setReadTime(String(fetched.readTime || '3'));
        setAutoReadTime(false);
        setCategory(fetched.category || 'Technology');
        setAllowComments(fetched.allowComments !== false);
        setTags(Array.isArray(fetched.tags) ? fetched.tags : []);

        // Load existing featured image & gallery images (up to 5)
        const rawUrls =
          Array.isArray(fetched.images) && fetched.images.length > 0
            ? fetched.images
            : fetched.imageUrl
            ? [fetched.imageUrl]
            : [];
        const uniqueUrls = Array.from(
          new Set([fetched.imageUrl, ...rawUrls].filter(Boolean))
        ).slice(0, 5);

        setMediaItems(
          uniqueUrls.map((url, idx) => ({
            id: `existing-${idx}-${Date.now()}`,
            url,
            file: null,
            isExisting: true,
          }))
        );

        const pubDate = fetched.publishDate || fetched.date;
        if (fetched.status === 'draft') {
          setPublishMode('draft');
        } else if (pubDate && new Date(pubDate) > new Date()) {
          setPublishMode('schedule');
          setScheduledDate(dayjs(pubDate));
        } else {
          setPublishMode('now');
          if (pubDate) {
            setScheduledDate(dayjs(pubDate));
          }
        }
      } catch (error) {
        console.error('Error fetching blog for edit:', error);
        message.error('Could not load blog details');
      } finally {
        setFetchingBlog(false);
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id]);

  // Keep activeSlideIndex in bounds
  useEffect(() => {
    if (activeSlideIndex >= mediaItems.length && mediaItems.length > 0) {
      setActiveSlideIndex(0);
    }
  }, [mediaItems.length, activeSlideIndex]);

  const handleAddImageFile = (file) => {
    if (!file.type?.startsWith('image/')) {
      message.warning('Please select a valid image file');
      return false;
    }
    setMediaItems((prev) => {
      if (prev.length >= 5) {
        message.warning('You can upload up to 5 images per article');
        return prev;
      }
      const previewUrl = URL.createObjectURL(file);
      return [
        ...prev,
        {
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: previewUrl,
          file,
          isExisting: false,
        },
      ];
    });
    return false; // Prevent AntD auto-upload
  };

  const handleRemoveImage = (targetId) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== targetId));
  };

  const handleSetFeaturedCover = (index) => {
    if (index === 0) return;
    setMediaItems((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
    setActiveSlideIndex(0);
    message.success('Set as primary featured cover image');
  };

  const handleAddTag = (rawValue) => {
    const cleaned = String(rawValue || tagInput)
      .replace(/^#/, '')
      .trim();
    if (!cleaned) return;
    if (tags.length >= 8) {
      message.warning('Up to 8 tags allowed');
      return;
    }
    if (!tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const setQuickSchedule = (preset) => {
    setPublishMode('schedule');
    const now = dayjs();
    if (preset === 'tomorrow9') {
      setScheduledDate(now.add(1, 'day').hour(9).minute(0).second(0));
    } else if (preset === 'friday9') {
      // Next Friday (day 5)
      const currentDay = now.day();
      const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
      setScheduledDate(now.add(daysUntilFriday, 'day').hour(9).minute(0).second(0));
    } else if (preset === 'monday9') {
      const currentDay = now.day();
      const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
      setScheduledDate(now.add(daysUntilMonday, 'day').hour(9).minute(0).second(0));
    }
  };

  const handleSubmit = async (overrideMode = null) => {
    const effectiveMode = overrideMode || publishMode;

    if (!title.trim()) {
      message.error('Please enter a title for your story');
      return;
    }
    if (!stripHtml(content)) {
      message.error('Please add content to your story');
      return;
    }
    if (mediaItems.length === 0) {
      message.error('Please select at least 1 featured image (up to 5 allowed)');
      return;
    }
    if (effectiveMode === 'schedule' && (!scheduledDate || scheduledDate.toDate() <= new Date())) {
      message.error('Please choose a future date and time for scheduled publishing');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('subtitle', subtitle.trim());
    formData.append('content', content);
    formData.append('readTime', readTime || '3');
    formData.append('category', category);
    formData.append('allowComments', String(allowComments));
    formData.append('author', user._id);
    formData.append('tags', JSON.stringify(tags));

    // Separate existing image URLs vs newly uploaded files while preserving featured order
    const existingUrls = mediaItems.filter((m) => m.isExisting).map((m) => m.url);
    const newFiles = mediaItems.filter((m) => !m.isExisting && m.file).map((m) => m.file);

    formData.append('existingImages', JSON.stringify(existingUrls));
    newFiles.forEach((file) => {
      formData.append('images', file);
    });

    if (effectiveMode === 'draft') {
      formData.append('status', 'draft');
    } else if (effectiveMode === 'schedule' && scheduledDate) {
      formData.append('status', 'scheduled');
      formData.append('publishDate', scheduledDate.toDate().toISOString());
      formData.append('date', scheduledDate.toDate().toISOString());
    } else {
      formData.append('status', 'published');
      formData.append('publishDate', new Date().toISOString());
    }

    try {
      setSubmitting(true);
      setPublishStage(
        newFiles.length > 0
          ? `Uploading ${newFiles.length} ${newFiles.length === 1 ? 'image' : 'images'}...`
          : 'Saving story metadata...'
      );

      const stageTimer = setTimeout(() => {
        setPublishStage(
          effectiveMode === 'schedule'
            ? 'Scheduling publication...'
            : effectiveMode === 'draft'
            ? 'Saving draft...'
            : 'Publishing story...'
        );
      }, 900);

      if (id) {
        await axiosInstance.put(`/api/blogs/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        });
        clearTimeout(stageTimer);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['blogs'] }),
          queryClient.invalidateQueries({ queryKey: ['blog', id] }),
          queryClient.invalidateQueries({ queryKey: ['postedBlogs'] }),
        ]);
        message.success(
          effectiveMode === 'schedule'
            ? `Story scheduled for ${scheduledDate.format('ddd, MMM D · h:mm A')}`
            : 'Story updated successfully'
        );
        navigate(effectiveMode === 'schedule' || effectiveMode === 'draft' ? '/profile' : `/blog/${id}`);
      } else {
        await axiosInstance.post('/api/blogs', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        });
        clearTimeout(stageTimer);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['blogs'] }),
          queryClient.invalidateQueries({ queryKey: ['postedBlogs'] }),
        ]);

        if (effectiveMode === 'schedule') {
          message.success(
            `Scheduled for ${scheduledDate.format('ddd, MMM D · h:mm A')}! Visible in your Profile until publication.`
          );
          navigate('/profile');
        } else if (effectiveMode === 'draft') {
          message.success('Saved to your profile drafts');
          navigate('/profile');
        } else {
          message.success('Story published live!');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error submitting blog:', error);
      message.error(error.response?.data?.message || 'There was an error saving your story');
    } finally {
      setSubmitting(false);
      setPublishStage('');
    }
  };

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    }),
    []
  );

  const suggestedTags =
    CATEGORY_TAG_SUGGESTIONS[category] || CATEGORY_TAG_SUGGESTIONS.Default;

  const primaryActionLabel = () => {
    if (submitting) {
      if (publishMode === 'schedule') return 'Scheduling...';
      if (publishMode === 'draft') return 'Saving Draft...';
      return id ? 'Updating...' : 'Publishing...';
    }
    if (publishMode === 'schedule') {
      return scheduledDate
        ? `Schedule · ${scheduledDate.format('MMM D, h:mm A')}`
        : 'Schedule Story';
    }
    if (publishMode === 'draft') {
      return 'Save as Draft';
    }
    return id ? 'Update Story' : 'Publish Now';
  };

  if (fetchingBlog) {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh' }}>
        <Navbar />
        <div
          style={{
            paddingTop: '180px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: '#111827' }} spin />} />
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Loading story studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-page">
      <Navbar />

      {/* Full-Screen Publishing Overlay Banner when Submitting */}
      {submitting && (
        <div className="studio-publishing-overlay">
          <div className="studio-publishing-card">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 34, color: '#111827' }} spin />}
            />
            <h3 className="studio-publishing-title">
              {publishMode === 'schedule'
                ? 'Scheduling Your Story'
                : publishMode === 'draft'
                ? 'Saving Your Draft'
                : id
                ? 'Updating Your Story'
                : 'Publishing Your Story'}
            </h3>
            <p className="studio-publishing-stage">{publishStage || 'Processing...'}</p>
          </div>
        </div>
      )}

      {/* Sticky Top Editorial Studio Bar */}
      <div className="studio-topbar">
        <div className="studio-topbar__inner">
          <div className="studio-topbar__left">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="studio-back-btn"
            >
              <ArrowLeftOutlined style={{ fontSize: '12px' }} />
              <span>Exit</span>
            </button>
            <span className="studio-divider" />
            <span className="studio-status-label">
              {id ? 'Editing Story' : 'New Story'} · {wordCount} words · {readTime || 1} min read
            </span>
          </div>

          {/* Center View Switcher: Editor | Split | Interactive Preview */}
          <div className="studio-view-switcher">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`studio-view-btn ${viewMode === 'editor' ? 'is-active' : ''}`}
            >
              <EditOutlined /> <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`studio-view-btn ${viewMode === 'split' ? 'is-active' : ''}`}
            >
              <ColumnWidthOutlined /> <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`studio-view-btn ${viewMode === 'preview' ? 'is-active' : ''}`}
            >
              <EyeOutlined /> <span>Live Preview (Editable)</span>
            </button>
          </div>

          {/* Right Publish Actions */}
          <div className="studio-topbar__right">
            {publishMode !== 'draft' && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('draft')}
                className="studio-secondary-btn"
              >
                Save Draft
              </button>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit()}
              className="studio-primary-btn"
            >
              {submitting && <LoadingOutlined style={{ marginRight: 6 }} spin />}
              <span>{primaryActionLabel()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className={`studio-workspace mode-${viewMode}`}>
        {/* LEFT PANE: COMPOSER & SETTINGS */}
        {viewMode !== 'preview' && (
          <div className="studio-editor-pane">
            {/* Title & Subtitle Inputs */}
            <div className="studio-title-group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story Title..."
                className="studio-title-input"
              />
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Add a subtitle or deck (optional)..."
                className="studio-subtitle-input"
              />
            </div>

            {/* Multi-Image Gallery Manager (Up to 5 Images, 1st is Featured Cover) */}
            <div className="studio-section-block">
              <div className="studio-section-header">
                <div>
                  <span className="studio-section-title">
                    <PictureOutlined /> Story Images ({mediaItems.length}/5)
                  </span>
                  <span className="studio-section-hint">
                    The first image is the Featured Cover on the Blog List; all images appear in a slider on the Article Page.
                  </span>
                </div>
              </div>

              <div className="studio-media-grid">
                {mediaItems.map((item, idx) => {
                  const isFeatured = idx === 0;
                  return (
                    <div
                      key={item.id}
                      className={`studio-media-item ${isFeatured ? 'is-featured' : ''}`}
                    >
                      <img src={item.url} alt={`Upload ${idx + 1}`} className="studio-media-img" />

                      <div className="studio-media-badge">
                        {isFeatured ? (
                          <span className="studio-cover-pill">
                            <StarFilled style={{ fontSize: 10, color: '#fbbf24' }} /> Featured Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetFeaturedCover(idx)}
                            className="studio-make-cover-btn"
                            title="Set as primary featured image"
                          >
                            <StarOutlined style={{ fontSize: 10 }} /> Set as Cover
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(item.id)}
                        className="studio-media-remove"
                        aria-label="Remove image"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  );
                })}

                {mediaItems.length < 5 && (
                  <Upload
                    multiple
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleAddImageFile}
                  >
                    <div className="studio-media-add">
                      <PlusOutlined style={{ fontSize: '18px', color: '#111827' }} />
                      <span>Add Image</span>
                      <small>{5 - mediaItems.length} left</small>
                    </div>
                  </Upload>
                )}
              </div>
            </div>

            {/* Metadata Grid: Category, Read Time, Tags */}
            <div className="studio-meta-grid">
              <div className="studio-field">
                <label className="studio-label">Category</label>
                <Select
                  value={category}
                  onChange={(val) => setCategory(val)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {BLOG_CATEGORIES.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="studio-field">
                <div className="studio-label-row">
                  <label className="studio-label">
                    <ClockCircleOutlined /> Read Time (mins)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoReadTime(!autoReadTime)}
                    className="studio-mini-toggle"
                  >
                    {autoReadTime ? 'Auto-calculated' : 'Manual'}
                  </button>
                </div>
                <Input
                  size="large"
                  type="number"
                  min={1}
                  max={120}
                  value={readTime}
                  onChange={(e) => {
                    setAutoReadTime(false);
                    setReadTime(e.target.value);
                  }}
                  suffix="min read"
                />
              </div>
            </div>

            {/* Tags Manager */}
            <div className="studio-section-block">
              <label className="studio-label">
                <TagOutlined /> Story Tags ({tags.length}/8)
              </label>
              <div className="studio-tags-box">
                {tags.map((t) => (
                  <span key={t} className="studio-tag-chip">
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="studio-tag-chip__remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length < 8 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                        handleRemoveTag(tags[tags.length - 1]);
                      }
                    }}
                    onBlur={() => {
                      if (tagInput.trim()) handleAddTag();
                    }}
                    placeholder="Type a tag and press Enter..."
                    className="studio-tag-input"
                  />
                )}
              </div>
              <div className="studio-tag-suggestions">
                <span className="studio-tag-suggestions__label">Suggested:</span>
                {suggestedTags.map((sug) => {
                  const active = tags.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={active}
                      onClick={() => handleAddTag(sug)}
                      className={`studio-sug-chip ${active ? 'is-added' : ''}`}
                    >
                      +{sug}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Publishing Schedule & Options */}
            <div className="studio-section-block">
              <div className="studio-schedule-header">
                <label className="studio-label">
                  <CalendarOutlined /> Publication Timing
                </label>
                <Checkbox
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                >
                  Allow reader comments
                </Checkbox>
              </div>

              <div className="studio-publish-modes">
                {[
                  { key: 'now', label: 'Publish Immediately' },
                  { key: 'schedule', label: 'Schedule for Later' },
                  { key: 'draft', label: 'Save as Draft' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setPublishMode(m.key);
                      if (m.key === 'schedule' && !scheduledDate) {
                        setScheduledDate(dayjs().add(1, 'day').hour(9).minute(0));
                      }
                    }}
                    className={`studio-mode-btn ${publishMode === m.key ? 'is-active' : ''}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {publishMode === 'schedule' && (
                <div className="studio-schedule-panel">
                  <div className="studio-schedule-picker-row">
                    <DatePicker
                      showTime={{ format: 'HH:mm' }}
                      format="YYYY-MM-DD HH:mm"
                      value={scheduledDate}
                      onChange={(val) => setScheduledDate(val)}
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      placeholder="Select publication date & time"
                      size="large"
                      style={{ flex: 1 }}
                    />
                    <div className="studio-schedule-presets">
                      <button
                        type="button"
                        onClick={() => setQuickSchedule('tomorrow9')}
                        className="studio-preset-btn"
                      >
                        Tomorrow 9 AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickSchedule('friday9')}
                        className="studio-preset-btn"
                      >
                        This Friday 9 AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickSchedule('monday9')}
                        className="studio-preset-btn"
                      >
                        Next Monday 9 AM
                      </button>
                    </div>
                  </div>
                  {scheduledDate && (
                    <div className="studio-schedule-note">
                      <CheckCircleFilled style={{ color: '#111827' }} />
                      <span>
                        Will be published on{' '}
                        <strong>{scheduledDate.format('dddd, MMMM D, YYYY [at] h:mm A')}</strong>.
                        Until then, it will not appear on the public Blog List and will show on your
                        Profile as <strong>Not Yet Published</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rich Text Story Content Editor */}
            <div className="studio-quill-wrapper">
              <label className="studio-label">Story Body</label>
              <ReactQuill
                value={content}
                onChange={setContent}
                theme="snow"
                modules={quillModules}
                placeholder="Write your story here..."
              />
            </div>
          </div>
        )}

        {/* RIGHT PANE: INTERACTIVE LIVE PREVIEW (WITH DIRECT IN-PREVIEW EDITING!) */}
        {viewMode !== 'editor' && (
          <div className="studio-preview-pane">
            <div className="studio-preview-toolbar">
              <div className="studio-preview-toolbar__left">
                <span className="studio-preview-dot" />
                <span>Interactive Live Preview — click any text below to edit directly</span>
              </div>
              <div className="studio-preview-tabs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('article')}
                  className={`studio-preview-tab ${previewTab === 'article' ? 'is-active' : ''}`}
                >
                  Article Page
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('card')}
                  className={`studio-preview-tab ${previewTab === 'card' ? 'is-active' : ''}`}
                >
                  Feed Card
                </button>
              </div>
            </div>

            {previewTab === 'article' ? (
              /* INTERACTIVE ARTICLE PAGE PREVIEW */
              <div className="studio-article-preview">
                <div className="studio-preview-kicker">
                  <Select
                    variant="borderless"
                    size="small"
                    value={category}
                    onChange={(val) => setCategory(val)}
                    style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 12 }}
                  >
                    {BLOG_CATEGORIES.map((cat) => (
                      <Option key={cat} value={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Select>
                  <span>·</span>
                  <span>
                    {publishMode === 'schedule' && scheduledDate
                      ? `SCHEDULED: ${scheduledDate.format('MMM D, YYYY · h:mm A')}`
                      : moment().format('MMMM D, YYYY')}
                  </span>
                  <span>·</span>
                  <span>{readTime || 1} MIN READ</span>
                </div>

                {/* Editable Title Directly in Preview */}
                <Tooltip title="Click to edit title right in the preview">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Click here to type your headline..."
                    className="studio-preview-editable-title"
                  />
                </Tooltip>

                {/* Editable Subtitle Directly in Preview */}
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Click to add a subtitle..."
                  className="studio-preview-editable-subtitle"
                />

                {/* Author Byline Preview */}
                <div className="studio-preview-byline">
                  <div className="studio-preview-byline__author">
                    <div className="studio-preview-avatar">
                      {user?.username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="studio-preview-author-name">{user?.username || 'You'}</div>
                      <div className="studio-preview-author-sub">
                        {publishMode === 'schedule' ? 'Scheduled Post' : 'Published just now'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Multi-Image Slider in Preview */}
                {mediaItems.length > 0 ? (
                  <div className="studio-preview-slider">
                    <img
                      src={mediaItems[activeSlideIndex]?.url || mediaItems[0]?.url}
                      alt="Preview slide"
                      className="studio-preview-slider__img"
                    />
                    {mediaItems.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSlideIndex(
                              (prev) => (prev - 1 + mediaItems.length) % mediaItems.length
                            )
                          }
                          className="studio-preview-slider__arrow is-left"
                        >
                          <LeftOutlined />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSlideIndex((prev) => (prev + 1) % mediaItems.length)
                          }
                          className="studio-preview-slider__arrow is-right"
                        >
                          <RightOutlined />
                        </button>
                        <div className="studio-preview-slider__dots">
                          {mediaItems.map((m, idx) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setActiveSlideIndex(idx)}
                              className={`studio-preview-slider__dot ${
                                activeSlideIndex === idx ? 'is-active' : ''
                              }`}
                            />
                          ))}
                        </div>
                        <div className="studio-preview-slider__count">
                          {activeSlideIndex + 1} / {mediaItems.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Upload
                    multiple
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleAddImageFile}
                  >
                    <div className="studio-preview-empty-cover">
                      <PictureOutlined style={{ fontSize: 28 }} />
                      <span>Click to add up to 5 cover images</span>
                    </div>
                  </Upload>
                )}

                {/* Editable Story Body Directly inside the Preview */}
                <div className="studio-preview-body-hint">
                  Editable body preview (click below to edit text directly):
                </div>
                <div
                  ref={previewBodyRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      content ||
                      '<p style="color:#9ca3af;">Start writing your story in the editor or click right here to type directly in the preview...</p>'
                    ),
                  }}
                  className="studio-preview-prose"
                />

                {/* Tags Preview */}
                {tags.length > 0 && (
                  <div className="studio-preview-tags">
                    {tags.map((t) => (
                      <span key={t} className="studio-preview-tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* BLOG LIST CARD PREVIEW (Shows Featured Image #1 + Tags) */
              <div className="studio-card-preview-wrap">
                <div className="studio-card-preview-note">
                  This is how your story will appear on the Blog List (featuring Cover Image #1):
                </div>
                <div className="studio-mock-card">
                  <div className="studio-mock-card__media">
                    {mediaItems[0]?.url ? (
                      <img
                        src={mediaItems[0].url}
                        alt="Featured Cover"
                        className="studio-mock-card__img"
                      />
                    ) : (
                      <div className="studio-mock-card__placeholder">No cover image yet</div>
                    )}
                    <span className="studio-mock-card__cat">{category}</span>
                    {mediaItems.length > 1 && (
                      <span className="studio-mock-card__gallery-badge">
                        1/{mediaItems.length} photos
                      </span>
                    )}
                  </div>
                  <div className="studio-mock-card__body">
                    <div className="studio-mock-card__meta">
                      <span>
                        {publishMode === 'schedule' && scheduledDate
                          ? scheduledDate.format('DD MMM YYYY')
                          : moment().format('DD MMM YYYY')}
                      </span>
                      <span>•</span>
                      <span>{readTime || 1} min read</span>
                    </div>
                    <h4 className="studio-mock-card__title">
                      {title || 'Your Story Title Will Appear Here'}
                    </h4>
                    <p className="studio-mock-card__excerpt">
                      {subtitle ||
                        stripHtml(content).slice(0, 120) ||
                        'Your story excerpt will be displayed here...'}
                    </p>
                    {tags.length > 0 && (
                      <div className="studio-mock-card__tags">
                        {tags.slice(0, 3).map((t) => (
                          <span key={t} className="studio-mock-card__tag">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .studio-page {
          background: #ffffff;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #111827;
          padding-bottom: 80px;
        }
        .studio-publishing-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .studio-publishing-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 36px 48px;
          text-align: center;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
        }
        .studio-publishing-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.6rem;
          font-weight: 500;
          margin: 16px 0 6px;
          color: #111827;
        }
        .studio-publishing-stage {
          font-size: 13.5px;
          color: #6b7280;
          margin: 0;
        }
        .studio-topbar {
          position: sticky;
          top: 76px;
          z-index: 90;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          margin-top: 84px;
        }
        .studio-topbar__inner {
          max-width: 1440px;
          width: 95%;
          margin: 0 auto;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .studio-topbar__inner {
            max-width: 1620px;
          }
        }
        @media (min-width: 1920px) {
          .studio-topbar__inner {
            max-width: 1780px;
            width: 96%;
          }
        }
        .studio-topbar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .studio-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: #4b5563;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .studio-back-btn:hover {
          color: #111827;
          background: #f3f4f6;
        }
        .studio-divider {
          width: 1px;
          height: 16px;
          background: #e5e7eb;
        }
        .studio-status-label {
          font-size: 12.5px;
          color: #6b7280;
          font-weight: 500;
        }
        .studio-view-switcher {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          background: #f3f4f6;
          border-radius: 8px;
        }
        .studio-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .studio-view-btn.is-active {
          background: #ffffff;
          color: #111827;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .studio-topbar__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .studio-secondary-btn {
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .studio-secondary-btn:hover {
          border-color: #111827;
          color: #111827;
        }
        .studio-primary-btn {
          padding: 8px 20px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .studio-primary-btn:hover {
          opacity: 0.9;
        }
        .studio-primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .studio-workspace {
          max-width: 1440px;
          width: 95%;
          margin: 28px auto 0;
          display: grid;
          gap: 36px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .studio-workspace {
            max-width: 1620px;
            gap: 44px;
          }
          .studio-workspace.mode-editor,
          .studio-workspace.mode-preview {
            grid-template-columns: minmax(0, 960px);
          }
        }
        @media (min-width: 1920px) {
          .studio-workspace {
            max-width: 1780px;
            width: 96%;
            gap: 52px;
          }
          .studio-workspace.mode-editor,
          .studio-workspace.mode-preview {
            grid-template-columns: minmax(0, 1040px);
          }
        }
        .studio-workspace.mode-split {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }
        .studio-workspace.mode-editor,
        .studio-workspace.mode-preview {
          grid-template-columns: minmax(0, 860px);
          justify-content: center;
        }
        @media (max-width: 1024px) {
          .studio-workspace.mode-split {
            grid-template-columns: 1fr;
          }
        }
        .studio-editor-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .studio-title-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .studio-title-input {
          border: none;
          outline: none;
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(1.85rem, 3vw, 2.5rem);
          font-weight: 500;
          color: #111827;
          width: 100%;
          line-height: 1.15;
        }
        .studio-title-input::placeholder {
          color: #9ca3af;
        }
        .studio-subtitle-input {
          border: none;
          outline: none;
          font-size: 1.05rem;
          color: #4b5563;
          width: 100%;
        }
        .studio-subtitle-input::placeholder {
          color: #9ca3af;
        }
        .studio-section-block {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fafafa;
        }
        .studio-section-header {
          margin-bottom: 12px;
        }
        .studio-section-title {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2px;
        }
        .studio-section-hint {
          font-size: 12px;
          color: #6b7280;
        }
        .studio-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
          gap: 12px;
        }
        .studio-media-item {
          position: relative;
          height: 105px;
          border-radius: 8px;
          overflow: hidden;
          border: 1.5px solid #e5e7eb;
          background: #ffffff;
        }
        .studio-media-item.is-featured {
          border-color: #111827;
          border-width: 2px;
        }
        .studio-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .studio-media-badge {
          position: absolute;
          left: 6px;
          bottom: 6px;
        }
        .studio-cover-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(17, 24, 39, 0.88);
          color: #ffffff;
          font-size: 10px;
          font-weight: 600;
        }
        .studio-make-cover-btn {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 7px;
          border-radius: 4px;
          border: none;
          background: rgba(255, 255, 255, 0.92);
          color: #111827;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .studio-media-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(17, 24, 39, 0.78);
          color: #ffffff;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .studio-media-add {
          height: 105px;
          border-radius: 8px;
          border: 1.5px dashed #d1d5db;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          transition: border-color 0.15s ease;
        }
        .studio-media-add:hover {
          border-color: #111827;
        }
        .studio-media-add small {
          font-size: 10.5px;
          color: #9ca3af;
          font-weight: 500;
        }
        .studio-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .studio-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .studio-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .studio-label {
          font-size: 12.5px;
          font-weight: 700;
          color: #111827;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .studio-mini-toggle {
          border: none;
          background: transparent;
          font-size: 11px;
          color: #6b7280;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }
        .studio-tags-box {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 10px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          min-height: 42px;
        }
        .studio-tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
        }
        .studio-tag-chip__remove {
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
          line-height: 1;
        }
        .studio-tag-chip__remove:hover {
          color: #ffffff;
        }
        .studio-tag-input {
          border: none;
          outline: none;
          flex: 1;
          min-width: 140px;
          font-size: 13px;
          color: #111827;
        }
        .studio-tag-suggestions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .studio-tag-suggestions__label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
        }
        .studio-sug-chip {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #4b5563;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          cursor: pointer;
        }
        .studio-sug-chip:hover:not(:disabled) {
          border-color: #111827;
          color: #111827;
        }
        .studio-sug-chip.is-added {
          opacity: 0.45;
          cursor: default;
        }
        .studio-schedule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .studio-publish-modes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .studio-mode-btn {
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #4b5563;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .studio-mode-btn.is-active {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }
        .studio-schedule-panel {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .studio-schedule-picker-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .studio-schedule-presets {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .studio-preset-btn {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          font-size: 11.5px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }
        .studio-preset-btn:hover {
          border-color: #111827;
          color: #111827;
        }
        .studio-schedule-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f3f4f6;
          font-size: 12px;
          color: #374151;
          line-height: 1.45;
        }
        .studio-quill-wrapper .ql-container {
          min-height: 320px;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.15rem;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .studio-quill-wrapper .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background: #fafafa;
        }

        /* LIVE PREVIEW PANE */
        .studio-preview-pane {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-self: start;
          position: sticky;
          top: 148px;
          max-height: calc(100vh - 168px);
          overflow-y: auto;
        }
        .studio-preview-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          position: sticky;
          top: 0;
          z-index: 5;
        }
        .studio-preview-toolbar__left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        .studio-preview-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }
        .studio-preview-tabs {
          display: flex;
          gap: 4px;
        }
        .studio-preview-tab {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          font-size: 11.5px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
        }
        .studio-preview-tab.is-active {
          background: #ffffff;
          border-color: #e5e7eb;
          color: #111827;
        }
        .studio-article-preview {
          padding: 28px 32px 40px;
        }
        .studio-preview-kicker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 12px;
        }
        .studio-preview-editable-title {
          width: 100%;
          border: 1px dashed transparent;
          border-radius: 6px;
          padding: 4px 6px;
          margin: 0 -6px 8px;
          font-family: 'Newsreader', Georgia, serif;
          font-size: 2.1rem;
          font-weight: 500;
          color: #111827;
          line-height: 1.15;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .studio-preview-editable-title:hover,
        .studio-preview-editable-title:focus {
          border-color: #d1d5db;
          background: #fafafa;
        }
        .studio-preview-editable-subtitle {
          width: 100%;
          border: 1px dashed transparent;
          border-radius: 6px;
          padding: 4px 6px;
          margin: 0 -6px 16px;
          font-size: 1rem;
          color: #6b7280;
          outline: none;
        }
        .studio-preview-editable-subtitle:hover,
        .studio-preview-editable-subtitle:focus {
          border-color: #d1d5db;
          background: #fafafa;
        }
        .studio-preview-byline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 22px;
        }
        .studio-preview-byline__author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .studio-preview-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #111827;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }
        .studio-preview-author-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #111827;
        }
        .studio-preview-author-sub {
          font-size: 11.5px;
          color: #6b7280;
        }
        .studio-preview-slider {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
          background: #f3f4f6;
          height: 280px;
        }
        .studio-preview-slider__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .studio-preview-slider__arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(17, 24, 39, 0.72);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
        }
        .studio-preview-slider__arrow.is-left { left: 12px; }
        .studio-preview-slider__arrow.is-right { right: 12px; }
        .studio-preview-slider__dots {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
        }
        .studio-preview-slider__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.5);
          padding: 0;
          cursor: pointer;
        }
        .studio-preview-slider__dot.is-active {
          background: #ffffff;
          width: 18px;
          border-radius: 999px;
        }
        .studio-preview-slider__count {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.72);
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
        }
        .studio-preview-empty-cover {
          height: 180px;
          border-radius: 10px;
          border: 1.5px dashed #d1d5db;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 24px;
        }
        .studio-preview-body-hint {
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 6px;
        }
        .studio-preview-prose {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.15rem;
          line-height: 1.75;
          color: #1f2937;
          min-height: 180px;
          padding: 8px;
          margin: 0 -8px;
          border: 1px dashed transparent;
          border-radius: 8px;
          outline: none;
        }
        .studio-preview-prose:hover,
        .studio-preview-prose:focus {
          border-color: #d1d5db;
          background: #fafafa;
        }
        .studio-preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .studio-preview-tag {
          font-size: 12px;
          color: #4b5563;
          background: #f3f4f6;
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 500;
        }
        .studio-card-preview-wrap {
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .studio-card-preview-note {
          font-size: 12.5px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        .studio-mock-card {
          width: 100%;
          max-width: 370px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.08);
        }
        .studio-mock-card__media {
          position: relative;
          height: 195px;
          background: #111827;
        }
        .studio-mock-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .studio-mock-card__placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 13px;
        }
        .studio-mock-card__cat {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.8);
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
        }
        .studio-mock-card__gallery-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.78);
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 600;
        }
        .studio-mock-card__body {
          padding: 16px 18px;
        }
        .studio-mock-card__meta {
          display: flex;
          gap: 6px;
          font-size: 11.5px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .studio-mock-card__title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px;
        }
        .studio-mock-card__excerpt {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .studio-mock-card__tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .studio-mock-card__tag {
          font-size: 11px;
          color: #4b5563;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
};

export default BlogForm;
