import React, { useState, useEffect } from 'react';
import {
  Switch,
  Modal,
  Form,
  Input,
  Avatar,
  Select,
  message,
  notification,
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
  const { user } = useAuth();
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
                    <span className="ed-settings-row__label">Two-Factor Verification</span>
                    <span className="ed-settings-row__sub">
                      Add an extra layer of verification when signing in from a new device.
                    </span>
                  </div>
                  <Switch
                    checked={prefs.twoFactorAuth}
                    onChange={(v) => updatePref('twoFactorAuth', v)}
                  />
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
