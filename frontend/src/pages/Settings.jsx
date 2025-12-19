import React, { useState } from 'react';
import { Typography, Row, Col, Card, Divider, Form, Switch, Button, Modal, Input, message } from 'antd';
import Navbar from '../components/NavBar';

const { Title, Paragraph } = Typography;

function Settings() {
  const [form] = Form.useForm();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const showProfileModal = () => {
    setIsProfileModalVisible(true);
  };

  const handleProfileOk = () => {
    form.validateFields().then(values => {
      // Simulate saving profile changes
      message.success('Profile updated successfully!');
      setIsProfileModalVisible(false);
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handleProfileCancel = () => {
    setIsProfileModalVisible(false);
  };

  const showPasswordModal = () => {
    setIsPasswordModalVisible(true);
  };

  const handlePasswordOk = () => {
    form.validateFields().then(values => {
      // Simulate password change
      message.success('Password changed successfully!');
      setIsPasswordModalVisible(false);
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalVisible(false);
  };

  return (
    <>
    <Navbar />
    <div style={{ padding: '20px', maxWidth: '1200px', marginTop: '100px', marginLeft: 'auto', marginRight: 'auto' }}>
      <Row justify="center" style={{ marginBottom: '40px' }}>
        <Col span={24}>
          <Title level={1} style={{ textAlign: 'center' }}>Settings</Title>
          <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
            Customize your BlogSum experience. Manage your account, preferences, notifications, and more.
          </Paragraph>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Account Settings" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="Edit Profile">
                <Button type="primary" onClick={showProfileModal}>
                  Update Profile
                </Button>
              </Form.Item>
              <Form.Item label="Change Password">
                <Button type="primary" onClick={showPasswordModal}>
                  Change Password
                </Button>
              </Form.Item>
              <Form.Item label="Email Address">
                <Input placeholder="your.email@example.com" disabled />
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Appearance Settings" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="Dark Mode">
                <Switch checked={darkMode} onChange={setDarkMode} />
                <Paragraph type="secondary">Enable dark theme for better viewing in low light.</Paragraph>
              </Form.Item>
              <Form.Item label="Font Size">
                <Input placeholder="Default: 16px" />
                <Paragraph type="secondary">Adjust the base font size for readability.</Paragraph>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="Notification Settings" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="Email Notifications">
                <Switch checked={emailNotifications} onChange={setEmailNotifications} />
                <Paragraph type="secondary">Receive emails for new comments, likes, and follows.</Paragraph>
              </Form.Item>
              <Form.Item label="Push Notifications">
                <Switch checked={pushNotifications} onChange={setPushNotifications} />
                <Paragraph type="secondary">Get browser push notifications for real-time updates.</Paragraph>
              </Form.Item>
              <Form.Item label="Notification Frequency">
                <Input placeholder="Daily Digest" />
                <Paragraph type="secondary">Choose how often you receive notifications: Instant, Daily, Weekly.</Paragraph>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Privacy Settings" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="Profile Visibility">
                <Switch defaultChecked />
                <Paragraph type="secondary">Make your profile public or private.</Paragraph>
              </Form.Item>
              <Form.Item label="Data Sharing">
                <Switch />
                <Paragraph type="secondary">Allow sharing of anonymized data for improvements.</Paragraph>
              </Form.Item>
              <Form.Item label="Two-Factor Authentication">
                <Switch defaultChecked />
                <Paragraph type="secondary">Enhance security with 2FA.</Paragraph>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="Content Preferences" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="Preferred Categories">
                <Input placeholder="Travel, Technology, Health" />
                <Paragraph type="secondary">Customize your feed with favorite topics.</Paragraph>
              </Form.Item>
              <Form.Item label="Reading Mode">
                <Switch />
                <Paragraph type="secondary">Enable distraction-free reading mode.</Paragraph>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Advanced Settings" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="API Access">
                <Switch />
                <Paragraph type="secondary">Enable API for integrations (for developers).</Paragraph>
              </Form.Item>
              <Form.Item label="Delete Account">
                <Button type="danger">Delete My Account</Button>
                <Paragraph type="secondary">Permanently delete your account and data.</Paragraph>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal title="Edit Profile" visible={isProfileModalVisible} onOk={handleProfileOk} onCancel={handleProfileCancel}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please input your username!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="avatar" label="Avatar URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Change Password" visible={isPasswordModalVisible} onOk={handlePasswordOk} onCancel={handlePasswordCancel}>
        <Form form={form} layout="vertical">
          <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please input your current password!' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password" rules={[{ required: true, message: 'Please input your new password!' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Confirm New Password" rules={[{ required: true, message: 'Please confirm your new password!' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Divider style={{ marginTop: '40px' }} />

      <Row justify="center" style={{ marginTop: '40px' }}>
        <Col span={24}>
          <Button type="primary" size="large" block onClick={() => message.success('Settings saved!')}>
            Save All Changes
          </Button>
        </Col>
      </Row>
    </div>
    </>
  );
}

export default Settings;