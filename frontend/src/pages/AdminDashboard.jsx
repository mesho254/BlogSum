import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import {
  Modal,
  Select,
  Switch,
  Tooltip,
  Popconfirm,
  Tag,
  Avatar,
  message,
  Empty,
  Spin,
  Table,
  Input,
} from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  CommentOutlined,
  SoundOutlined,
  SettingOutlined,
  StarFilled,
  StarOutlined,
  PushpinFilled,
  PushpinOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleFilled,
  StopOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  SearchOutlined,
  SendOutlined,
  MailOutlined,
  SafetyCertificateFilled,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  FireOutlined,
  UserAddOutlined,
  CompassOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
  SolutionOutlined,
  FilePdfOutlined,
  PaperClipOutlined,
  LinkOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = [
  'Technology',
  'Health',
  'Lifestyle',
  'Education',
  'Travel',
  'Business',
  'Finance',
  'Design',
  'Science',
  'Culture',
  'Food',
  'Productivity',
  'Career',
  'Entertainment',
  'Sports',
];

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [overview, setOverview] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [careerSubTab, setCareerSubTab] = useState('openings'); // 'openings' | 'applications'
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [selectedAppModal, setSelectedAppModal] = useState({ open: false, application: null });
  const [adminAppNotes, setAdminAppNotes] = useState('');
  const [updatingAppStatus, setUpdatingAppStatus] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'BlogSum',
    siteTagline:
      'An independent digital publication for thoughtful essays, technical deep-dives, and cultural perspectives.',
    supportEmail: 'support@blogsum.com',
    announcementEnabled: false,
    announcementText: 'Welcome to the new BlogSum editorial publishing studio.',
    announcementLink: '/createBlog',
    announcementLinkLabel: 'Write a Story',
    allowRegistrations: true,
    allowCommentsGlobal: true,
    maintenanceMode: false,
    maintenanceMessage:
      'BlogSum is undergoing scheduled editorial maintenance. Please check back shortly.',
    maxImagesPerPost: 5,
    featuredBannerLimit: 5,
    socialLinks: {
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com',
      facebook: 'https://facebook.com',
      discord: 'https://discord.com',
      tiktok: 'https://tiktok.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
    customTermsText: '',
    customPrivacyText: '',
    customReturnText: '',
    customFaqs: [],
  });

  // Filters & Modals for Inquiries (Contacts)
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [selectedInquiryModal, setSelectedInquiryModal] = useState({ open: false, inquiry: null });

  // Audit Logs State (Governance & Security)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const { data } = await axiosInstance.get('/api/admin/audit-logs');
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesFilter = auditFilter === 'all' || log.actionType === auditFilter;
      const term = auditSearch.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (log.adminUsername || '').toLowerCase().includes(term) ||
        (log.targetLabel || '').toLowerCase().includes(term) ||
        (log.actionType || '').toLowerCase().includes(term) ||
        (log.ipAddress || '').includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [auditLogs, auditFilter, auditSearch]);

  // Filters & Modals for Careers (Jobs)
  const [jobModal, setJobModal] = useState({ open: false, isEditing: false, job: null });
  const [jobForm, setJobForm] = useState({
    title: '',
    department: 'Editorial',
    location: 'Remote',
    type: 'Full-Time',
    experience: 'Mid-Level',
    salaryRange: '',
    description: '',
    responsibilities: '',
    requirements: '',
    perks: '',
    tags: '',
    applyEmail: 'careers@blogsum.com',
    isActive: true,
  });
  const [savingJob, setSavingJob] = useState(false);

  // Draft new FAQ state for Platform Settings
  const [newFaq, setNewFaq] = useState({ category: 'General', question: '', answer: '' });

  // Filters & Selections for Blogs
  const [blogSearch, setBlogSearch] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState('all');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [selectedBlogIds, setSelectedBlogIds] = useState([]);
  const [runningScheduler, setRunningScheduler] = useState(false);

  // Filters & Modals for Users
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    roles: 'other',
    isVerified: false,
    location: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const [editUserModal, setEditUserModal] = useState({ open: false, user: null });
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    location: '',
    bio: '',
    roles: 'other',
    isVerified: false,
    isSuspended: false,
    newPassword: '',
  });
  const [savingUser, setSavingUser] = useState(false);

  // Filters for Comments
  const [commentSearch, setCommentSearch] = useState('');

  // Broadcast & Newsletter states
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementRole, setAnnouncementRole] = useState('all');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [subscriberSearch, setSubscriberSearch] = useState('');

  // Settings saving state
  const [savingSettings, setSavingSettings] = useState(false);

  const computeClientFallbackOverview = (rawBlogs = [], rawUsers = [], rawSubs = [], rawChannels = []) => {
    const safeBlogs = Array.isArray(rawBlogs) ? rawBlogs : [];
    const safeUsers = Array.isArray(rawUsers) ? rawUsers : [];

    let publishedBlogs = 0;
    let scheduledBlogs = 0;
    let draftBlogs = 0;
    let featuredBlogs = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalBookmarks = 0;
    let totalShares = 0;

    const categoryMap = {};
    const authorStatsMap = {};
    const statsByUser = {};
    const extractedComments = [];

    const enrichedBlogs = safeBlogs.map((blog) => {
      const pubTime = blog.publishDate || blog.date;
      const effStatus =
        blog.status === 'draft'
          ? 'draft'
          : blog.status === 'scheduled' || (pubTime && new Date(pubTime) > new Date())
          ? 'scheduled'
          : 'published';

      if (effStatus === 'published') publishedBlogs += 1;
      else if (effStatus === 'scheduled') scheduledBlogs += 1;
      else if (effStatus === 'draft') draftBlogs += 1;
      if (blog.isFeatured) featuredBlogs += 1;

      const likesCount = Array.isArray(blog.likes) ? blog.likes.length : 0;
      const bookmarksCount = Array.isArray(blog.bookmarks) ? blog.bookmarks.length : 0;
      const sharesCount = Array.isArray(blog.shares) ? blog.shares.length : 0;
      const topComments = Array.isArray(blog.comments) ? blog.comments : [];
      const repliesCount = topComments.reduce(
        (sum, c) => sum + (Array.isArray(c.replies) ? c.replies.length : 0),
        0
      );
      const blogCommentsCount = topComments.length + repliesCount;

      totalLikes += likesCount;
      totalComments += blogCommentsCount;
      totalBookmarks += bookmarksCount;
      totalShares += sharesCount;

      topComments.forEach((c) => {
        extractedComments.push({
          _id: String(c._id),
          commentId: String(c._id),
          replyId: null,
          isReply: false,
          blogId: String(blog._id),
          blogTitle: blog.title,
          blogCategory: blog.category,
          user: c.user || { username: 'Reader' },
          comment: c.comment,
          attachment: c.attachment || '',
          date: c.date,
          likesCount: Array.isArray(c.likes) ? c.likes.length : 0,
        });
        (c.replies || []).forEach((r) => {
          extractedComments.push({
            _id: `${c._id}_${r._id}`,
            commentId: String(c._id),
            replyId: String(r._id),
            isReply: true,
            blogId: String(blog._id),
            blogTitle: blog.title,
            blogCategory: blog.category,
            user: r.user || { username: 'Reader' },
            comment: r.comment,
            attachment: '',
            date: r.date,
            likesCount: Array.isArray(r.likes) ? r.likes.length : 0,
          });
        });
      });

      const cat = blog.category || 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, count: 0, likes: 0, comments: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].likes += likesCount;
      categoryMap[cat].comments += blogCommentsCount;

      const authorId = blog.author?._id ? String(blog.author._id) : String(blog.author || '');
      if (authorId) {
        if (!authorStatsMap[authorId]) {
          authorStatsMap[authorId] = {
            _id: authorId,
            username: blog.author?.username || 'Author',
            email: blog.author?.email || '',
            profilePicture: blog.author?.profilePicture || '',
            isVerified: Boolean(blog.author?.isVerified),
            roles: blog.author?.roles || 'other',
            postsCount: 0,
            likesReceived: 0,
            commentsReceived: 0,
          };
        }
        authorStatsMap[authorId].postsCount += 1;
        authorStatsMap[authorId].likesReceived += likesCount;
        authorStatsMap[authorId].commentsReceived += blogCommentsCount;

        if (!statsByUser[authorId]) {
          statsByUser[authorId] = {
            blogsCount: 0,
            publishedCount: 0,
            scheduledCount: 0,
            draftCount: 0,
            totalLikesReceived: 0,
            totalCommentsReceived: 0,
          };
        }
        statsByUser[authorId].blogsCount += 1;
        if (effStatus === 'published') statsByUser[authorId].publishedCount += 1;
        else if (effStatus === 'scheduled') statsByUser[authorId].scheduledCount += 1;
        else if (effStatus === 'draft') statsByUser[authorId].draftCount += 1;
        statsByUser[authorId].totalLikesReceived += likesCount;
        statsByUser[authorId].totalCommentsReceived += blogCommentsCount;
      }

      return {
        ...blog,
        effectiveStatus: effStatus,
        likesCount,
        bookmarksCount,
        sharesCount,
        commentsCount: blogCommentsCount,
      };
    });

    const enrichedUsers = safeUsers.map((u) => {
      const uid = String(u._id);
      const st = statsByUser[uid] || {
        blogsCount: 0,
        publishedCount: 0,
        scheduledCount: 0,
        draftCount: 0,
        totalLikesReceived: 0,
        totalCommentsReceived: 0,
      };
      const effectiveRole =
        u.roles === 'admin' || String(u.username || '').toLowerCase() === 'admin'
          ? 'admin'
          : u.roles || 'other';
      return {
        ...u,
        roles: effectiveRole,
        isVerified: Boolean(u.isVerified),
        isSuspended: Boolean(u.isSuspended),
        followersCount: Array.isArray(u.followers) ? u.followers.length : 0,
        followingCount: Array.isArray(u.following) ? u.following.length : 0,
        ...st,
      };
    });

    const topStories = [...enrichedBlogs]
      .map((b) => ({
        _id: b._id,
        title: b.title,
        category: b.category,
        author: b.author,
        status: b.effectiveStatus,
        isFeatured: Boolean(b.isFeatured),
        date: b.publishDate || b.date,
        likesCount: b.likesCount,
        commentsCount: b.commentsCount,
        bookmarksCount: b.bookmarksCount,
        engagementScore: b.likesCount * 2 + b.commentsCount * 3 + b.bookmarksCount * 2,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 6);

    const topAuthors = Object.values(authorStatsMap)
      .sort((a, b) => b.likesReceived - a.likesReceived || b.postsCount - a.postsCount)
      .slice(0, 6);

    return {
      counts: {
        totalBlogs: enrichedBlogs.length,
        publishedBlogs,
        scheduledBlogs,
        draftBlogs,
        featuredBlogs,
        totalUsers: Math.max(enrichedUsers.length, Object.keys(authorStatsMap).length),
        adminUsers: Math.max(enrichedUsers.filter((u) => u.roles === 'admin').length, 1),
        editorUsers: enrichedUsers.filter((u) => u.roles === 'editor').length,
        verifiedUsers: enrichedUsers.filter((u) => u.isVerified).length,
        suspendedUsers: enrichedUsers.filter((u) => u.isSuspended).length,
        totalLikes,
        totalComments,
        totalBookmarks,
        totalShares,
        subscribersCount: rawSubs.length,
        channelsCount: rawChannels.length,
      },
      categoryBreakdown: Object.values(categoryMap).sort((a, b) => b.count - a.count),
      topStories,
      topAuthors,
      blogs: enrichedBlogs,
      users: enrichedUsers.length > 0 ? enrichedUsers : Object.values(authorStatsMap),
      comments: extractedComments,
    };
  };

  const applyAdminPayload = (data) => {
    if (!data) return;
    setOverview(data);
    if (Array.isArray(data.blogs)) setBlogs(data.blogs);
    if (Array.isArray(data.users)) setUsers(data.users);
    if (Array.isArray(data.comments)) setComments(data.comments);
    if (Array.isArray(data.subscribers)) setSubscribers(data.subscribers);
    if (Array.isArray(data.channels)) setChannels(data.channels);
    if (Array.isArray(data.contacts)) setContacts(data.contacts);
    if (Array.isArray(data.jobs)) setJobs(data.jobs);
    if (Array.isArray(data.applications)) setApplications(data.applications);
    if (data.settings) {
      setSiteSettings((prev) => ({ ...prev, ...data.settings }));
    }
  };

  const fetchAllAdminData = async (silent = false) => {
    if (!silent) {
      // Seed immediately from cached blogs so KPI cards and tables are never 0 while loading
      const cachedBlogs =
        queryClient.getQueryData(['blogs']) ||
        (() => {
          try {
            const raw = localStorage.getItem('blogsum_blogs_cache');
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })();

      if (Array.isArray(cachedBlogs) && cachedBlogs.length > 0 && blogs.length === 0) {
        const seeded = computeClientFallbackOverview(cachedBlogs, users, subscribers, channels);
        applyAdminPayload(seeded);
        setLoading(false);
      } else {
        setLoading(true);
      }
    } else {
      setRefreshing(true);
    }

    // Single unified request to /api/admin/overview with automatic retry if server is restarting
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data } = await axiosInstance.get(
          `/api/admin/overview${silent ? '?refresh=true' : ''}`
        );
        applyAdminPayload(data);
        setLoading(false);
        setRefreshing(false);
        return;
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        if (status === 401 || status === 403) break;
        await new Promise((r) => setTimeout(r, 1100 * (attempt + 1)));
      }
    }

    // Fallback: if /api/admin/overview failed, fetch from /api/blogs + /api/auth/allUsers
    try {
      const [blogsFallback, usersFallback] = await Promise.allSettled([
        axiosInstance.get('/api/blogs'),
        axiosInstance.get('/api/auth/allUsers'),
      ]);
      const fbBlogs =
        blogsFallback.status === 'fulfilled' ? blogsFallback.value.data : blogs;
      const fbUsers =
        usersFallback.status === 'fulfilled' ? usersFallback.value.data : users;
      const computed = computeClientFallbackOverview(fbBlogs, fbUsers, subscribers, channels);
      applyAdminPayload(computed);
    } catch (fallbackErr) {
      console.error('Admin fallback fetch error:', fallbackErr || lastError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Filtered Blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const q = blogSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (b.title || '').toLowerCase().includes(q) ||
        (b.author?.username || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q) ||
        (Array.isArray(b.tags) && b.tags.some((t) => t.toLowerCase().includes(q)));

      const effStatus = b.effectiveStatus || b.status || 'published';
      const matchesStatus =
        blogStatusFilter === 'all'
          ? true
          : blogStatusFilter === 'featured'
          ? Boolean(b.isFeatured)
          : blogStatusFilter === 'pinned'
          ? Boolean(b.isPinned)
          : effStatus === blogStatusFilter;

      const matchesCategory =
        blogCategoryFilter === 'all' || b.category === blogCategoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [blogs, blogSearch, blogStatusFilter, blogCategoryFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q);

      const matchesRole =
        userRoleFilter === 'all'
          ? true
          : userRoleFilter === 'verified'
          ? Boolean(u.isVerified)
          : userRoleFilter === 'suspended'
          ? Boolean(u.isSuspended)
          : u.roles === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  // Filtered Comments
  const filteredComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase();
    if (!q) return comments;
    return comments.filter(
      (c) =>
        (c.comment || '').toLowerCase().includes(q) ||
        (c.user?.username || '').toLowerCase().includes(q) ||
        (c.blogTitle || '').toLowerCase().includes(q)
    );
  }, [comments, commentSearch]);

  // Filtered Subscribers
  const filteredSubscribers = useMemo(() => {
    const q = subscriberSearch.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => (s.email || '').toLowerCase().includes(q));
  }, [subscribers, subscriberSearch]);

  // --- Blog Admin Handlers ---
  const handleUpdateBlogField = async (blogId, payload, successText) => {
    try {
      const { data } = await axiosInstance.put(`/api/admin/blogs/${blogId}/status`, payload);
      setBlogs((prev) =>
        prev.map((b) => (String(b._id) === String(blogId) ? { ...b, ...data } : b))
      );
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      if (successText) message.success(successText);
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update story');
    }
  };

  const handleDeleteBlog = async (blogId) => {
    try {
      await axiosInstance.delete(`/api/blogs/${blogId}`);
      setBlogs((prev) => prev.filter((b) => String(b._id) !== String(blogId)));
      setSelectedBlogIds((prev) => prev.filter((id) => String(id) !== String(blogId)));
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      message.success('Story permanently deleted');
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to delete story');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedBlogIds.length === 0) return;
    try {
      const { data } = await axiosInstance.post('/api/admin/blogs/bulk', {
        blogIds: selectedBlogIds,
        action,
      });
      message.success(data.message || 'Bulk action completed');
      setSelectedBlogIds([]);
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Bulk action failed');
    }
  };

  const handleRunScheduler = async () => {
    setRunningScheduler(true);
    try {
      const { data } = await axiosInstance.post('/api/admin/blogs/run-scheduler');
      message.success(data.message || 'Scheduled publisher executed');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      fetchAllAdminData(true);
    } catch (error) {
      message.error('Failed to trigger scheduled publisher');
    } finally {
      setRunningScheduler(false);
    }
  };

  // --- User Admin Handlers ---
  const handleQuickUpdateUser = async (userId, payload, successText) => {
    try {
      const { data } = await axiosInstance.put(`/api/admin/users/${userId}`, payload);
      setUsers((prev) =>
        prev.map((u) => (String(u._id) === String(userId) ? { ...u, ...data } : u))
      );
      if (successText) message.success(successText);
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.email || !newUserForm.password) {
      message.warning('Username, email, and password are required');
      return;
    }
    setCreatingUser(true);
    try {
      await axiosInstance.post('/api/admin/users', newUserForm);
      message.success(`User @${newUserForm.username} created`);
      setCreateUserModalOpen(false);
      setNewUserForm({
        username: '',
        email: '',
        password: '',
        roles: 'other',
        isVerified: false,
        location: '',
      });
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const openEditUserModal = (targetUser) => {
    setEditUserForm({
      username: targetUser.username || '',
      email: targetUser.email || '',
      location: targetUser.location || '',
      bio: targetUser.bio || '',
      roles: targetUser.roles || 'other',
      isVerified: Boolean(targetUser.isVerified),
      isSuspended: Boolean(targetUser.isSuspended),
      newPassword: '',
    });
    setEditUserModal({ open: true, user: targetUser });
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editUserModal.user) return;
    setSavingUser(true);
    try {
      await axiosInstance.put(`/api/admin/users/${editUserModal.user._id}`, editUserForm);
      message.success(`Updated @${editUserForm.username}`);
      setEditUserModal({ open: false, user: null });
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId, deleteBlogs = false) => {
    try {
      const { data } = await axiosInstance.delete(
        `/api/admin/users/${userId}?deleteBlogs=${deleteBlogs}`
      );
      message.success(data.message || 'User removed');
      fetchAllAdminData(true);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  // --- Comment Admin Handlers ---
  const handleDeleteComment = async (item) => {
    try {
      const query = item.replyId ? `?replyId=${item.replyId}` : '';
      await axiosInstance.delete(
        `/api/admin/blogs/${item.blogId}/comments/${item.commentId}${query}`
      );
      setComments((prev) => prev.filter((c) => c._id !== item._id));
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      message.success('Comment removed');
      fetchAllAdminData(true);
    } catch (error) {
      message.error('Failed to delete comment');
    }
  };

  // --- Communications & Subscribers Handlers ---
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementText.trim()) {
      message.warning('Please enter an announcement message');
      return;
    }
    setSendingAnnouncement(true);
    try {
      const { data } = await axiosInstance.post('/api/admin/announcements', {
        message: announcementText.trim(),
        targetRole: announcementRole,
      });
      message.success(data.message || 'Announcement broadcasted!');
      setAnnouncementText('');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to broadcast announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterSubject.trim() || !newsletterBody.trim()) {
      message.warning('Subject and message body are required');
      return;
    }
    setSendingNewsletter(true);
    try {
      await axiosInstance.post('/api/subscribe/send-news', {
        subject: newsletterSubject.trim(),
        message: newsletterBody.trim(),
      });
      message.success('Newsletter dispatched to all subscribers!');
      setNewsletterSubject('');
      setNewsletterBody('');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to send newsletter');
    } finally {
      setSendingNewsletter(false);
    }
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newSubscriberEmail.trim()) return;
    try {
      const { data } = await axiosInstance.post('/api/admin/subscribers', {
        email: newSubscriberEmail.trim(),
      });
      setSubscribers((prev) => [data, ...prev]);
      setNewSubscriberEmail('');
      message.success('Subscriber added');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to add subscriber');
    }
  };

  const handleDeleteSubscriber = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/subscribers/${id}`);
      setSubscribers((prev) => prev.filter((s) => String(s._id) !== String(id)));
      message.success('Subscriber removed');
    } catch (error) {
      message.error('Failed to remove subscriber');
    }
  };

  const handleDeleteChannel = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/channels/${id}`);
      setChannels((prev) => prev.filter((c) => String(c._id) !== String(id)));
      message.success('Channel deleted');
    } catch (error) {
      message.error('Failed to delete channel');
    }
  };

  // --- Site Settings Handler ---
  const handleSaveSiteSettings = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    try {
      const { data } = await axiosInstance.put('/api/admin/settings', siteSettings);
      setSiteSettings((prev) => ({ ...prev, ...data }));
      queryClient.invalidateQueries({ queryKey: ['publicSiteSettings'] });
      message.success('Global platform settings saved');
    } catch (error) {
      message.error('Failed to save platform settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Export platform data snapshot
  const handleExportSnapshot = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: user?.username,
      counts: overview?.counts,
      siteSettings,
      blogsCount: blogs.length,
      usersCount: users.length,
      subscribersCount: subscribers.length,
      blogs,
      users,
      subscribers,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blogsum-admin-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Platform snapshot downloaded');
  };

  const handleExportSubscribersCsv = () => {
    const rows = [
      ['Email', 'Subscribed At'],
      ...subscribers.map((s) => [
        s.email,
        s.subscribedAt ? new Date(s.subscribedAt).toISOString() : '',
      ]),
    ];
    const csvContent = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blogsum-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Subscribers CSV exported');
  };

  // --- Inquiries & Support Handlers ---
  const handleUpdateInquiryStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/api/admin/contacts/${id}`, { status });
      setContacts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status } : c))
      );
      if (selectedInquiryModal?.inquiry?._id === id) {
        setSelectedInquiryModal((prev) => ({
          ...prev,
          inquiry: { ...prev.inquiry, status },
        }));
      }
      message.success(`Inquiry status updated to ${status}`);
    } catch (error) {
      message.error('Failed to update inquiry status');
    }
  };

  const handleDeleteInquiry = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c._id !== id));
      if (selectedInquiryModal?.inquiry?._id === id) {
        setSelectedInquiryModal({ open: false, inquiry: null });
      }
      message.success('Inquiry deleted successfully');
    } catch (error) {
      message.error('Failed to delete inquiry');
    }
  };

  // --- Careers & Job Openings Handlers ---
  const handleToggleJobActive = async (id) => {
    try {
      const { data } = await axiosInstance.put(`/api/admin/jobs/${id}/toggle`);
      setJobs((prev) =>
        prev.map((j) => (j._id === id ? { ...j, isActive: data.job?.isActive ?? !j.isActive } : j))
      );
      message.success(data.message || 'Job status updated');
    } catch (error) {
      message.error('Failed to toggle job status');
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      message.success('Job posting deleted');
    } catch (error) {
      message.error('Failed to delete job posting');
    }
  };

  const openCreateJobModal = () => {
    setJobForm({
      title: '',
      department: 'Editorial',
      location: 'Remote',
      type: 'Full-Time',
      experience: 'Mid-Level',
      salaryRange: '',
      description: '',
      responsibilities: '',
      requirements: '',
      perks: '',
      tags: '',
      applyEmail: 'careers@blogsum.com',
      isActive: true,
    });
    setJobModal({ open: true, isEditing: false, job: null });
  };

  const openEditJobModal = (j) => {
    setJobForm({
      title: j.title || '',
      department: j.department || 'Editorial',
      location: j.location || 'Remote',
      type: j.type || 'Full-Time',
      experience: j.experience || 'Mid-Level',
      salaryRange: j.salaryRange || '',
      description: j.description || '',
      responsibilities: Array.isArray(j.responsibilities)
        ? j.responsibilities.join('\n')
        : (j.responsibilities || ''),
      requirements: Array.isArray(j.requirements)
        ? j.requirements.join('\n')
        : (j.requirements || ''),
      perks: Array.isArray(j.perks)
        ? j.perks.join('\n')
        : (j.perks || ''),
      tags: Array.isArray(j.tags)
        ? j.tags.join(', ')
        : (j.tags || ''),
      applyEmail: j.applyEmail || 'careers@blogsum.com',
      isActive: j.isActive !== undefined ? j.isActive : true,
    });
    setJobModal({ open: true, isEditing: true, job: j });
  };

  const handleSaveJob = async (e) => {
    e?.preventDefault();
    if (!jobForm.title.trim() || !jobForm.description.trim()) {
      message.warning('Job title and description are required.');
      return;
    }
    setSavingJob(true);
    try {
      const payload = {
        ...jobForm,
        responsibilities: jobForm.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean),
        requirements: jobForm.requirements.split('\n').map((s) => s.trim()).filter(Boolean),
        perks: jobForm.perks.split('\n').map((s) => s.trim()).filter(Boolean),
        tags: jobForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (jobModal.isEditing && jobModal.job?._id) {
        const { data } = await axiosInstance.put(`/api/admin/jobs/${jobModal.job._id}`, payload);
        setJobs((prev) => prev.map((j) => (j._id === jobModal.job._id ? data.job : j)));
        message.success('Job posting updated successfully');
      } else {
        const { data } = await axiosInstance.post('/api/admin/jobs', payload);
        setJobs((prev) => [data.job, ...prev]);
        message.success('Job posting published successfully');
      }
      setJobModal({ open: false, isEditing: false, job: null });
    } catch (error) {
      message.error('Failed to save job posting');
    } finally {
      setSavingJob(false);
    }
  };

  // --- Candidate Applications Handlers ---
  const resolveResumeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = axiosInstance.defaults.baseURL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleUpdateApplicationStatus = async (appId, newStatus, newNotes = undefined) => {
    setUpdatingAppStatus(true);
    try {
      const payload = {};
      if (newStatus) payload.status = newStatus;
      if (newNotes !== undefined) payload.adminNotes = newNotes;

      const { data } = await axiosInstance.put(`/api/admin/applications/${appId}`, payload);
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? data.application || { ...a, ...payload } : a))
      );
      if (selectedAppModal.open && selectedAppModal.application?._id === appId) {
        setSelectedAppModal((prev) => ({
          ...prev,
          application: data.application || { ...prev.application, ...payload },
        }));
      }
      message.success('Candidate application updated');
    } catch (error) {
      console.error('Error updating application status:', error);
      message.error('Failed to update candidate application');
    } finally {
      setUpdatingAppStatus(false);
    }
  };

  const handleDeleteApplication = async (appId) => {
    try {
      await axiosInstance.delete(`/api/admin/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => a._id !== appId));
      if (selectedAppModal.open && selectedAppModal.application?._id === appId) {
        setSelectedAppModal({ open: false, application: null });
      }
      message.success('Candidate application deleted');
    } catch (error) {
      console.error('Error deleting application:', error);
      message.error('Failed to delete application');
    }
  };

  // --- FAQs Draft Handlers ---
  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      message.warning('Please enter both question and answer to add an FAQ.');
      return;
    }
    const updated = [...(siteSettings.customFaqs || []), { ...newFaq }];
    setSiteSettings((s) => ({ ...s, customFaqs: updated }));
    setNewFaq({ category: 'General', question: '', answer: '' });
    message.info('FAQ added to draft settings. Click "Save Platform Settings" to publish.');
  };

  const handleDeleteFaq = (index) => {
    const updated = (siteSettings.customFaqs || []).filter((_, idx) => idx !== index);
    setSiteSettings((s) => ({ ...s, customFaqs: updated }));
    message.info('FAQ removed from draft settings. Click "Save Platform Settings" to publish.');
  };

  const counts = overview?.counts || {
    totalBlogs: blogs.length,
    publishedBlogs: 0,
    scheduledBlogs: 0,
    draftBlogs: 0,
    featuredBlogs: 0,
    totalUsers: users.length,
    adminUsers: 1,
    verifiedUsers: 0,
    suspendedUsers: 0,
    totalLikes: 0,
    totalComments: comments.length,
    totalBookmarks: 0,
    totalShares: 0,
    subscribersCount: subscribers.length,
    channelsCount: channels.length,
    contactsCount: contacts.length,
    newInquiriesCount: contacts.filter((c) => c.status === 'new').length,
    jobsCount: jobs.length,
    activeJobsCount: jobs.filter((j) => j.isActive).length,
    applicationsCount: applications.length,
    newApplicationsCount: applications.filter((a) => a.status === 'new').length,
  };

  const navTabs = [
    { key: 'overview', label: 'Overview', icon: <DashboardOutlined /> },
    {
      key: 'blogs',
      label: 'All Stories',
      icon: <FileTextOutlined />,
      badge: counts.totalBlogs,
    },
    {
      key: 'users',
      label: 'Users & Roles',
      icon: <TeamOutlined />,
      badge: counts.totalUsers,
    },
    {
      key: 'comments',
      label: 'Comments',
      icon: <CommentOutlined />,
      badge: comments.length,
    },
    {
      key: 'inquiries',
      label: 'Support & Inquiries',
      icon: <MailOutlined />,
      badge: (counts.newInquiriesCount || 0) > 0 ? `${counts.newInquiriesCount} new` : (contacts.length || undefined),
    },
    {
      key: 'careers',
      label: 'Careers & Talent',
      icon: <CompassOutlined />,
      badge:
        (counts.newApplicationsCount || applications.filter((a) => a.status === 'new').length) > 0
          ? `${counts.newApplicationsCount || applications.filter((a) => a.status === 'new').length} new`
          : (jobs.length || undefined),
    },
    {
      key: 'communications',
      label: 'Broadcasts & Channels',
      icon: <SoundOutlined />,
      badge: subscribers.length,
    },
    { key: 'settings', label: 'Platform Settings', icon: <SettingOutlined /> },
    {
      key: 'audit',
      label: 'Security & Audit Logs',
      icon: <SafetyCertificateOutlined />,
      badge: auditLogs.length > 0 ? auditLogs.length : undefined,
    },
  ];

  return (
    <div className="ed-admin-shell">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-admin-shell {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
          padding-top: 92px;
          padding-bottom: 80px;
        }

        .ed-admin-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-admin-container {
            max-width: 1600px;
          }
        }
        @media (min-width: 1920px) {
          .ed-admin-container {
            max-width: 1760px;
          }
        }

        /* Header Banner */
        .ed-admin-hero {
          background: #0f172a;
          border-radius: 22px;
          padding: 32px 36px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          border: 1px solid #1e293b;
          box-shadow: 0 18px 40px -15px rgba(15, 23, 42, 0.25);
        }

        .ed-admin-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.16);
          border: 1px solid rgba(99, 102, 241, 0.35);
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .ed-admin-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(1.85rem, 3vw, 2.45rem);
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .ed-admin-subtitle {
          font-size: 0.92rem;
          color: #94a3b8;
          margin: 0;
          max-width: 620px;
        }

        .ed-admin-hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ed-admin-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .ed-admin-btn-light {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #f8fafc;
        }

        .ed-admin-btn-light:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        .ed-admin-btn-primary {
          background: #ffffff;
          color: #0f172a;
          font-weight: 700;
        }

        .ed-admin-btn-primary:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .ed-admin-btn-dark {
          background: #0f172a;
          color: #ffffff;
          font-weight: 600;
        }

        .ed-admin-btn-dark:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .ed-admin-btn-outline {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
        }

        .ed-admin-btn-outline:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        /* Admin Two-Column Layout */
        .ed-admin-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          align-items: flex-start;
        }

        /* Navigation Sidebar */
        .ed-admin-sidebar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px 12px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.03);
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ed-admin-sidebar-header {
          padding: 6px 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 6px;
        }

        .ed-admin-sidebar-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: #4f46e5;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ed-admin-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ed-admin-nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: #64748b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.16s ease;
          text-align: left;
        }

        .ed-admin-nav-item:hover {
          color: #0f172a;
          background: #f8fafc;
          border-color: #f1f5f9;
        }

        .ed-admin-nav-item.active {
          background: #0f172a;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
        }

        .ed-admin-nav-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ed-admin-nav-item-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ed-admin-tab-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(100, 116, 139, 0.14);
          color: inherit;
        }

        .ed-admin-nav-item.active .ed-admin-tab-badge {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .ed-admin-sidebar-footer {
          margin-top: 10px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .ed-admin-sidebar-status-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .ed-admin-main-stage {
          min-width: 0;
        }

        @media (max-width: 1024px) {
          .ed-admin-layout {
            grid-template-columns: 1fr;
          }

          .ed-admin-sidebar {
            position: static;
            flex-direction: row;
            overflow-x: auto;
            padding: 8px;
          }

          .ed-admin-sidebar-header,
          .ed-admin-sidebar-footer {
            display: none;
          }

          .ed-admin-sidebar-nav {
            flex-direction: row;
            gap: 6px;
          }

          .ed-admin-nav-item {
            width: auto;
            white-space: nowrap;
          }
        }

        /* KPI Grid */
        .ed-admin-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .ed-admin-kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 22px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .ed-admin-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .ed-admin-kpi-label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }

        .ed-admin-kpi-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f1f5f9;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .ed-admin-kpi-value {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.1;
          margin-bottom: 10px;
        }

        .ed-admin-kpi-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.78rem;
          color: #64748b;
        }

        /* Panel Card */
        .ed-admin-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
        }

        .ed-admin-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding-bottom: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .ed-admin-panel-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.35rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .ed-admin-panel-sub {
          font-size: 0.84rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }

        /* Filter Toolbar */
        .ed-admin-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .ed-admin-search-wrap {
          position: relative;
          flex: 1;
          min-width: 240px;
          max-width: 400px;
        }

        .ed-admin-search-input {
          width: 100%;
          height: 40px;
          padding: 0 14px 0 36px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.86rem;
          color: #0f172a;
          outline: none;
          transition: all 0.16s ease;
        }

        .ed-admin-search-input:focus {
          background: #ffffff;
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06);
        }

        .ed-admin-filter-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ed-admin-pill {
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ed-admin-pill.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        /* Responsive Table */
        .ed-admin-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .ed-admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ed-admin-table th {
          font-size: 0.73rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #64748b;
          padding: 12px 14px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          white-space: nowrap;
        }

        .ed-admin-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.88rem;
          vertical-align: middle;
        }

        .ed-admin-table tr:hover td {
          background: #fcfcfd;
        }

        .ed-admin-input,
        .ed-admin-textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.16s ease;
          box-sizing: border-box;
        }

        .ed-admin-input:focus,
        .ed-admin-textarea:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06);
        }

        .ed-admin-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        @media (max-width: 900px) {
          .ed-admin-hero {
            padding: 24px 20px;
          }
          .ed-admin-container {
            padding: 0 14px;
          }
        }
      `}</style>

      <div className="ed-admin-container">
        {/* Top Executive Banner */}
        <div className="ed-admin-hero">
          <div>
            <div className="ed-admin-kicker">
              <SafetyCertificateFilled />
              <span>Administrator Control Center</span>
            </div>
            <h1 className="ed-admin-title">Publication Command & Governance</h1>
            <p className="ed-admin-subtitle">
              Full editorial authority over all stories, scheduled queues, user roles, comments,
              newsletter dispatches, and global platform configuration.
            </p>
          </div>
          <div className="ed-admin-hero-actions">
            <button
              type="button"
              className="ed-admin-btn ed-admin-btn-light"
              onClick={() => fetchAllAdminData(true)}
              disabled={refreshing}
            >
              <ReloadOutlined spin={refreshing} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="ed-admin-btn ed-admin-btn-light"
              onClick={handleRunScheduler}
              disabled={runningScheduler}
            >
              <ThunderboltOutlined />
              <span>{runningScheduler ? 'Running Cron...' : 'Publish Due Scheduled'}</span>
            </button>
            <button
              type="button"
              className="ed-admin-btn ed-admin-btn-light"
              onClick={handleExportSnapshot}
            >
              <DownloadOutlined />
              <span>Export Snapshot</span>
            </button>
            <button
              type="button"
              className="ed-admin-btn ed-admin-btn-primary"
              onClick={() => navigate('/createBlog')}
            >
              <PlusOutlined />
              <span>New Story</span>
            </button>
          </div>
        </div>

        {/* Main Admin Workspace with Sidebar Layout */}
        <div className="ed-admin-layout">
          {/* Admin Navigation Sidebar */}
          <aside className="ed-admin-sidebar">
            <div className="ed-admin-sidebar-header">
              <div className="ed-admin-sidebar-kicker">
                <SafetyCertificateFilled style={{ color: '#4f46e5' }} />
                <span>Control Center</span>
              </div>
            </div>

            <nav className="ed-admin-sidebar-nav">
              {navTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`ed-admin-nav-item ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <div className="ed-admin-nav-item-left">
                    <span className="ed-admin-nav-item-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                  {t.badge !== undefined && <span className="ed-admin-tab-badge">{t.badge}</span>}
                </button>
              ))}
            </nav>

            <div className="ed-admin-sidebar-footer">
              <div className="ed-admin-sidebar-status-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                    Publishing Studio
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Live Telemetry &amp; Controls
                </div>
              </div>
            </div>
          </aside>

          {/* Main Stage Content */}
          <main className="ed-admin-main-stage">
            {loading ? (
              <div className="ed-admin-panel" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: '#64748b', fontWeight: 500 }}>
                  Loading publication telemetry and records...
                </p>
              </div>
            ) : (
              <>
            {/* =========================================================
                TAB 1: EXECUTIVE OVERVIEW
               ========================================================= */}
            {activeTab === 'overview' && (
              <>
                <div className="ed-admin-kpi-grid">
                  <div className="ed-admin-kpi-card">
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Total Stories</span>
                      <div className="ed-admin-kpi-icon">
                        <FileTextOutlined />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">{counts.totalBlogs}</div>
                    <div className="ed-admin-kpi-meta">
                      <Tag color="success" style={{ margin: 0 }}>
                        {counts.publishedBlogs} Live
                      </Tag>
                      <Tag color="warning" style={{ margin: 0 }}>
                        {counts.scheduledBlogs} Scheduled
                      </Tag>
                      <Tag style={{ margin: 0 }}>{counts.draftBlogs} Drafts</Tag>
                    </div>
                  </div>

                  <div className="ed-admin-kpi-card">
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Registered Members</span>
                      <div className="ed-admin-kpi-icon">
                        <TeamOutlined />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">{counts.totalUsers}</div>
                    <div className="ed-admin-kpi-meta">
                      <Tag color="purple" style={{ margin: 0 }}>
                        {counts.adminUsers} Admins
                      </Tag>
                      <Tag color="blue" style={{ margin: 0 }}>
                        {counts.verifiedUsers} Verified
                      </Tag>
                      {counts.suspendedUsers > 0 && (
                        <Tag color="error" style={{ margin: 0 }}>
                          {counts.suspendedUsers} Suspended
                        </Tag>
                      )}
                    </div>
                  </div>

                  <div className="ed-admin-kpi-card">
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Total Engagement</span>
                      <div className="ed-admin-kpi-icon">
                        <FireOutlined />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">
                      {counts.totalLikes + counts.totalComments + counts.totalBookmarks}
                    </div>
                    <div className="ed-admin-kpi-meta">
                      <span>❤️ {counts.totalLikes} Likes</span>
                      <span>·</span>
                      <span>💬 {counts.totalComments} Comments</span>
                      <span>·</span>
                      <span>🔖 {counts.totalBookmarks} Saves</span>
                    </div>
                  </div>

                  <div className="ed-admin-kpi-card">
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Editor&apos;s Picks</span>
                      <div className="ed-admin-kpi-icon" style={{ color: '#d97706' }}>
                        <StarFilled />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">{counts.featuredBlogs}</div>
                    <div className="ed-admin-kpi-meta">
                      <span>Curated featured stories</span>
                    </div>
                  </div>

                  <div className="ed-admin-kpi-card">
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Newsletter Audience</span>
                      <div className="ed-admin-kpi-icon">
                        <MailOutlined />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">{counts.subscribersCount}</div>
                    <div className="ed-admin-kpi-meta">
                      <span>Active email subscribers</span>
                      <span>·</span>
                      <span>{counts.channelsCount} Chat Channels</span>
                    </div>
                  </div>

                  <div
                    className="ed-admin-kpi-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTab('inquiries')}
                  >
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Support Inquiries</span>
                      <div className="ed-admin-kpi-icon" style={{ color: '#0284c7' }}>
                        <MailOutlined />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">{counts.contactsCount || contacts.length}</div>
                    <div className="ed-admin-kpi-meta">
                      {(counts.newInquiriesCount || 0) > 0 ? (
                        <Tag color="error" style={{ margin: 0 }}>
                          {counts.newInquiriesCount} New Unresolved
                        </Tag>
                      ) : (
                        <Tag color="success" style={{ margin: 0 }}>
                          All Resolved
                        </Tag>
                      )}
                      <span>·</span>
                      <span>From Help Center</span>
                    </div>
                  </div>

                  <div
                    className="ed-admin-kpi-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setActiveTab('careers');
                      setCareerSubTab('applications');
                    }}
                  >
                    <div className="ed-admin-kpi-top">
                      <span className="ed-admin-kpi-label">Careers &amp; Candidate Talent</span>
                      <div className="ed-admin-kpi-icon" style={{ color: '#8b5cf6' }}>
                        <CompassOutlined />
                      </div>
                    </div>
                    <div className="ed-admin-kpi-value">{applications.length}</div>
                    <div className="ed-admin-kpi-meta">
                      <Tag color="purple" style={{ margin: 0 }}>
                        {counts.activeJobsCount || jobs.filter((j) => j.isActive).length} Open Positions
                      </Tag>
                      <span>·</span>
                      {applications.filter((a) => a.status === 'new').length > 0 ? (
                        <Tag color="error" style={{ margin: 0 }}>
                          {applications.filter((a) => a.status === 'new').length} New Applications
                        </Tag>
                      ) : (
                        <span>All applications reviewed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Two-Column Analytics Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: 24,
                  }}
                >
                  {/* Top Performing Stories */}
                  <div className="ed-admin-panel">
                    <div className="ed-admin-panel-header">
                      <div>
                        <h3 className="ed-admin-panel-title">Top Performing Stories</h3>
                        <p className="ed-admin-panel-sub">
                          Ranked by weighted reader engagement (likes, comments, bookmarks)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-outline"
                        onClick={() => setActiveTab('blogs')}
                      >
                        Manage All
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(overview?.topStories || []).map((story, idx) => (
                        <div
                          key={story._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: '1px solid #f1f5f9',
                            background: '#fcfcfd',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                background: idx < 3 ? '#0f172a' : '#e2e8f0',
                                color: idx < 3 ? '#fff' : '#475569',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                onClick={() => navigate(`/blog/${story._id}`)}
                                style={{
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {story.title}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                by @{story.author?.username || 'author'} · {story.category}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexShrink: 0,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#475569',
                            }}
                          >
                            <span>❤️ {story.likesCount}</span>
                            <span>💬 {story.commentsCount}</span>
                            <span>🔖 {story.bookmarksCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Distribution & Top Authors */}
                  <div className="ed-admin-panel">
                    <div className="ed-admin-panel-header">
                      <div>
                        <h3 className="ed-admin-panel-title">Editorial Category Distribution</h3>
                        <p className="ed-admin-panel-sub">
                          Volume and reader engagement across publication verticals
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(overview?.categoryBreakdown || []).slice(0, 7).map((cat) => {
                        const pct =
                          counts.totalBlogs > 0
                            ? Math.round((cat.count / counts.totalBlogs) * 100)
                            : 0;
                        return (
                          <div key={cat.category}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.84rem',
                                fontWeight: 600,
                                marginBottom: 5,
                              }}
                            >
                              <span>{cat.category}</span>
                              <span style={{ color: '#64748b' }}>
                                {cat.count} stories ({pct}%) · ❤️ {cat.likes}
                              </span>
                            </div>
                            <div
                              style={{
                                height: 8,
                                borderRadius: 999,
                                background: '#f1f5f9',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.max(pct, 4)}%`,
                                  height: '100%',
                                  background: '#0f172a',
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top Contributors Mini List */}
                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                      <h4
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#64748b',
                          marginBottom: 12,
                        }}
                      >
                        Top Publication Authors
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(overview?.topAuthors || []).slice(0, 4).map((author) => (
                          <div
                            key={author._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar src={author.profilePicture} size={32}>
                                {author.username?.[0]?.toUpperCase()}
                              </Avatar>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                  @{author.username}
                                </span>
                                {author.isVerified && (
                                  <CheckCircleFilled
                                    style={{ color: '#2563eb', marginLeft: 5, fontSize: 13 }}
                                  />
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                              {author.postsCount} stories · ❤️ {author.likesReceived} likes received
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* =========================================================
                TAB 2: ALL STORIES & EDITORIAL MODERATION
               ========================================================= */}
            {activeTab === 'blogs' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">
                      All Platform Stories ({filteredBlogs.length})
                    </h3>
                    <p className="ed-admin-panel-sub">
                      Manage published, scheduled, and draft stories from every author. Feature
                      Editor&apos;s Picks, force-publish scheduled posts, or edit/delete any story.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="ed-admin-btn ed-admin-btn-outline"
                      onClick={handleRunScheduler}
                      disabled={runningScheduler}
                    >
                      <ClockCircleOutlined />
                      <span>Publish Due Scheduled</span>
                    </button>
                    <button
                      type="button"
                      className="ed-admin-btn ed-admin-btn-dark"
                      onClick={() => navigate('/createBlog')}
                    >
                      <PlusOutlined />
                      <span>Write New Story</span>
                    </button>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="ed-admin-toolbar">
                  <div className="ed-admin-search-wrap">
                    <SearchOutlined
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="text"
                      className="ed-admin-search-input"
                      placeholder="Search by title, @author, category, or #tag..."
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                    />
                  </div>

                  <div className="ed-admin-filter-pills">
                    {[
                      { key: 'all', label: `All (${blogs.length})` },
                      { key: 'published', label: `Published (${counts.publishedBlogs})` },
                      { key: 'scheduled', label: `Scheduled (${counts.scheduledBlogs})` },
                      { key: 'draft', label: `Drafts (${counts.draftBlogs})` },
                      { key: 'featured', label: `⭐ Editor's Picks (${counts.featuredBlogs})` },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`ed-admin-pill ${blogStatusFilter === f.key ? 'active' : ''}`}
                        onClick={() => setBlogStatusFilter(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}

                    <Select
                      value={blogCategoryFilter}
                      onChange={setBlogCategoryFilter}
                      style={{ width: 155 }}
                      options={[
                        { value: 'all', label: 'All Categories' },
                        ...CATEGORIES.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedBlogIds.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '12px 16px',
                      background: '#0f172a',
                      color: '#fff',
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {selectedBlogIds.length} stories selected
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-light"
                        style={{ height: 34, fontSize: '0.8rem' }}
                        onClick={() => handleBulkAction('publish')}
                      >
                        Publish Now
                      </button>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-light"
                        style={{ height: 34, fontSize: '0.8rem' }}
                        onClick={() => handleBulkAction('draft')}
                      >
                        Move to Draft
                      </button>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-light"
                        style={{ height: 34, fontSize: '0.8rem' }}
                        onClick={() => handleBulkAction('feature')}
                      >
                        ⭐ Feature
                      </button>
                      <Popconfirm
                        title={`Delete ${selectedBlogIds.length} selected stories?`}
                        onConfirm={() => handleBulkAction('delete')}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          type="button"
                          className="ed-admin-btn"
                          style={{
                            height: 34,
                            fontSize: '0.8rem',
                            background: '#ef4444',
                            color: '#fff',
                          }}
                        >
                          Delete Selected
                        </button>
                      </Popconfirm>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-light"
                        style={{ height: 34, fontSize: '0.8rem' }}
                        onClick={() => setSelectedBlogIds([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                <div className="ed-admin-table-wrap">
                  <table className="ed-admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input
                            type="checkbox"
                            checked={
                              filteredBlogs.length > 0 &&
                              selectedBlogIds.length === filteredBlogs.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBlogIds(filteredBlogs.map((b) => b._id));
                              } else {
                                setSelectedBlogIds([]);
                              }
                            }}
                          />
                        </th>
                        <th>Story</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Status / Schedule</th>
                        <th>Curate</th>
                        <th>Engagement</th>
                        <th>Comments</th>
                        <th style={{ textAlign: 'right' }}>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBlogs.map((blog) => {
                        const effStatus = blog.effectiveStatus || blog.status || 'published';
                        const isChecked = selectedBlogIds.includes(blog._id);
                        return (
                          <tr key={blog._id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBlogIds((prev) => [...prev, blog._id]);
                                  } else {
                                    setSelectedBlogIds((prev) =>
                                      prev.filter((id) => id !== blog._id)
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td style={{ maxWidth: 300 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {blog.imageUrl && (
                                  <img
                                    src={blog.imageUrl}
                                    alt=""
                                    style={{
                                      width: 48,
                                      height: 36,
                                      borderRadius: 6,
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    onClick={() => navigate(`/blog/${blog._id}`)}
                                    style={{
                                      fontWeight: 600,
                                      color: '#0f172a',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {blog.title}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {new Date(blog.publishDate || blog.date).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {Array.isArray(blog.images) && blog.images.length > 1
                                      ? ` · 📷 ${blog.images.length}`
                                      : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar size={26} src={blog.author?.profilePicture}>
                                  {blog.author?.username?.[0]?.toUpperCase()}
                                </Avatar>
                                <span style={{ fontWeight: 500 }}>
                                  @{blog.author?.username || 'unknown'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <Tag style={{ borderRadius: 999 }}>{blog.category}</Tag>
                            </td>
                            <td>
                              <Select
                                size="small"
                                value={effStatus}
                                style={{ width: 124 }}
                                onChange={(nextStatus) =>
                                  handleUpdateBlogField(
                                    blog._id,
                                    { status: nextStatus },
                                    `Story status updated to ${nextStatus}`
                                  )
                                }
                                options={[
                                  { value: 'published', label: '🟢 Published' },
                                  { value: 'scheduled', label: '🕒 Scheduled' },
                                  { value: 'draft', label: '📝 Draft' },
                                ]}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Tooltip
                                  title={
                                    blog.isFeatured
                                      ? "Remove from Editor's Picks"
                                      : "Mark as Editor's Pick (Featured)"
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBlogField(
                                        blog._id,
                                        { isFeatured: !blog.isFeatured },
                                        blog.isFeatured
                                          ? "Removed from Editor's Picks"
                                          : "Marked as Editor's Pick!"
                                      )
                                    }
                                    style={{
                                      border: '1px solid #e2e8f0',
                                      background: blog.isFeatured ? '#fef3c7' : '#fff',
                                      color: blog.isFeatured ? '#d97706' : '#94a3b8',
                                      borderRadius: 8,
                                      width: 30,
                                      height: 30,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {blog.isFeatured ? <StarFilled /> : <StarOutlined />}
                                  </button>
                                </Tooltip>
                                <Tooltip
                                  title={blog.isPinned ? 'Unpin Story' : 'Pin Story to Top'}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateBlogField(
                                        blog._id,
                                        { isPinned: !blog.isPinned },
                                        blog.isPinned ? 'Story unpinned' : 'Story pinned to top'
                                      )
                                    }
                                    style={{
                                      border: '1px solid #e2e8f0',
                                      background: blog.isPinned ? '#eef2ff' : '#fff',
                                      color: blog.isPinned ? '#4f46e5' : '#94a3b8',
                                      borderRadius: 8,
                                      width: 30,
                                      height: 30,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {blog.isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                                ❤️ {blog.likesCount || 0} · 💬 {blog.commentsCount || 0} · 🔖{' '}
                                {blog.bookmarksCount || 0}
                              </span>
                            </td>
                            <td>
                              <Switch
                                size="small"
                                checked={blog.allowComments !== false}
                                onChange={(checked) =>
                                  handleUpdateBlogField(
                                    blog._id,
                                    { allowComments: checked },
                                    checked
                                      ? 'Comments enabled on story'
                                      : 'Comments locked on story'
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <Tooltip title="View Story">
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{ height: 32, padding: '0 10px' }}
                                    onClick={() => navigate(`/blog/${blog._id}`)}
                                  >
                                    <EyeOutlined />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Edit Story (Admin Override)">
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{ height: 32, padding: '0 10px' }}
                                    onClick={() => navigate(`/edit/${blog._id}`)}
                                  >
                                    <EditOutlined />
                                  </button>
                                </Tooltip>
                                <Popconfirm
                                  title="Permanently delete this story?"
                                  description="This action cannot be undone."
                                  onConfirm={() => handleDeleteBlog(blog._id)}
                                  okText="Delete"
                                  okButtonProps={{ danger: true }}
                                >
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{
                                      height: 32,
                                      padding: '0 10px',
                                      color: '#ef4444',
                                      borderColor: '#fecaca',
                                    }}
                                  >
                                    <DeleteOutlined />
                                  </button>
                                </Popconfirm>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredBlogs.length === 0 && (
                    <Empty description="No matching stories found" style={{ padding: '40px 0' }} />
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 3: USERS & ROLES DIRECTORY
               ========================================================= */}
            {activeTab === 'users' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">
                      Users, Roles & Verification ({filteredUsers.length})
                    </h3>
                    <p className="ed-admin-panel-sub">
                      Promote admins/editors, award Verified Writer badges, suspend abusive
                      accounts, or reset passwords.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ed-admin-btn ed-admin-btn-dark"
                    onClick={() => setCreateUserModalOpen(true)}
                  >
                    <UserAddOutlined />
                    <span>Create User Account</span>
                  </button>
                </div>

                <div className="ed-admin-toolbar">
                  <div className="ed-admin-search-wrap">
                    <SearchOutlined
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="text"
                      className="ed-admin-search-input"
                      placeholder="Search by username, email, or location..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>

                  <div className="ed-admin-filter-pills">
                    {[
                      { key: 'all', label: `All (${users.length})` },
                      { key: 'admin', label: `Admins (${counts.adminUsers})` },
                      { key: 'editor', label: 'Editors' },
                      { key: 'verified', label: `Verified (${counts.verifiedUsers})` },
                      { key: 'suspended', label: `Suspended (${counts.suspendedUsers})` },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`ed-admin-pill ${userRoleFilter === f.key ? 'active' : ''}`}
                        onClick={() => setUserRoleFilter(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ed-admin-table-wrap">
                  <table className="ed-admin-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th>Verified Badge</th>
                        <th>Account Status</th>
                        <th>Stories Published</th>
                        <th>Likes Received</th>
                        <th>Followers</th>
                        <th style={{ textAlign: 'right' }}>Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSelf = String(u._id) === String(user?._id);
                        return (
                          <tr key={u._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar size={36} src={u.profilePicture}>
                                  {u.username?.[0]?.toUpperCase()}
                                </Avatar>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: '#0f172a',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => navigate(`/profile/${u._id}`)}
                                  >
                                    <span>@{u.username}</span>
                                    {u.isVerified && (
                                      <CheckCircleFilled
                                        style={{ color: '#2563eb', fontSize: 13 }}
                                      />
                                    )}
                                    {isSelf && (
                                      <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                                        You
                                      </Tag>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    {u.email} {u.location ? `· ${u.location}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Select
                                size="small"
                                value={u.roles || 'other'}
                                disabled={isSelf}
                                style={{ width: 118 }}
                                onChange={(newRole) =>
                                  handleQuickUpdateUser(
                                    u._id,
                                    { roles: newRole },
                                    `Updated @${u.username} role to ${newRole}`
                                  )
                                }
                                options={[
                                  { value: 'admin', label: '🛡️ Admin' },
                                  { value: 'editor', label: '✍️ Editor' },
                                  { value: 'other', label: '👤 Member' },
                                ]}
                              />
                            </td>
                            <td>
                              <Switch
                                size="small"
                                checked={Boolean(u.isVerified)}
                                onChange={(checked) =>
                                  handleQuickUpdateUser(
                                    u._id,
                                    { isVerified: checked },
                                    checked
                                      ? `Awarded Verified badge to @${u.username}`
                                      : `Removed Verified badge from @${u.username}`
                                  )
                                }
                              />
                            </td>
                            <td>
                              {u.isSuspended ? (
                                <Tag color="error" icon={<StopOutlined />}>
                                  Suspended
                                </Tag>
                              ) : (
                                <Tag color="success">Active</Tag>
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{u.blogsCount || 0}</span>
                              <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: 4 }}>
                                ({u.publishedCount || 0} live)
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>❤️ {u.totalLikesReceived || 0}</span>
                            </td>
                            <td>{u.followersCount || 0}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <Tooltip title="Edit User / Reset Password">
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{ height: 32, padding: '0 10px' }}
                                    onClick={() => openEditUserModal(u)}
                                  >
                                    <EditOutlined />
                                  </button>
                                </Tooltip>
                                {!isSelf && (
                                  <Tooltip
                                    title={
                                      u.isSuspended ? 'Restore Account' : 'Suspend User Account'
                                    }
                                  >
                                    <button
                                      type="button"
                                      className="ed-admin-btn ed-admin-btn-outline"
                                      style={{
                                        height: 32,
                                        padding: '0 10px',
                                        color: u.isSuspended ? '#16a34a' : '#d97706',
                                      }}
                                      onClick={() =>
                                        handleQuickUpdateUser(
                                          u._id,
                                          { isSuspended: !u.isSuspended },
                                          u.isSuspended
                                            ? `@${u.username} account restored`
                                            : `@${u.username} account suspended`
                                        )
                                      }
                                    >
                                      <StopOutlined />
                                    </button>
                                  </Tooltip>
                                )}
                                {!isSelf && (
                                  <Popconfirm
                                    title={`Delete user @${u.username}?`}
                                    description="Also delete all stories written by this user?"
                                    onConfirm={() => handleDeleteUser(u._id, true)}
                                    onCancel={() => handleDeleteUser(u._id, false)}
                                    okText="Delete User + Stories"
                                    cancelText="Delete User Only"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <button
                                      type="button"
                                      className="ed-admin-btn ed-admin-btn-outline"
                                      style={{
                                        height: 32,
                                        padding: '0 10px',
                                        color: '#ef4444',
                                        borderColor: '#fecaca',
                                      }}
                                    >
                                      <DeleteOutlined />
                                    </button>
                                  </Popconfirm>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 4: COMMENT & DISCUSSION MODERATION
               ========================================================= */}
            {activeTab === 'comments' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">
                      Comment & Reply Moderation ({filteredComments.length})
                    </h3>
                    <p className="ed-admin-panel-sub">
                      Inspect and moderate reader discussions across all stories in real time.
                    </p>
                  </div>
                </div>

                <div className="ed-admin-toolbar">
                  <div className="ed-admin-search-wrap">
                    <SearchOutlined
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="text"
                      className="ed-admin-search-input"
                      placeholder="Filter by comment text, @username, or story title..."
                      value={commentSearch}
                      onChange={(e) => setCommentSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ed-admin-table-wrap">
                  <table className="ed-admin-table">
                    <thead>
                      <tr>
                        <th>Author</th>
                        <th>Comment / Reply</th>
                        <th>On Story</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComments.map((c) => (
                        <tr key={c._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar size={28} src={c.user?.profilePicture}>
                                {c.user?.username?.[0]?.toUpperCase()}
                              </Avatar>
                              <span style={{ fontWeight: 600 }}>
                                @{c.user?.username || 'Reader'}
                              </span>
                              {c.isReply && <Tag style={{ margin: 0, fontSize: 10 }}>Reply</Tag>}
                            </div>
                          </td>
                          <td style={{ maxWidth: 420 }}>
                            <div style={{ color: '#0f172a', lineHeight: 1.45 }}>{c.comment}</div>
                          </td>
                          <td>
                            <span
                              onClick={() => navigate(`/blog/${c.blogId}`)}
                              style={{
                                fontWeight: 600,
                                color: '#2563eb',
                                cursor: 'pointer',
                              }}
                            >
                              {c.blogTitle}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {c.date ? new Date(c.date).toLocaleString() : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Popconfirm
                              title="Remove this comment?"
                              onConfirm={() => handleDeleteComment(c)}
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                            >
                              <button
                                type="button"
                                className="ed-admin-btn ed-admin-btn-outline"
                                style={{
                                  height: 32,
                                  padding: '0 10px',
                                  color: '#ef4444',
                                  borderColor: '#fecaca',
                                }}
                              >
                                <DeleteOutlined />
                                <span>Remove</span>
                              </button>
                            </Popconfirm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredComments.length === 0 && (
                    <Empty description="No comments found" style={{ padding: '40px 0' }} />
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 5: BROADCASTS, NEWSLETTER & CHANNELS
               ========================================================= */}
            {activeTab === 'communications' && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: 24,
                  }}
                >
                  {/* Global In-App Announcement Broadcast */}
                  <div className="ed-admin-panel">
                    <div className="ed-admin-panel-header">
                      <div>
                        <h3 className="ed-admin-panel-title">Global In-App Notification</h3>
                        <p className="ed-admin-panel-sub">
                          Push a real-time notification bell alert to all registered members
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSendAnnouncement}>
                      <div style={{ marginBottom: 14 }}>
                        <label className="ed-admin-label">Target Audience</label>
                        <Select
                          value={announcementRole}
                          onChange={setAnnouncementRole}
                          style={{ width: '100%' }}
                          options={[
                            { value: 'all', label: `All Registered Users (${counts.totalUsers})` },
                            { value: 'admin', label: 'Admins Only' },
                            { value: 'editor', label: 'Editors Only' },
                            { value: 'other', label: 'Standard Members Only' },
                          ]}
                        />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="ed-admin-label">Announcement Message</label>
                        <textarea
                          rows={4}
                          className="ed-admin-textarea"
                          placeholder="e.g., Welcome to our weekend essay showcase! Submit your stories under #weekend..."
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="ed-admin-btn ed-admin-btn-dark"
                        disabled={sendingAnnouncement}
                      >
                        <SendOutlined />
                        <span>
                          {sendingAnnouncement
                            ? 'Broadcasting...'
                            : 'Broadcast In-App Notification'}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/* Email Newsletter Dispatch */}
                  <div className="ed-admin-panel">
                    <div className="ed-admin-panel-header">
                      <div>
                        <h3 className="ed-admin-panel-title">
                          Newsletter Dispatch ({subscribers.length} Subscribers)
                        </h3>
                        <p className="ed-admin-panel-sub">
                          Compose and email the Weekly Dispatch to all newsletter subscribers
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSendNewsletter}>
                      <div style={{ marginBottom: 14 }}>
                        <label className="ed-admin-label">Email Subject Line</label>
                        <input
                          type="text"
                          className="ed-admin-input"
                          placeholder="e.g., The BlogSum Weekly Dispatch: Top 5 Essays"
                          value={newsletterSubject}
                          onChange={(e) => setNewsletterSubject(e.target.value)}
                        />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="ed-admin-label">Newsletter Body</label>
                        <textarea
                          rows={4}
                          className="ed-admin-textarea"
                          placeholder="Write your newsletter dispatch message..."
                          value={newsletterBody}
                          onChange={(e) => setNewsletterBody(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="ed-admin-btn ed-admin-btn-dark"
                        disabled={sendingNewsletter}
                      >
                        <MailOutlined />
                        <span>
                          {sendingNewsletter
                            ? 'Sending Emails...'
                            : `Send Email to ${subscribers.length} Subscribers`}
                        </span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Subscribers & Community Channels Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: 24,
                  }}
                >
                  {/* Subscribers List */}
                  <div className="ed-admin-panel">
                    <div className="ed-admin-panel-header">
                      <div>
                        <h3 className="ed-admin-panel-title">
                          Newsletter Subscribers ({filteredSubscribers.length})
                        </h3>
                      </div>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-outline"
                        onClick={handleExportSubscribersCsv}
                      >
                        <DownloadOutlined />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <form
                      onSubmit={handleAddSubscriber}
                      style={{ display: 'flex', gap: 8, marginBottom: 14 }}
                    >
                      <input
                        type="email"
                        className="ed-admin-input"
                        placeholder="Add subscriber email manually..."
                        value={newSubscriberEmail}
                        onChange={(e) => setNewSubscriberEmail(e.target.value)}
                      />
                      <button type="submit" className="ed-admin-btn ed-admin-btn-dark">
                        Add
                      </button>
                    </form>

                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {filteredSubscribers.map((sub) => (
                        <div
                          key={sub._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{sub.email}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Subscribed{' '}
                              {sub.subscribedAt
                                ? new Date(sub.subscribedAt).toLocaleDateString()
                                : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ed-admin-btn ed-admin-btn-outline"
                            style={{ height: 28, padding: '0 8px', color: '#ef4444' }}
                            onClick={() => handleDeleteSubscriber(sub._id)}
                          >
                            <DeleteOutlined />
                          </button>
                        </div>
                      ))}
                      {filteredSubscribers.length === 0 && (
                        <Empty description="No subscribers yet" />
                      )}
                    </div>
                  </div>

                  {/* Community Channels Moderation */}
                  <div className="ed-admin-panel">
                    <div className="ed-admin-panel-header">
                      <div>
                        <h3 className="ed-admin-panel-title">
                          Community Channels ({channels.length})
                        </h3>
                        <p className="ed-admin-panel-sub">
                          Moderate active Messenger channels across the platform
                        </p>
                      </div>
                    </div>

                    <div style={{ maxHeight: 330, overflowY: 'auto' }}>
                      {channels.map((ch) => (
                        <div
                          key={ch._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}># {ch.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {ch.description || 'No description'} ·{' '}
                              {Array.isArray(ch.members) ? ch.members.length : 0} members
                            </div>
                          </div>
                          <Popconfirm
                            title={`Delete channel #${ch.name}?`}
                            onConfirm={() => handleDeleteChannel(ch._id)}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              type="button"
                              className="ed-admin-btn ed-admin-btn-outline"
                              style={{ height: 30, padding: '0 10px', color: '#ef4444' }}
                            >
                              <DeleteOutlined />
                            </button>
                          </Popconfirm>
                        </div>
                      ))}
                      {channels.length === 0 && <Empty description="No channels created yet" />}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* =========================================================
                TAB 6: SUPPORT & HELP CENTER INQUIRIES
               ========================================================= */}
            {activeTab === 'inquiries' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">
                      Support Inquiries & Contact Submissions ({contacts.length})
                    </h3>
                    <p className="ed-admin-panel-sub">
                      Review, manage, and respond to reader questions, feedback, and job applications submitted through the Help Center.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Tag color="orange" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 999 }}>
                      {counts.newInquiriesCount || 0} Unresolved
                    </Tag>
                    <Tag color="green" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 999 }}>
                      {contacts.filter((c) => c.status === 'resolved').length} Resolved
                    </Tag>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: 12,
                    marginBottom: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setInquiryStatusFilter('all')}
                      className={`ed-admin-btn ${
                        inquiryStatusFilter === 'all'
                          ? 'ed-admin-btn-dark'
                          : 'ed-admin-btn-outline'
                      }`}
                      style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                    >
                      All ({contacts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInquiryStatusFilter('new')}
                      className={`ed-admin-btn ${
                        inquiryStatusFilter === 'new'
                          ? 'ed-admin-btn-dark'
                          : 'ed-admin-btn-outline'
                      }`}
                      style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                    >
                      New / Unresolved ({counts.newInquiriesCount || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInquiryStatusFilter('resolved')}
                      className={`ed-admin-btn ${
                        inquiryStatusFilter === 'resolved'
                          ? 'ed-admin-btn-dark'
                          : 'ed-admin-btn-outline'
                      }`}
                      style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                    >
                      Resolved ({contacts.filter((c) => c.status === 'resolved').length})
                    </button>
                  </div>

                  <div style={{ minWidth: 260 }}>
                    <div className="ed-admin-search-wrap">
                      <SearchOutlined className="ed-admin-search-icon" />
                      <input
                        type="text"
                        className="ed-admin-search-input"
                        placeholder="Search inquiries by name, email, subject..."
                        value={inquirySearch}
                        onChange={(e) => setInquirySearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Inquiries Table */}
                <div className="ed-admin-table-wrap">
                  <table className="ed-admin-table">
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Category & Subject</th>
                        <th>Message Preview</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts
                        .filter((c) => {
                          if (inquiryStatusFilter !== 'all' && c.status !== inquiryStatusFilter) {
                            return false;
                          }
                          if (inquirySearch.trim()) {
                            const q = inquirySearch.toLowerCase();
                            const matchName = String(c.name || '').toLowerCase().includes(q);
                            const matchEmail = String(c.email || '').toLowerCase().includes(q);
                            const matchSubj = String(c.subject || '').toLowerCase().includes(q);
                            const matchMsg = String(c.message || '').toLowerCase().includes(q);
                            return matchName || matchEmail || matchSubj || matchMsg;
                          }
                          return true;
                        })
                        .map((inq) => (
                          <tr key={inq._id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{inq.name}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                <a href={`mailto:${inq.email}`} style={{ color: '#4f46e5' }}>
                                  {inq.email}
                                </a>
                              </div>
                            </td>
                            <td>
                              <div style={{ marginBottom: 4 }}>
                                <Tag color="blue" style={{ borderRadius: 999, fontSize: 11 }}>
                                  {inq.category || 'General Support'}
                                </Tag>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                {inq.subject}
                              </div>
                            </td>
                            <td>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: '#475569',
                                  maxWidth: 280,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {inq.message}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                {new Date(inq.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              {inq.status === 'resolved' ? (
                                <Tag color="success" style={{ borderRadius: 999 }}>
                                  Resolved
                                </Tag>
                              ) : (
                                <Tag color="warning" style={{ borderRadius: 999 }}>
                                  New Inquiry
                                </Tag>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="ed-admin-btn ed-admin-btn-outline"
                                  style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                                  onClick={() => setSelectedInquiryModal({ open: true, inquiry: inq })}
                                >
                                  <EyeOutlined />
                                  <span>View</span>
                                </button>
                                {inq.status === 'resolved' ? (
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                                    onClick={() => handleUpdateInquiryStatus(inq._id, 'new')}
                                  >
                                    Reopen
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-dark"
                                    style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                                    onClick={() => handleUpdateInquiryStatus(inq._id, 'resolved')}
                                  >
                                    <CheckOutlined />
                                    <span>Resolve</span>
                                  </button>
                                )}
                                <Popconfirm
                                  title="Delete this inquiry permanently?"
                                  onConfirm={() => handleDeleteInquiry(inq._id)}
                                  okText="Delete"
                                  okButtonProps={{ danger: true }}
                                >
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{ height: 28, padding: '0 8px', color: '#ef4444' }}
                                  >
                                    <DeleteOutlined />
                                  </button>
                                </Popconfirm>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {contacts.length === 0 && (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <Empty description="No inquiries received yet." />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 7: CAREERS & CANDIDATE TALENT MANAGEMENT
               ========================================================= */}
            {activeTab === 'careers' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">
                      Careers &amp; Editorial Talent
                    </h3>
                    <p className="ed-admin-panel-sub">
                      Publish open listings to /careers and manage candidate job applications and resumes.
                    </p>
                  </div>
                  {careerSubTab === 'openings' && (
                    <button
                      type="button"
                      className="ed-admin-btn ed-admin-btn-dark"
                      onClick={openCreateJobModal}
                    >
                      <PlusOutlined />
                      <span>Post New Opening</span>
                    </button>
                  )}
                </div>

                {/* Sub-Navigation Tabs */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => setCareerSubTab('openings')}
                    className={`ed-admin-pill ${careerSubTab === 'openings' ? 'active' : ''}`}
                    style={{ height: 36, padding: '0 16px', fontSize: 13 }}
                  >
                    💼 Job Openings ({jobs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCareerSubTab('applications')}
                    className={`ed-admin-pill ${careerSubTab === 'applications' ? 'active' : ''}`}
                    style={{
                      height: 36,
                      padding: '0 16px',
                      fontSize: 13,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>📄 Candidate Applications ({applications.length})</span>
                    {applications.filter((a) => a.status === 'new').length > 0 && (
                      <span
                        style={{
                          background: careerSubTab === 'applications' ? '#ef4444' : '#fee2e2',
                          color: careerSubTab === 'applications' ? '#ffffff' : '#b91c1c',
                          padding: '1px 7px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {applications.filter((a) => a.status === 'new').length} new
                      </span>
                    )}
                  </button>
                </div>

                {careerSubTab === 'openings' ? (
                  /* Job Postings Table */
                  <div className="ed-admin-table-wrap">
                    <table className="ed-admin-table">
                      <thead>
                        <tr>
                          <th>Role Title &amp; Department</th>
                          <th>Location &amp; Type</th>
                          <th>Experience &amp; Salary</th>
                          <th>Description / Tags</th>
                          <th>Active on /careers</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((j) => (
                          <tr key={j._id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                {j.title}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <Tag color="geekblue" style={{ borderRadius: 999, fontSize: 11 }}>
                                  {j.department}
                                </Tag>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, color: '#334155' }}>{j.location}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{j.type}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                {j.salaryRange || 'Competitive'}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                {j.experience || 'Mid-Level'}
                              </div>
                            </td>
                            <td>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: '#475569',
                                  maxWidth: 260,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginBottom: 4,
                                }}
                              >
                                {j.description}
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {(j.tags || []).slice(0, 3).map((t, idx) => (
                                  <Tag key={idx} style={{ fontSize: 10, margin: 0 }}>
                                    #{t}
                                  </Tag>
                                ))}
                              </div>
                            </td>
                            <td>
                              <Switch
                                checked={Boolean(j.isActive)}
                                onChange={() => handleToggleJobActive(j._id)}
                                checkedChildren="Live"
                                unCheckedChildren="Hidden"
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="ed-admin-btn ed-admin-btn-outline"
                                  style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                                  onClick={() => openEditJobModal(j)}
                                >
                                  <EditOutlined />
                                  <span>Edit</span>
                                </button>
                                <Popconfirm
                                  title={`Delete opening "${j.title}"?`}
                                  onConfirm={() => handleDeleteJob(j._id)}
                                  okText="Delete"
                                  okButtonProps={{ danger: true }}
                                >
                                  <button
                                    type="button"
                                    className="ed-admin-btn ed-admin-btn-outline"
                                    style={{ height: 28, padding: '0 8px', color: '#ef4444' }}
                                  >
                                    <DeleteOutlined />
                                  </button>
                                </Popconfirm>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {jobs.length === 0 && (
                      <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <Empty description="No job postings created yet. Click 'Post New Opening' above." />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Candidate Applications Management */
                  <div>
                    {/* Applications Filter Toolbar */}
                    <div className="ed-admin-toolbar">
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setApplicationStatusFilter('all')}
                          className={`ed-admin-btn ${
                            applicationStatusFilter === 'all'
                              ? 'ed-admin-btn-dark'
                              : 'ed-admin-btn-outline'
                          }`}
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                        >
                          All ({applications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplicationStatusFilter('new')}
                          className={`ed-admin-btn ${
                            applicationStatusFilter === 'new'
                              ? 'ed-admin-btn-dark'
                              : 'ed-admin-btn-outline'
                          }`}
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                        >
                          New ({applications.filter((a) => a.status === 'new').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplicationStatusFilter('reviewed')}
                          className={`ed-admin-btn ${
                            applicationStatusFilter === 'reviewed'
                              ? 'ed-admin-btn-dark'
                              : 'ed-admin-btn-outline'
                          }`}
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                        >
                          Reviewed ({applications.filter((a) => a.status === 'reviewed').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplicationStatusFilter('interviewing')}
                          className={`ed-admin-btn ${
                            applicationStatusFilter === 'interviewing'
                              ? 'ed-admin-btn-dark'
                              : 'ed-admin-btn-outline'
                          }`}
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                        >
                          Interviewing ({applications.filter((a) => a.status === 'interviewing').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplicationStatusFilter('hired')}
                          className={`ed-admin-btn ${
                            applicationStatusFilter === 'hired'
                              ? 'ed-admin-btn-dark'
                              : 'ed-admin-btn-outline'
                          }`}
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                        >
                          Hired ({applications.filter((a) => a.status === 'hired').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplicationStatusFilter('rejected')}
                          className={`ed-admin-btn ${
                            applicationStatusFilter === 'rejected'
                              ? 'ed-admin-btn-dark'
                              : 'ed-admin-btn-outline'
                          }`}
                          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                        >
                          Rejected ({applications.filter((a) => a.status === 'rejected').length})
                        </button>
                      </div>

                      <div style={{ minWidth: 260 }}>
                        <div className="ed-admin-search-wrap">
                          <SearchOutlined className="ed-admin-search-icon" />
                          <input
                            type="text"
                            className="ed-admin-search-input"
                            placeholder="Search applicants by name, email, role..."
                            value={applicationSearch}
                            onChange={(e) => setApplicationSearch(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Applications Table */}
                    <div className="ed-admin-table-wrap">
                      <table className="ed-admin-table">
                        <thead>
                          <tr>
                            <th>Candidate</th>
                            <th>Role Applied For</th>
                            <th>Resume &amp; Links</th>
                            <th>Candidate Note</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications
                            .filter((a) => {
                              if (applicationStatusFilter !== 'all' && a.status !== applicationStatusFilter) {
                                return false;
                              }
                              if (applicationSearch.trim()) {
                                const q = applicationSearch.toLowerCase();
                                const matchName = String(a.name || '').toLowerCase().includes(q);
                                const matchEmail = String(a.email || '').toLowerCase().includes(q);
                                const matchRole = String(a.jobTitle || '').toLowerCase().includes(q);
                                const matchDept = String(a.department || '').toLowerCase().includes(q);
                                const matchNotes = String(a.notes || '').toLowerCase().includes(q);
                                return matchName || matchEmail || matchRole || matchDept || matchNotes;
                              }
                              return true;
                            })
                            .map((app) => (
                              <tr key={app._id}>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{app.name}</div>
                                  <div style={{ fontSize: 12, color: '#64748b' }}>
                                    <a href={`mailto:${app.email}`} style={{ color: '#4f46e5' }}>
                                      {app.email}
                                    </a>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                    {app.jobTitle}
                                  </div>
                                  <div style={{ marginTop: 2 }}>
                                    <Tag color="geekblue" style={{ borderRadius: 999, fontSize: 11 }}>
                                      {app.department || 'Editorial'}
                                    </Tag>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {app.resumeUrl ? (
                                      <a
                                        href={resolveResumeUrl(app.resumeUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          fontSize: 12,
                                          color: '#4f46e5',
                                          fontWeight: 600,
                                          textDecoration: 'none',
                                        }}
                                      >
                                        <FilePdfOutlined style={{ color: '#ef4444' }} />
                                        <span>{app.resumeFileName || 'Download Resume'}</span>
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: 12, color: '#94a3b8' }}>No resume file</span>
                                    )}
                                    {app.portfolio && (
                                      <a
                                        href={
                                          app.portfolio.startsWith('http')
                                            ? app.portfolio
                                            : `https://${app.portfolio}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          fontSize: 11,
                                          color: '#0ea5e9',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        <LinkOutlined />
                                        <span>Portfolio Link</span>
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: '#475569',
                                      maxWidth: 240,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={app.notes}
                                  >
                                    {app.notes || 'No note provided'}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: 12, color: '#64748b' }}>
                                    {new Date(app.createdAt).toLocaleDateString()}
                                  </span>
                                </td>
                                <td>
                                  <select
                                    className="ed-admin-select"
                                    value={app.status}
                                    onChange={(e) =>
                                      handleUpdateApplicationStatus(app._id, e.target.value)
                                    }
                                    style={{
                                      fontSize: 12,
                                      padding: '4px 8px',
                                      height: 30,
                                      fontWeight: 600,
                                      borderRadius: 8,
                                      borderColor:
                                        app.status === 'new'
                                          ? '#93c5fd'
                                          : app.status === 'interviewing'
                                          ? '#fde68a'
                                          : app.status === 'hired'
                                          ? '#86efac'
                                          : app.status === 'rejected'
                                          ? '#fca5a5'
                                          : '#e2e8f0',
                                      background:
                                        app.status === 'new'
                                          ? '#eff6ff'
                                          : app.status === 'interviewing'
                                          ? '#fefce8'
                                          : app.status === 'hired'
                                          ? '#f0fdf4'
                                          : app.status === 'rejected'
                                          ? '#fef2f2'
                                          : '#f8fafc',
                                      color:
                                        app.status === 'new'
                                          ? '#1d4ed8'
                                          : app.status === 'interviewing'
                                          ? '#854d0e'
                                          : app.status === 'hired'
                                          ? '#166534'
                                          : app.status === 'rejected'
                                          ? '#991b1b'
                                          : '#334155',
                                    }}
                                  >
                                    <option value="new">New</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="interviewing">Interviewing</option>
                                    <option value="hired">Hired</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: 6 }}>
                                    <button
                                      type="button"
                                      className="ed-admin-btn ed-admin-btn-outline"
                                      style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                                      onClick={() => {
                                        setSelectedAppModal({ open: true, application: app });
                                        setAdminAppNotes(app.adminNotes || '');
                                      }}
                                    >
                                      <EyeOutlined />
                                      <span>Review</span>
                                    </button>
                                    <Popconfirm
                                      title={`Delete application from "${app.name}"?`}
                                      description="This action will delete the candidate record and attached resume."
                                      onConfirm={() => handleDeleteApplication(app._id)}
                                      okText="Delete"
                                      okButtonProps={{ danger: true }}
                                    >
                                      <button
                                        type="button"
                                        className="ed-admin-btn ed-admin-btn-outline"
                                        style={{ height: 28, padding: '0 8px', color: '#ef4444' }}
                                      >
                                        <DeleteOutlined />
                                      </button>
                                    </Popconfirm>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {applications.length === 0 && (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                          <Empty description="No candidate applications received yet." />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                TAB 8: GLOBAL PLATFORM SETTINGS
               ========================================================= */}
            {activeTab === 'settings' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">Global Publication Configuration</h3>
                    <p className="ed-admin-panel-sub">
                      Manage site-wide identity, announcement banners, registration access, and
                      editorial limits.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ed-admin-btn ed-admin-btn-dark"
                    onClick={handleSaveSiteSettings}
                    disabled={savingSettings}
                  >
                    <span>{savingSettings ? 'Saving...' : 'Save Platform Settings'}</span>
                  </button>
                </div>

                <form
                  onSubmit={handleSaveSiteSettings}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: 28,
                  }}
                >
                  {/* Column 1: Publication Identity & Announcement Banner */}
                  <div>
                    <h4
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        marginBottom: 16,
                      }}
                    >
                      Publication Identity
                    </h4>
                    <div style={{ marginBottom: 16 }}>
                      <label className="ed-admin-label">Publication Name</label>
                      <input
                        type="text"
                        className="ed-admin-input"
                        value={siteSettings.siteName}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, siteName: e.target.value }))
                        }
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label className="ed-admin-label">Editorial Tagline / Mission</label>
                      <textarea
                        rows={3}
                        className="ed-admin-textarea"
                        value={siteSettings.siteTagline}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, siteTagline: e.target.value }))
                        }
                      />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <label className="ed-admin-label">Support Contact Email</label>
                      <input
                        type="email"
                        className="ed-admin-input"
                        value={siteSettings.supportEmail}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, supportEmail: e.target.value }))
                        }
                      />
                    </div>

                    <h4
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        marginBottom: 16,
                      }}
                    >
                      Site-Wide Announcement Ribbon
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          Display Announcement Banner
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Shows a live announcement ribbon across the top of the publication
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(siteSettings.announcementEnabled)}
                        onChange={(checked) =>
                          setSiteSettings((s) => ({ ...s, announcementEnabled: checked }))
                        }
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label className="ed-admin-label">Announcement Text</label>
                      <input
                        type="text"
                        className="ed-admin-input"
                        value={siteSettings.announcementText}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, announcementText: e.target.value }))
                        }
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="ed-admin-label">CTA Button Label</label>
                        <input
                          type="text"
                          className="ed-admin-input"
                          value={siteSettings.announcementLinkLabel || ''}
                          onChange={(e) =>
                            setSiteSettings((s) => ({
                              ...s,
                              announcementLinkLabel: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="ed-admin-label">CTA Link Path</label>
                        <input
                          type="text"
                          className="ed-admin-input"
                          value={siteSettings.announcementLink || ''}
                          onChange={(e) =>
                            setSiteSettings((s) => ({ ...s, announcementLink: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Access Control & Governance */}
                  <div>
                    <h4
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        marginBottom: 16,
                      }}
                    >
                      Access Control & Governance Policies
                    </h4>

                    {[
                      {
                        field: 'allowRegistrations',
                        title: 'Allow New User Registrations',
                        desc: 'When disabled, /register blocks new signups while existing members can still sign in.',
                      },
                      {
                        field: 'allowCommentsGlobal',
                        title: 'Allow Reader Comments Globally',
                        desc: 'Master switch for article discussions across the publication.',
                      },
                      {
                        field: 'maintenanceMode',
                        title: 'Editorial Maintenance Mode Banner',
                        desc: 'Displays a maintenance notice to readers while administrators retain full access.',
                      },
                    ].map((policy) => (
                      <div
                        key={policy.field}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{policy.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{policy.desc}</div>
                        </div>
                        <Switch
                          checked={Boolean(siteSettings[policy.field])}
                          onChange={(checked) =>
                            setSiteSettings((s) => ({ ...s, [policy.field]: checked }))
                          }
                        />
                      </div>
                    ))}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 14,
                        marginTop: 20,
                      }}
                    >
                      <div>
                        <label className="ed-admin-label">Max Gallery Images Per Story</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="ed-admin-input"
                          value={siteSettings.maxImagesPerPost || 5}
                          onChange={(e) =>
                            setSiteSettings((s) => ({
                              ...s,
                              maxImagesPerPost: Number(e.target.value) || 5,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="ed-admin-label">Featured Hero Stories Limit</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          className="ed-admin-input"
                          value={siteSettings.featuredBannerLimit || 5}
                          onChange={(e) =>
                            setSiteSettings((s) => ({
                              ...s,
                              featuredBannerLimit: Number(e.target.value) || 5,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Official Social Media Channels */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                    <h4
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        marginBottom: 6,
                      }}
                    >
                      Official Publication Social Media Channels
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 18 }}>
                      These links appear in the website footer and on community resource strips. Leave empty if a channel is inactive.
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 16,
                      }}
                    >
                      {[
                        { key: 'instagram', label: 'Instagram Profile URL' },
                        { key: 'twitter', label: 'X / Twitter Profile URL' },
                        { key: 'facebook', label: 'Facebook Page URL' },
                        { key: 'discord', label: 'Discord Community Invite URL' },
                        { key: 'tiktok', label: 'TikTok Account URL' },
                        { key: 'linkedin', label: 'LinkedIn Company Page URL' },
                        { key: 'github', label: 'GitHub Repository / Org URL' },
                      ].map((soc) => (
                        <div key={soc.key}>
                          <label className="ed-admin-label">{soc.label}</label>
                          <input
                            type="text"
                            className="ed-admin-input"
                            value={siteSettings?.socialLinks?.[soc.key] || ''}
                            placeholder="https://..."
                            onChange={(e) =>
                              setSiteSettings((s) => ({
                                ...s,
                                socialLinks: {
                                  ...(s.socialLinks || {}),
                                  [soc.key]: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Frequently Asked Questions (FAQs) Manager */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                    <h4
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        marginBottom: 6,
                      }}
                    >
                      Frequently Asked Questions (FAQs) Management
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 18 }}>
                      Add custom FAQ items to be published on the /faq page.
                    </p>

                    {/* Add FAQ Sub-form */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '16px 20px',
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#0f172a' }}>
                        + Add New FAQ Question
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 2fr',
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <label className="ed-admin-label">Category</label>
                          <input
                            type="text"
                            className="ed-admin-input"
                            placeholder="e.g., Publishing, Reader Experience, General"
                            value={newFaq.category}
                            onChange={(e) => setNewFaq((f) => ({ ...f, category: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="ed-admin-label">Question</label>
                          <input
                            type="text"
                            className="ed-admin-input"
                            placeholder="e.g., How do I submit an essay for review?"
                            value={newFaq.question}
                            onChange={(e) => setNewFaq((f) => ({ ...f, question: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label className="ed-admin-label">Answer</label>
                        <textarea
                          rows={2}
                          className="ed-admin-textarea"
                          placeholder="Provide the comprehensive answer to display..."
                          value={newFaq.answer}
                          onChange={(e) => setNewFaq((f) => ({ ...f, answer: e.target.value }))}
                        />
                      </div>
                      <button
                        type="button"
                        className="ed-admin-btn ed-admin-btn-outline"
                        onClick={handleAddFaq}
                        style={{ fontSize: 12, height: 32 }}
                      >
                        <PlusOutlined />
                        <span>Add Question to List</span>
                      </button>
                    </div>

                    {/* Current Custom FAQs list */}
                    {(siteSettings.customFaqs || []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>
                          Configured Custom Questions ({(siteSettings.customFaqs || []).length}):
                        </div>
                        {(siteSettings.customFaqs || []).map((faqItem, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 16,
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Tag color="blue" style={{ fontSize: 11, borderRadius: 999 }}>
                                  {faqItem.category || 'General'}
                                </Tag>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                  {faqItem.question}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                {faqItem.answer}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="ed-admin-btn ed-admin-btn-outline"
                              style={{ height: 26, padding: '0 8px', color: '#ef4444' }}
                              onClick={() => handleDeleteFaq(idx)}
                            >
                              <DeleteOutlined />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 5: Legal & Policy Overrides */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                    <h4
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        marginBottom: 6,
                      }}
                    >
                      Legal & Editorial Policies Content Overrides
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 18 }}>
                      Enter custom text for Terms of Service, Privacy Policy, and Return Policy. If left empty, default high-grade editorial standards are displayed.
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 20,
                      }}
                    >
                      <div>
                        <label className="ed-admin-label">Terms of Service Content</label>
                        <textarea
                          rows={6}
                          className="ed-admin-textarea"
                          placeholder="Leave blank to use default publication terms, or input custom terms..."
                          value={siteSettings.customTermsText || ''}
                          onChange={(e) =>
                            setSiteSettings((s) => ({ ...s, customTermsText: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="ed-admin-label">Privacy Policy Content</label>
                        <textarea
                          rows={6}
                          className="ed-admin-textarea"
                          placeholder="Leave blank to use default publication privacy policy, or input custom policy..."
                          value={siteSettings.customPrivacyText || ''}
                          onChange={(e) =>
                            setSiteSettings((s) => ({ ...s, customPrivacyText: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="ed-admin-label">Return & Refund Policy Content</label>
                        <textarea
                          rows={6}
                          className="ed-admin-textarea"
                          placeholder="Leave blank to use default return policy, or input custom text..."
                          value={siteSettings.customReturnText || ''}
                          onChange={(e) =>
                            setSiteSettings((s) => ({ ...s, customReturnText: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* =========================================================
                TAB 9: SECURITY & AUDIT GOVERNANCE LOGS
               ========================================================= */}
            {activeTab === 'audit' && (
              <div className="ed-admin-panel">
                <div className="ed-admin-panel-header">
                  <div>
                    <h3 className="ed-admin-panel-title">Security & Audit Governance Logs</h3>
                    <p className="ed-admin-panel-sub">
                      Immutable trail of all administrative actions, role changes, account suspensions, and platform mutations.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="ed-admin-btn ed-admin-btn-outline"
                      onClick={fetchAuditLogs}
                      disabled={loadingAudit}
                    >
                      <ReloadOutlined spin={loadingAudit} />
                      <span>Refresh Logs</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Input
                    placeholder="Search by admin, target, action, or IP address..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    style={{ maxWidth: 360, borderRadius: 10, height: 40 }}
                    allowClear
                  />
                  <Select
                    value={auditFilter}
                    onChange={(val) => setAuditFilter(val)}
                    style={{ width: 200, height: 40 }}
                    options={[
                      { label: 'All Actions', value: 'all' },
                      { label: 'Role Changes', value: 'ROLE_CHANGED' },
                      { label: 'User Suspensions', value: 'USER_SUSPENDED' },
                      { label: 'User Activations', value: 'USER_ACTIVATED' },
                      { label: 'Settings Updates', value: 'SETTINGS_UPDATED' },
                    ]}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    Showing {filteredAuditLogs.length} logged events
                  </span>
                </div>

                {/* Audit Logs Table */}
                <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Table
                    loading={loadingAudit}
                    dataSource={filteredAuditLogs}
                    rowKey="_id"
                    pagination={{ pageSize: 15 }}
                    columns={[
                      {
                        title: 'Timestamp',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        render: (val) => (
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                            {moment(val).format('MMM D, YYYY · HH:mm:ss')}
                          </span>
                        ),
                      },
                      {
                        title: 'Action Type',
                        dataIndex: 'actionType',
                        key: 'actionType',
                        render: (type) => {
                          let color = 'default';
                          if (type === 'USER_SUSPENDED') color = 'error';
                          else if (type === 'USER_ACTIVATED') color = 'success';
                          else if (type === 'ROLE_CHANGED') color = 'purple';
                          else if (type === 'SETTINGS_UPDATED') color = 'processing';
                          return (
                            <Tag color={color} style={{ fontWeight: 700, borderRadius: 6 }}>
                              {type}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: 'Admin Actor',
                        key: 'admin',
                        render: (_, record) => (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar
                              size={26}
                              src={record.adminId?.profilePicture}
                              icon={<UserOutlined />}
                            />
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                              {record.adminUsername || record.adminId?.username || 'admin'}
                            </span>
                          </div>
                        ),
                      },
                      {
                        title: 'Target Entity',
                        key: 'target',
                        render: (_, record) => (
                          <div>
                            <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>
                              {record.targetLabel || record.targetId || 'Platform'}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              {record.targetType}
                            </span>
                          </div>
                        ),
                      },
                      {
                        title: 'Network / IP',
                        dataIndex: 'ipAddress',
                        key: 'ipAddress',
                        render: (ip) => (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                            {ip || '127.0.0.1'}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            )}
          </>
        )}
          </main>
        </div>
      </div>

      {/* Modal: Create New User */}
      <Modal
        open={createUserModalOpen}
        onCancel={() => setCreateUserModalOpen(false)}
        footer={null}
        title="Create New User Account (Admin)"
        centered
      >
        <form onSubmit={handleCreateUser} style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Username</label>
            <input
              type="text"
              className="ed-admin-input"
              required
              placeholder="e.g., sarahconnor"
              value={newUserForm.username}
              onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Email Address</label>
            <input
              type="email"
              className="ed-admin-input"
              required
              placeholder="sarah@example.com"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Initial Password</label>
            <input
              type="password"
              className="ed-admin-input"
              required
              placeholder="At least 6 characters"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="ed-admin-label">Role</label>
              <Select
                style={{ width: '100%' }}
                value={newUserForm.roles}
                onChange={(val) => setNewUserForm((f) => ({ ...f, roles: val }))}
                options={[
                  { value: 'other', label: '👤 Member' },
                  { value: 'editor', label: '✍️ Editor' },
                  { value: 'admin', label: '🛡️ Admin' },
                ]}
              />
            </div>
            <div>
              <label className="ed-admin-label">Location</label>
              <input
                type="text"
                className="ed-admin-input"
                placeholder="City, Country"
                value={newUserForm.location}
                onChange={(e) => setNewUserForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>
              Grant Verified Writer Badge
            </span>
            <Switch
              checked={newUserForm.isVerified}
              onChange={(checked) => setNewUserForm((f) => ({ ...f, isVerified: checked }))}
            />
          </div>
          <button
            type="submit"
            className="ed-admin-btn ed-admin-btn-dark"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={creatingUser}
          >
            {creatingUser ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>

      {/* Modal: Edit User / Reset Password */}
      <Modal
        open={editUserModal.open}
        onCancel={() => setEditUserModal({ open: false, user: null })}
        footer={null}
        title={`Manage User @${editUserModal.user?.username || ''}`}
        centered
      >
        <form onSubmit={handleSaveEditUser} style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Username</label>
            <input
              type="text"
              className="ed-admin-input"
              value={editUserForm.username}
              onChange={(e) => setEditUserForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Email Address</label>
            <input
              type="email"
              className="ed-admin-input"
              value={editUserForm.email}
              onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Location</label>
            <input
              type="text"
              className="ed-admin-input"
              value={editUserForm.location}
              onChange={(e) => setEditUserForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">
              Admin Password Override (Leave blank to keep existing password)
            </label>
            <input
              type="password"
              className="ed-admin-input"
              placeholder="Enter new password to reset..."
              value={editUserForm.newPassword}
              onChange={(e) => setEditUserForm((f) => ({ ...f, newPassword: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="ed-admin-btn ed-admin-btn-dark"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={savingUser}
          >
            {savingUser ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Modal: View Inquiry Details */}
      <Modal
        open={selectedInquiryModal.open}
        onCancel={() => setSelectedInquiryModal({ open: false, inquiry: null })}
        footer={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'Newsreader, serif', fontSize: 20 }}>Support Inquiry Details</span>
            {selectedInquiryModal.inquiry?.status === 'resolved' ? (
              <Tag color="success" style={{ borderRadius: 999 }}>Resolved</Tag>
            ) : (
              <Tag color="warning" style={{ borderRadius: 999 }}>New Inquiry</Tag>
            )}
          </div>
        }
        centered
        width={640}
      >
        {selectedInquiryModal.inquiry && (
          <div style={{ marginTop: 14 }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>From: </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedInquiryModal.inquiry.name}</span>
                  <span style={{ color: '#94a3b8', margin: '0 6px' }}>•</span>
                  <a href={`mailto:${selectedInquiryModal.inquiry.email}`} style={{ color: '#4f46e5' }}>
                    {selectedInquiryModal.inquiry.email}
                  </a>
                </div>
                <Tag color="blue" style={{ borderRadius: 999 }}>
                  {selectedInquiryModal.inquiry.category || 'Support'}
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Received: {new Date(selectedInquiryModal.inquiry.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="ed-admin-label">Subject</label>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
                {selectedInquiryModal.inquiry.subject}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="ed-admin-label">Message Content</label>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedInquiryModal.inquiry.message}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {selectedInquiryModal.inquiry.status === 'resolved' ? (
                  <button
                    type="button"
                    className="ed-admin-btn ed-admin-btn-outline"
                    onClick={() => handleUpdateInquiryStatus(selectedInquiryModal.inquiry._id, 'new')}
                  >
                    Reopen as New
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ed-admin-btn ed-admin-btn-dark"
                    onClick={() => handleUpdateInquiryStatus(selectedInquiryModal.inquiry._id, 'resolved')}
                  >
                    <CheckOutlined />
                    <span>Mark as Resolved</span>
                  </button>
                )}
                <a
                  href={`mailto:${selectedInquiryModal.inquiry.email}?subject=${encodeURIComponent(`Re: ${selectedInquiryModal.inquiry.subject}`)}`}
                  className="ed-admin-btn ed-admin-btn-outline"
                  style={{ textDecoration: 'none' }}
                >
                  <MailOutlined />
                  <span>Reply via Email</span>
                </a>
              </div>

              <Popconfirm
                title="Delete inquiry permanently?"
                onConfirm={() => handleDeleteInquiry(selectedInquiryModal.inquiry._id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <button
                  type="button"
                  className="ed-admin-btn ed-admin-btn-outline"
                  style={{ color: '#ef4444' }}
                >
                  <DeleteOutlined />
                  <span>Delete</span>
                </button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create or Edit Job Opening */}
      <Modal
        open={jobModal.open}
        onCancel={() => setJobModal({ open: false, isEditing: false, job: null })}
        footer={null}
        title={
          <span style={{ fontFamily: 'Newsreader, serif', fontSize: 20 }}>
            {jobModal.isEditing ? 'Edit Career Opening' : 'Post New Career Opening'}
          </span>
        }
        centered
        width={680}
      >
        <form onSubmit={handleSaveJob} style={{ marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="ed-admin-label">Role Title *</label>
              <input
                type="text"
                className="ed-admin-input"
                required
                placeholder="e.g., Senior Editorial Essayist"
                value={jobForm.title}
                onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-admin-label">Department *</label>
              <select
                className="ed-admin-select"
                value={jobForm.department}
                onChange={(e) => setJobForm((f) => ({ ...f, department: e.target.value }))}
              >
                <option value="Editorial">Editorial</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
                <option value="Product">Product</option>
                <option value="Growth">Growth</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="ed-admin-label">Location</label>
              <input
                type="text"
                className="ed-admin-input"
                placeholder="e.g., Remote (Global)"
                value={jobForm.location}
                onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-admin-label">Employment Type</label>
              <select
                className="ed-admin-select"
                value={jobForm.type}
                onChange={(e) => setJobForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="ed-admin-label">Experience Level</label>
              <select
                className="ed-admin-select"
                value={jobForm.experience}
                onChange={(e) => setJobForm((f) => ({ ...f, experience: e.target.value }))}
              >
                <option value="Entry-Level">Entry-Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead / Director">Lead / Director</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="ed-admin-label">Salary Range</label>
              <input
                type="text"
                className="ed-admin-input"
                placeholder="e.g., $90,000 – $120,000"
                value={jobForm.salaryRange}
                onChange={(e) => setJobForm((f) => ({ ...f, salaryRange: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-admin-label">Tags (comma-separated)</label>
              <input
                type="text"
                className="ed-admin-input"
                placeholder="e.g., React, Node.js, Architecture"
                value={jobForm.tags}
                onChange={(e) => setJobForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="ed-admin-label">Role Description *</label>
            <textarea
              rows={3}
              className="ed-admin-textarea"
              required
              placeholder="Provide a compelling overview of the role..."
              value={jobForm.description}
              onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="ed-admin-label">Key Responsibilities (1 per line)</label>
              <textarea
                rows={3}
                className="ed-admin-textarea"
                placeholder="Research and compose essays&#10;Mentor writers..."
                value={jobForm.responsibilities}
                onChange={(e) => setJobForm((f) => ({ ...f, responsibilities: e.target.value }))}
              />
            </div>
            <div>
              <label className="ed-admin-label">Requirements (1 per line)</label>
              <textarea
                rows={3}
                className="ed-admin-textarea"
                placeholder="5+ years experience&#10;Deep technical understanding..."
                value={jobForm.requirements}
                onChange={(e) => setJobForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch
                checked={Boolean(jobForm.isActive)}
                onChange={(checked) => setJobForm((f) => ({ ...f, isActive: checked }))}
              />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                Visible immediately on public /careers
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="ed-admin-btn ed-admin-btn-outline"
                onClick={() => setJobModal({ open: false, isEditing: false, job: null })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ed-admin-btn ed-admin-btn-dark"
                disabled={savingJob}
              >
                {savingJob ? 'Saving...' : jobModal.isEditing ? 'Save Changes' : 'Publish Opening'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: View & Review Candidate Application */}
      <Modal
        open={selectedAppModal.open}
        onCancel={() => setSelectedAppModal({ open: false, application: null })}
        footer={null}
        width={720}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'Newsreader, serif', fontSize: 21, fontWeight: 600 }}>
              Candidate Application Dossier
            </span>
            {selectedAppModal.application && (
              <Tag
                color={
                  selectedAppModal.application.status === 'new'
                    ? 'blue'
                    : selectedAppModal.application.status === 'interviewing'
                    ? 'gold'
                    : selectedAppModal.application.status === 'hired'
                    ? 'success'
                    : selectedAppModal.application.status === 'rejected'
                    ? 'error'
                    : 'default'
                }
                style={{ borderRadius: 999, textTransform: 'capitalize', fontWeight: 600 }}
              >
                {selectedAppModal.application.status}
              </Tag>
            )}
          </div>
        }
      >
        {selectedAppModal.application && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                background: '#f8fafc',
                padding: '16px 20px',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Candidate Name &amp; Contact
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  {selectedAppModal.application.name}
                </div>
                <div style={{ fontSize: 13, marginTop: 3 }}>
                  <a href={`mailto:${selectedAppModal.application.email}`} style={{ color: '#4f46e5', fontWeight: 500 }}>
                    {selectedAppModal.application.email}
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Position &amp; Department
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  {selectedAppModal.application.jobTitle}
                </div>
                <div style={{ marginTop: 4 }}>
                  <Tag color="geekblue" style={{ borderRadius: 999, fontSize: 11 }}>
                    {selectedAppModal.application.department || 'Editorial'}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>
                    Applied {new Date(selectedAppModal.application.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Resume & Portfolio Links */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Application Attachments &amp; Links
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {selectedAppModal.application.resumeUrl ? (
                  <a
                    href={resolveResumeUrl(selectedAppModal.application.resumeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ed-admin-btn ed-admin-btn-dark"
                    style={{ textDecoration: 'none', height: 38, padding: '0 16px' }}
                  >
                    <FilePdfOutlined style={{ color: '#ef4444', fontSize: 16 }} />
                    <span>View Resume Document ({selectedAppModal.application.resumeFileName || 'Resume.pdf'})</span>
                  </a>
                ) : (
                  <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f1f5f9', fontSize: 12, color: '#64748b' }}>
                    No resume file uploaded
                  </div>
                )}

                {selectedAppModal.application.portfolio && (
                  <a
                    href={
                      selectedAppModal.application.portfolio.startsWith('http')
                        ? selectedAppModal.application.portfolio
                        : `https://${selectedAppModal.application.portfolio}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ed-admin-btn ed-admin-btn-outline"
                    style={{ textDecoration: 'none', height: 38, padding: '0 16px' }}
                  >
                    <LinkOutlined style={{ color: '#0ea5e9' }} />
                    <span>Visit Portfolio / LinkedIn</span>
                  </a>
                )}
              </div>
            </div>

            {/* Candidate Cover Letter / Note */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Candidate Note / Introduction
              </div>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 18px',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#334155',
                  maxHeight: 200,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedAppModal.application.notes || 'No introductory note provided.'}
              </div>
            </div>

            {/* Status Update & Internal Notes */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="ed-admin-label">Hiring Status</label>
                  <select
                    className="ed-admin-select"
                    value={selectedAppModal.application.status}
                    onChange={(e) =>
                      handleUpdateApplicationStatus(
                        selectedAppModal.application._id,
                        e.target.value,
                        adminAppNotes
                      )
                    }
                  >
                    <option value="new">New (Unreviewed)</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="ed-admin-label">Internal Editorial Notes</label>
                  <textarea
                    rows={2}
                    className="ed-admin-textarea"
                    placeholder="Add internal evaluation, interview feedback, or review notes..."
                    value={adminAppNotes}
                    onChange={(e) => setAdminAppNotes(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="ed-admin-btn ed-admin-btn-outline"
                  onClick={() =>
                    handleUpdateApplicationStatus(
                      selectedAppModal.application._id,
                      selectedAppModal.application.status,
                      adminAppNotes
                    )
                  }
                  disabled={updatingAppStatus}
                >
                  <span>{updatingAppStatus ? 'Saving...' : 'Save Review Notes'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #f1f5f9',
                paddingTop: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`mailto:${selectedAppModal.application.email}?subject=${encodeURIComponent(
                    `Regarding your application for ${selectedAppModal.application.jobTitle} at BlogSum`
                  )}`}
                  className="ed-admin-btn ed-admin-btn-dark"
                  style={{ textDecoration: 'none' }}
                >
                  <MailOutlined />
                  <span>Email Candidate Directly</span>
                </a>
              </div>

              <Popconfirm
                title="Delete this candidate application permanently?"
                description="This action will permanently delete the candidate record and attached resume document."
                onConfirm={() => handleDeleteApplication(selectedAppModal.application._id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <button
                  type="button"
                  className="ed-admin-btn ed-admin-btn-outline"
                  style={{ color: '#ef4444', borderColor: '#fecaca' }}
                >
                  <DeleteOutlined />
                  <span>Delete Application</span>
                </button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
