import React, { useState, useEffect } from 'react';
import {
  Switch,
  Modal,
  Form,
  Input,
  Avatar,
  Select,
  Button,
  message,
  notification,
  Spin,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BellOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  CopyOutlined,
  KeyOutlined,
  CheckCircleFilled,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/NavBar';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import { BLOG_CATEGORIES } from '../components/BlogForm';

const SETTINGS_STORAGE_KEY = 'blogsum_user_settings_v1';

const DEFAULT_PREFS = {
  darkMode: false,
  fontSize: '16px',
  readingMode: false,
  emailNotifications: true,
  pushNotifications: false,
  notificationFrequency: 'Daily Digest',
  profileVisibility: true,
  dataSharing: false,
  twoFactorAuth: true,
  preferredCategories: ['Technology', 'Design', 'Culture'],
};

const loadStoredPrefs = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [activeSection, setActiveSection] = useState('account');
  const [prefs, setPrefs] = useState(loadStoredPrefs);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const handleExportMyData = async () => {
    setExportingData(true);
    try {
      const response = await axiosInstance.get('/api/users/export-my-data');
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(response.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `blogsum-data-export-${user?.username || 'account'}-${Date.now()}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      message.success('Your complete account data archive has been downloaded!');
    } catch (err) {
      console.error('Error exporting data:', err);
      message.error('Failed to export account data archive');
    } finally {
      setExportingData(false);
    }
  };

  const { data: twoFAStatus, refetch: refetch2FA } = useQuery({
    queryKey: ['2faStatus'],
    queryFn: async () => (await axiosInstance.get('/api/auth/2fa/status')).data,
    enabled: Boolean(user),
  });

  const [is2FASetupModalVisible, setIs2FASetupModalVisible] = useState(false);
  const [is2FADisableModalVisible, setIs2FADisableModalVisible] = useState(false);
  const [twoFASetupData, setTwoFASetupData] = useState(null);
  const [twoFASetupLoading, setTwoFASetupLoading] = useState(false);
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);
  const [twoFAVerificationCode, setTwoFAVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  const handleOpen2FASetup = async () => {
    setTwoFASetupLoading(true);
    setIs2FASetupModalVisible(true);
    setTwoFAVerificationCode('');
    try {
      const res = await axiosInstance.post('/api/auth/2fa/setup');
      setTwoFASetupData(res.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to initiate 2FA setup');
      setIs2FASetupModalVisible(false);
    } finally {
      setTwoFASetupLoading(false);
    }
  };

  const handleVerifyEnable2FA = async () => {
    const cleanToken = twoFAVerificationCode.trim().replace(/[\s-]/g, '');
    if (!cleanToken || cleanToken.length < 6) {
      message.warning('Please enter the 6-digit verification code from your authenticator app');
      return;
    }
    setTwoFAVerifying(true);
    try {
      const res = await axiosInstance.post('/api/auth/2fa/verify-enable', {
        token: cleanToken,
      });
      message.success(res.data.message || 'Two-Factor Authentication is now enabled!');
      setIs2FASetupModalVisible(false);
      refetch2FA();
    } catch (err) {
      message.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setTwoFAVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      message.warning('Please enter your account password to disable 2FA');
      return;
    }
    setDisabling2FA(true);
    try {
      const res = await axiosInstance.post('/api/auth/2fa/disable', {
        password: disablePassword,
        code: disableCode,
      });
      message.success(res.data.message || 'Two-Factor Authentication disabled');
      setIs2FADisableModalVisible(false);
      setDisablePassword('');
      setDisableCode('');
      refetch2FA();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  // GDPR Account Deletion States & Handlers
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const [deletionPreviewLoading, setDeletionPreviewLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [delete2FACode, setDelete2FACode] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleOpenDeleteModal = async () => {
    setIsDeleteModalVisible(true);
    setDeletionPreviewLoading(true);
    setDeleteConfirmation('');
    setDeletePassword('');
    setDelete2FACode('');
    try {
      const res = await axiosInstance.get('/api/users/me/deletion-preview');
      setDeletionPreview(res.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load account deletion summary');
    } finally {
      setDeletionPreviewLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      message.warning('Please type DELETE in all capital letters to confirm');
      return;
    }
    if (!deletePassword) {
      message.warning('Please enter your account password');
      return;
    }
    if (deletionPreview?.twoFactorEnabled && !delete2FACode) {
      message.warning('Please enter your 6-digit authenticator or recovery backup code');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await axiosInstance.delete('/api/users/me', {
        data: {
          confirmation: deleteConfirmation,
          password: deletePassword,
          code: delete2FACode,
        },
      });

      notification.success({
        message: 'Account Deleted',
        description: res.data?.message || 'Your account and personal data have been permanently erased.',
      });

      setIsDeleteModalVisible(false);
      if (logout) {
        await logout();
      } else {
        localStorage.removeItem('userInfo');
      }
      navigate('/register');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete account. Please verify credentials.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => (await axiosInstance.get('/api/users/profile')).data,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (profileData && isProfileModalVisible) {
      profileForm.setFieldsValue({
        username: profileData.username || user?.username || '',
        email: profileData.email || user?.email || '',
        location: profileData.location || '',
      });
    }
  }, [profileData, isProfileModalVisible, profileForm, user]);

  const updatePref = (key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleSaveAllPrefs = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
      message.success('Preferences saved');
    } catch {
      message.error('Could not save preferences');
    }
  };

  const handleProfileUpdate = async (values) => {
    setSavingProfile(true);
    try {
      await axiosInstance.put('/api/users/profile', values);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsProfileModalVisible(false);
      message.success('Profile updated successfully');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (values) => {
    setSavingPassword(true);
    try {
      await axiosInstance.put('/api/auth/changePassword', {
        email: profileData?.email || user?.email,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notification.success({ message: 'Password updated successfully' });
      passwordForm.resetFields();
      setIsPasswordModalVisible(false);
    } catch {
      notification.error({ message: 'Failed to update password. Check your current password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const displayUsername = profileData?.username || user?.username || 'Reader';
  const displayEmail = profileData?.email || user?.email || 'your.email@example.com';
  const displayLocation = profileData?.location || 'Location not set';

  const navItems = [
    { key: 'account', label: 'Account & Identity', icon: <UserOutlined /> },
    { key: 'appearance', label: 'Appearance & Reading', icon: <EyeOutlined /> },
    { key: 'notifications', label: 'Notifications', icon: <BellOutlined /> },
    { key: 'privacy', label: 'Privacy & Security', icon: <SafetyCertificateOutlined /> },
  ];

  return (
    <div className="ed-settings-page">
      <Navbar />

      <main className="ed-settings-shell">
        {/* Top Editorial Header */}
        <header className="ed-settings-header">
          <div>
            <span className="ed-settings-kicker">Workspace Preferences</span>
            <h1 className="ed-settings-title">Settings</h1>
            <p className="ed-settings-subtitle">
              Manage your author identity, reading typography, notification digests, and account security.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAllPrefs}
            className="ed-settings-save-btn"
          >
            <CheckOutlined />
            <span>Save Preferences</span>
          </button>
        </header>

        {/* Two-Column Editorial Settings Layout */}
        <div className="ed-settings-grid">
          {/* Left Navigation Rail */}
          <aside className="ed-settings-rail">
            <nav className="ed-settings-nav" aria-label="Settings sections">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.key);
                    document
                      .getElementById(`settings-${item.key}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`ed-settings-nav__item ${
                    activeSection === item.key ? 'is-active' : ''
                  }`}
                >
                  <span className="ed-settings-nav__icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="ed-settings-profile-mini">
              <Avatar
                size={44}
                src={profileData?.profilePicture}
                style={{ backgroundColor: '#111827', fontWeight: 700, flexShrink: 0 }}
              >
                {displayUsername[0]?.toUpperCase()}
              </Avatar>
              <div className="ed-settings-profile-mini__info">
                <div className="ed-settings-profile-mini__name">{displayUsername}</div>
                <div className="ed-settings-profile-mini__email">{displayEmail}</div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="ed-settings-profile-mini__link"
                title="Go to Profile"
              >
                <ArrowRightOutlined />
              </button>
            </div>
          </aside>

          {/* Right Settings Sections */}
          <div className="ed-settings-content">
            {/* 1. Account & Identity */}
            <section id="settings-account" className="ed-settings-card">
              <div className="ed-settings-card__head">
                <div>
                  <h2 className="ed-settings-card__title">AccountSettings</h2>
                  <p className="ed-settings-card__desc">
                    Your public author identity, primary email address, and account credentials.
                  </p>
                </div>
              </div>

              <div className="ed-settings-rows">
                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Author Profile</span>
                    <span className="ed-settings-row__sub">
                      {displayUsername} · {displayLocation}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalVisible(true)}
                    className="ed-settings-action-btn"
                  >
                    Update Profile
                  </button>
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Email Address</span>
                    <span className="ed-settings-row__sub">
                      Used for sign-in, security alerts, and digest notifications
                    </span>
                  </div>
                  <div className="ed-settings-readonly-pill">{displayEmail}</div>
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Password & Authentication</span>
                    <span className="ed-settings-row__sub">
                      Update your account password at any time
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalVisible(true)}
                    className="ed-settings-action-btn"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Appearance & Reading */}
            <section id="settings-appearance" className="ed-settings-card">
              <div className="ed-settings-card__head">
                <div>
                  <h2 className="ed-settings-card__title">Appearance & Reading</h2>
                  <p className="ed-settings-card__desc">
                    Customize typography scale, distraction-free reading, and preferred topics.
                  </p>
                </div>
              </div>

              <div className="ed-settings-rows">
                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Low-Light / Dark Theme</span>
                    <span className="ed-settings-row__sub">
                      Reduce screen glare for comfortable evening reading.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.darkMode}
                    onChange={(v) => updatePref('darkMode', v)}
                  />
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Base Article Font Size</span>
                    <span className="ed-settings-row__sub">
                      Adjust the default prose typography scale across long-form articles.
                    </span>
                  </div>
                  <div className="ed-settings-segmented">
                    {['15px', '16px', '18px', '20px'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updatePref('fontSize', size)}
                        className={`ed-settings-seg-btn ${
                          prefs.fontSize === size ? 'is-active' : ''
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Distraction-Free Reading Mode</span>
                    <span className="ed-settings-row__sub">
                      Hide floating rails while reading long essays.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.readingMode}
                    onChange={(v) => updatePref('readingMode', v)}
                  />
                </div>

                <div className="ed-settings-row ed-settings-row--stacked">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Preferred Topics</span>
                    <span className="ed-settings-row__sub">
                      Select the categories you read and write about most often.
                    </span>
                  </div>
                  <Select
                    mode="multiple"
                    value={prefs.preferredCategories}
                    onChange={(vals) => updatePref('preferredCategories', vals)}
                    style={{ width: '100%', marginTop: 8 }}
                    placeholder="Choose preferred categories"
                    options={(BLOG_CATEGORIES || ['Technology', 'Health', 'Lifestyle', 'Education', 'Travel']).map(
                      (cat) => ({ label: cat, value: cat })
                    )}
                  />
                </div>
              </div>
            </section>

            {/* 3. Notification Settings */}
            <section id="settings-notifications" className="ed-settings-card">
              <div className="ed-settings-card__head">
                <div>
                  <h2 className="ed-settings-card__title">Notification Settings</h2>
                  <p className="ed-settings-card__desc">
                    Choose how and when you hear about new responses, reactions, and followers.
                  </p>
                </div>
              </div>

              <div className="ed-settings-rows">
                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Email Notifications</span>
                    <span className="ed-settings-row__sub">
                      Receive email updates for new comments, reactions, and followers.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.emailNotifications}
                    onChange={(v) => updatePref('emailNotifications', v)}
                  />
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Browser Push Notifications</span>
                    <span className="ed-settings-row__sub">
                      Get real-time alerts when someone replies to your discussion or message.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.pushNotifications}
                    onChange={(v) => updatePref('pushNotifications', v)}
                  />
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Digest Frequency</span>
                    <span className="ed-settings-row__sub">
                      Choose how often we bundle your activity summary.
                    </span>
                  </div>
                  <div className="ed-settings-segmented">
                    {['Instant', 'Daily Digest', 'Weekly'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => updatePref('notificationFrequency', freq)}
                        className={`ed-settings-seg-btn ${
                          prefs.notificationFrequency === freq ? 'is-active' : ''
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Privacy & Security */}
            <section id="settings-privacy" className="ed-settings-card">
              <div className="ed-settings-card__head">
                <div>
                  <h2 className="ed-settings-card__title">Privacy & Security</h2>
                  <p className="ed-settings-card__desc">
                    Control your public author directory visibility and account protection.
                  </p>
                </div>
              </div>

              <div className="ed-settings-rows">
                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Public Author Profile</span>
                    <span className="ed-settings-row__sub">
                      Allow readers to view your published stories and hover profile card.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.profileVisibility}
                    onChange={(v) => updatePref('profileVisibility', v)}
                  />
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Anonymized Analytics</span>
                    <span className="ed-settings-row__sub">
                      Share anonymized reading metrics to help improve story recommendations.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.dataSharing}
                    onChange={(v) => updatePref('dataSharing', v)}
                  />
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="ed-settings-row__label">Two-Factor Authentication (TOTP / Authenticator App)</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: twoFAStatus?.twoFactorEnabled ? '#dcfce7' : '#f1f5f9',
                          color: twoFAStatus?.twoFactorEnabled ? '#15803d' : '#64748b',
                          border: twoFAStatus?.twoFactorEnabled ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        }}
                      >
                        {twoFAStatus?.twoFactorEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <span className="ed-settings-row__sub">
                      {twoFAStatus?.twoFactorEnabled
                        ? `Protected with Google Authenticator, 1Password, or Authy (${twoFAStatus.recoveryCodesCount || 0} recovery codes remaining).`
                        : 'Secure your administrative authority and author account using time-based one-time passwords (TOTP).'}
                    </span>
                  </div>
                  {twoFAStatus?.twoFactorEnabled ? (
                    <Button
                      danger
                      onClick={() => setIs2FADisableModalVisible(true)}
                      style={{ borderRadius: 10, fontWeight: 600, height: 38 }}
                    >
                      Disable 2FA
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<SafetyCertificateOutlined />}
                      onClick={handleOpen2FASetup}
                      style={{
                        borderRadius: 10,
                        fontWeight: 600,
                        height: 38,
                        background: '#0f172a',
                        borderColor: '#0f172a',
                      }}
                    >
                      Enable 2FA
                    </Button>
                  )}
                </div>

                <div className="ed-settings-row">
                  <div className="ed-settings-row__info">
                    <span className="ed-settings-row__label">Export My Data Archive (GDPR)</span>
                    <span className="ed-settings-row__sub">
                      Download a complete, machine-readable JSON archive of your authored stories, drafts, notifications, and profile data.
                    </span>
                  </div>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportMyData}
                    loading={exportingData}
                    style={{
                      borderRadius: 10,
                      fontWeight: 600,
                      height: 38,
                    }}
                  >
                    Export My Data
                  </Button>
                </div>

                <div
                  className="ed-settings-row"
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginTop: 12,
                  }}
                >
                  <div className="ed-settings-row__info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="ed-settings-row__label" style={{ color: '#be123c', fontWeight: 700 }}>
                        Delete Account Permanently (GDPR Article 17)
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                          background: '#ffe4e6',
                          color: '#9f1239',
                          border: '1px solid #fda4af',
                        }}
                      >
                        Irreversible
                      </span>
                    </div>
                    <span className="ed-settings-row__sub" style={{ color: '#9f1239' }}>
                      Erase your personal identity, credentials, stories, and series. Discussion comments will be anonymized to protect community context.
                    </span>
                  </div>
                  <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    onClick={handleOpenDeleteModal}
                    style={{
                      borderRadius: 10,
                      fontWeight: 700,
                      height: 38,
                      background: '#e11d48',
                      borderColor: '#e11d48',
                    }}
                  >
                    Delete Account...
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modern Edit Profile Modal */}
      <Modal
        title={null}
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        footer={null}
        width={480}
        centered
        className="ed-settings-modal"
      >
        <div className="ed-smodal-header">
          <span className="ed-smodal-kicker">Account Details</span>
          <h3 className="ed-smodal-title">Edit Profile</h3>
          <p className="ed-smodal-sub">
            Update how your name, email, and location appear across BlogSum.
          </p>
        </div>

        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
          requiredMark={false}
          className="ed-smodal-form"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="Your username"
              className="ed-smodal-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="you@example.com"
              className="ed-smodal-input"
            />
          </Form.Item>

          <Form.Item name="location" label="Location">
            <Input
              prefix={<EnvironmentOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="e.g., Nairobi, Kenya"
              className="ed-smodal-input"
            />
          </Form.Item>

          <div className="ed-smodal-actions">
            <button
              type="button"
              onClick={() => setIsProfileModalVisible(false)}
              className="ed-smodal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="ed-smodal-btn-primary"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Modern Change Password Modal */}
      <Modal
        title={null}
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={null}
        width={480}
        centered
        className="ed-settings-modal"
      >
        <div className="ed-smodal-header">
          <span className="ed-smodal-kicker">Security & Access</span>
          <h3 className="ed-smodal-title">Change Password</h3>
          <p className="ed-smodal-sub">
            Enter your current password and choose a strong new password.
          </p>
        </div>

        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordUpdate}
          requiredMark={false}
          validateTrigger="onChange"
          className="ed-smodal-form"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="Enter current password"
              className="ed-smodal-input"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="Create new password"
              className="ed-smodal-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="Repeat new password"
              className="ed-smodal-input"
            />
          </Form.Item>

          <div className="ed-smodal-actions">
            <button
              type="button"
              onClick={() => setIsPasswordModalVisible(false)}
              className="ed-smodal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="ed-smodal-btn-primary"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* 2FA TOTP Setup Modal */}
      <Modal
        title={null}
        open={is2FASetupModalVisible}
        onCancel={() => setIs2FASetupModalVisible(false)}
        footer={null}
        width={520}
        centered
        className="ed-settings-modal"
      >
        <div className="ed-smodal-header">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 26, color: '#2563eb' }} />
          </div>
          <h3 className="ed-smodal-title">Enable Two-Factor Authentication</h3>
          <p className="ed-smodal-sub">
            Protect your administrative control and account with standard time-based verification.
          </p>
        </div>

        {twoFASetupLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748b', fontSize: '0.9rem' }}>
              Generating secure authenticator key and QR code...
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 8px' }}>
            {/* Step 1: Scan QR Code */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '16px',
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569', marginBottom: 12 }}>
                STEP 1: SCAN QR CODE IN AUTHENTICATOR APP
              </div>
              {twoFASetupData?.qrCodeDataUrl && (
                <img
                  src={twoFASetupData.qrCodeDataUrl}
                  alt="2FA QR Code"
                  style={{
                    width: 170,
                    height: 170,
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    padding: 6,
                  }}
                />
              )}
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#64748b' }}>
                Compatible with Google Authenticator, 1Password, Authy, and Microsoft Authenticator.
              </div>
            </div>

            {/* Step 2: Manual Secret Key */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f1f5f9',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: '0.82rem',
                marginBottom: 18,
              }}
            >
              <div>
                <span style={{ color: '#64748b', marginRight: 6 }}>Manual key:</span>
                <strong style={{ fontFamily: 'monospace', letterSpacing: '0.08em', color: '#0f172a' }}>
                  {twoFASetupData?.secret}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(twoFASetupData?.secret || '');
                  message.success('Secret key copied to clipboard!');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#2563eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CopyOutlined /> Copy
              </button>
            </div>

            {/* Step 3: Emergency Backup Recovery Codes */}
            {twoFASetupData?.recoveryCodes && (
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: 14,
                  padding: '14px',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#854d0e' }}>
                    <KeyOutlined style={{ marginRight: 6 }} />
                    EMERGENCY RECOVERY BACKUP CODES
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(twoFASetupData.recoveryCodes.join('\n'));
                      message.success('All 8 recovery codes copied to clipboard!');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#854d0e',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Copy All
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px 12px',
                    fontFamily: 'monospace',
                    fontSize: '0.84rem',
                    color: '#713f12',
                    fontWeight: 700,
                  }}
                >
                  {twoFASetupData.recoveryCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#a16207' }}>
                  Save these codes now. Each code can be used once if you lose access to your authenticator app.
                </div>
              </div>
            )}

            {/* Step 4: Verification Code Input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                STEP 2: ENTER 6-DIGIT CODE FROM AUTHENTICATOR APP
              </div>
              <Input
                placeholder="000 000"
                maxLength={7}
                value={twoFAVerificationCode}
                onChange={(e) => setTwoFAVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  height: 46,
                  borderRadius: 12,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                }}
              />
            </div>

            <div className="ed-smodal-actions">
              <button
                type="button"
                onClick={() => setIs2FASetupModalVisible(false)}
                className="ed-smodal-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyEnable2FA}
                disabled={twoFAVerifying || twoFAVerificationCode.length < 6}
                className="ed-smodal-btn-primary"
              >
                {twoFAVerifying ? 'Activating...' : 'Verify & Activate 2FA'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2FA Disable Confirmation Modal */}
      <Modal
        title={null}
        open={is2FADisableModalVisible}
        onCancel={() => setIs2FADisableModalVisible(false)}
        footer={null}
        width={440}
        centered
        className="ed-settings-modal"
      >
        <div className="ed-smodal-header">
          <h3 className="ed-smodal-title">Disable Two-Factor Authentication</h3>
          <p className="ed-smodal-sub">
            Please enter your current account password to confirm disabling 2FA.
          </p>
        </div>

        <div style={{ padding: '0 8px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Current Password
            </label>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
              placeholder="Enter your account password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              style={{ height: 42, borderRadius: 10 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              6-Digit Authenticator or Recovery Code (Optional Extra Security)
            </label>
            <Input
              placeholder="Optional verification code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              style={{ height: 42, borderRadius: 10 }}
            />
          </div>

          <div className="ed-smodal-actions">
            <button
              type="button"
              onClick={() => {
                setIs2FADisableModalVisible(false);
                setDisablePassword('');
                setDisableCode('');
              }}
              className="ed-smodal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisable2FA}
              disabled={disabling2FA || !disablePassword}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {disabling2FA ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </Modal>

      {/* GDPR Article 17 Account Deletion Modal */}
      <Modal
        title={null}
        open={isDeleteModalVisible}
        onCancel={() => !deletingAccount && setIsDeleteModalVisible(false)}
        footer={null}
        width={520}
        centered
        className="ed-settings-modal"
      >
        <div className="ed-smodal-header">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#ffe4e6',
              border: '1px solid #fecdd3',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <DeleteOutlined style={{ fontSize: 26, color: '#e11d48' }} />
          </div>
          <h3 className="ed-smodal-title" style={{ color: '#9f1239' }}>
            Delete Account Permanently
          </h3>
          <p className="ed-smodal-sub">
            This action is final and irreversible under GDPR Article 17 (Right to Erasure).
          </p>
        </div>

        {deletionPreviewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 14, color: '#64748b', fontSize: '0.9rem' }}>
              Calculating account records and dependencies...
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 8px' }}>
            {deletionPreview?.blockedReason ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #f87171',
                  borderRadius: 12,
                  padding: '14px',
                  color: '#991b1b',
                  fontSize: '0.88rem',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Action Blocked</div>
                <div>{deletionPreview.blockedReason}</div>
              </div>
            ) : (
              <>
                {/* Breakdown Summary */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '14px 18px',
                    fontSize: '0.85rem',
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    The following will happen immediately:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.6 }}>
                    <li>
                      <strong>{deletionPreview?.storiesCount || 0} authored story/draft(s)</strong> and{' '}
                      <strong>{deletionPreview?.seriesCount || 0} series</strong> will be permanently destroyed.
                    </li>
                    <li>
                      <strong>{deletionPreview?.commentsCount || 0} comments & replies</strong> on other stories will be anonymized to <em>"Deleted user"</em>.
                    </li>
                    <li>
                      Your author profile, profile photo, credentials, and notification history will be erased.
                    </li>
                  </ul>
                </div>

                {/* Step 1: Confirmation Word */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Type <strong>DELETE</strong> in all caps to confirm:
                  </label>
                  <Input
                    placeholder="DELETE"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    style={{ height: 42, borderRadius: 10, fontWeight: 700 }}
                  />
                </div>

                {/* Step 2: Password */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Enter Account Password:
                  </label>
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                    placeholder="Enter current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    style={{ height: 42, borderRadius: 10 }}
                  />
                </div>

                {/* Step 3: 2FA Code (if user has 2FA enabled) */}
                {deletionPreview?.twoFactorEnabled && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Two-Factor Verification Code or Backup Recovery Code:
                    </label>
                    <Input
                      prefix={<SafetyCertificateOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                      placeholder="6-digit code or XXXX-XXXX"
                      value={delete2FACode}
                      onChange={(e) => setDelete2FACode(e.target.value)}
                      style={{ height: 42, borderRadius: 10 }}
                    />
                  </div>
                )}

                <div className="ed-smodal-actions">
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={() => setIsDeleteModalVisible(false)}
                    className="ed-smodal-btn-secondary"
                  >
                    Keep My Account
                  </button>
                  <button
                    type="button"
                    disabled={
                      deletingAccount ||
                      deleteConfirmation !== 'DELETE' ||
                      !deletePassword ||
                      (deletionPreview?.twoFactorEnabled && !delete2FACode)
                    }
                    onClick={handleConfirmDeleteAccount}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#e11d48',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor:
                        deleteConfirmation === 'DELETE' && deletePassword ? 'pointer' : 'not-allowed',
                      opacity: deleteConfirmation === 'DELETE' && deletePassword ? 1 : 0.6,
                    }}
                  >
                    {deletingAccount ? 'Erasing Account...' : 'Permanently Delete Account'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-settings-page {
          min-height: 100vh;
          background: #f9fafb;
          color: #111827;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-bottom: 88px;
        }
        .ed-settings-shell {
          max-width: 1120px;
          width: 92%;
          margin: 0 auto;
          padding-top: 112px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-settings-shell {
            max-width: 1440px;
            width: 94%;
          }
        }
        @media (min-width: 1920px) {
          .ed-settings-shell {
            max-width: 1640px;
            width: 95%;
          }
        }
        .ed-settings-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 32px;
        }
        .ed-settings-kicker {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .ed-settings-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2.1rem, 3.4vw, 2.75rem);
          font-weight: 500;
          color: #111827;
          letter-spacing: -0.025em;
          margin: 0 0 6px;
          line-height: 1.1;
        }
        .ed-settings-subtitle {
          font-size: 14.5px;
          color: #6b7280;
          margin: 0;
          max-width: 560px;
        }
        .ed-settings-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 22px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-settings-save-btn:hover {
          background: #1f2937;
          transform: translateY(-1px);
        }
        .ed-settings-grid {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 32px;
          align-items: start;
        }
        @media (min-width: 1536px) {
          .ed-settings-grid {
            grid-template-columns: 280px minmax(0, 1fr);
            gap: 40px;
          }
        }
        @media (min-width: 1920px) {
          .ed-settings-grid {
            grid-template-columns: 320px minmax(0, 1fr);
            gap: 48px;
          }
        }
        @media (max-width: 860px) {
          .ed-settings-grid {
            grid-template-columns: 1fr;
          }
        }
        .ed-settings-rail {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ed-settings-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 8px;
        }
        .ed-settings-nav__item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #4b5563;
          font-size: 13.5px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-settings-nav__item:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .ed-settings-nav__item.is-active {
          background: #111827;
          color: #ffffff;
        }
        .ed-settings-nav__icon {
          font-size: 15px;
          display: inline-flex;
        }
        .ed-settings-profile-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
        }
        .ed-settings-profile-mini__info {
          min-width: 0;
          flex: 1;
        }
        .ed-settings-profile-mini__name {
          font-size: 13.5px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ed-settings-profile-mini__email {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ed-settings-profile-mini__link {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-settings-profile-mini__link:hover {
          border-color: #111827;
          color: #111827;
        }
        .ed-settings-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ed-settings-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 26px 28px;
        }
        .ed-settings-card__head {
          padding-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 6px;
        }
        .ed-settings-card__title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 4px;
          letter-spacing: -0.015em;
        }
        .ed-settings-card__desc {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .ed-settings-rows {
          display: flex;
          flex-direction: column;
        }
        .ed-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .ed-settings-row:last-child {
          border-bottom: none;
          padding-bottom: 4px;
        }
        .ed-settings-row--stacked {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .ed-settings-row__info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-width: 520px;
        }
        .ed-settings-row__label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .ed-settings-row__sub {
          font-size: 12.5px;
          color: #6b7280;
          line-height: 1.45;
        }
        .ed-settings-action-btn {
          height: 36px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .ed-settings-action-btn:hover {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }
        .ed-settings-readonly-pill {
          padding: 6px 14px;
          border-radius: 999px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #4b5563;
          font-size: 13px;
          font-weight: 500;
        }
        .ed-settings-segmented {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
        }
        .ed-settings-seg-btn {
          border: none;
          background: transparent;
          color: #4b5563;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-settings-seg-btn.is-active {
          background: #111827;
          color: #ffffff;
        }
        .ed-settings-page .ant-switch-checked {
          background: #111827 !important;
        }

        /* Modal Styles */
        .ed-settings-modal .ant-modal-content {
          border-radius: 20px;
          padding: 28px 28px 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14);
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }
        .ed-smodal-header {
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .ed-smodal-kicker {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .ed-smodal-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.65rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .ed-smodal-sub {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .ed-smodal-form .ant-form-item-label > label {
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
        }
        .ed-smodal-input.ant-input-affix-wrapper,
        .ed-smodal-input.ant-input {
          height: 44px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          font-size: 14px;
          padding: 0 14px;
        }
        .ed-smodal-input.ant-input-affix-wrapper:hover,
        .ed-smodal-input.ant-input-affix-wrapper-focused {
          background: #ffffff;
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
        }
        .ed-smodal-input .ant-input {
          background: transparent !important;
        }
        .ed-smodal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }
        .ed-smodal-btn-primary {
          height: 40px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .ed-smodal-btn-secondary {
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default Settings;
