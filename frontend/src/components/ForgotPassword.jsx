import React, { useState } from 'react';
import { Form, Input, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import Navbar from './NavBar';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      message.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post('/api/auth/forgot-password1', { email });
      setEmail('');
      message.success(data.message || 'Password reset link sent to your email.');
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Unable to send reset link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ed-auth-page">
      <Navbar />

      <main className="ed-auth-container">
        <div className="ed-auth-card">
          <div className="ed-auth-header">
            <span className="ed-auth-kicker">Account Recovery</span>
            <h1 className="ed-auth-title">Reset your password</h1>
            <p className="ed-auth-subtitle">
              Enter the email address associated with your account and we&apos;ll send you a password reset link.
            </p>
          </div>

          <Form
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            className="ed-auth-form"
          >
            <Form.Item
              label="Email Address"
              required
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<MailOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="you@example.com"
                className="ed-auth-input"
              />
            </Form.Item>

            <button
              type="submit"
              disabled={isLoading}
              className="ed-auth-submit-btn"
            >
              <span>{isLoading ? 'Sending reset link...' : 'Send Reset Link'}</span>
              {!isLoading && <ArrowRightOutlined style={{ fontSize: 13 }} />}
            </button>
          </Form>

          <div className="ed-auth-footer">
            <Link to="/login" className="ed-auth-switch-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeftOutlined style={{ fontSize: 11 }} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-auth-page {
          min-height: 100vh;
          background: #f9fafb;
          color: #111827;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
        }
        .ed-auth-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 20px 64px;
        }
        .ed-auth-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 36px 34px 30px;
          box-shadow: 0 20px 48px -16px rgba(15, 23, 42, 0.08);
        }
        .ed-auth-header {
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid #f3f4f6;
        }
        .ed-auth-kicker {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .ed-auth-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 2.05rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 8px;
          letter-spacing: -0.025em;
          line-height: 1.12;
        }
        .ed-auth-subtitle {
          font-size: 13.5px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .ed-auth-form .ant-form-item-label > label {
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
        }
        .ed-auth-input.ant-input-affix-wrapper,
        .ed-auth-input.ant-input {
          height: 46px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          font-size: 14px;
          padding: 0 14px;
          transition: all 0.15s ease;
        }
        .ed-auth-input.ant-input-affix-wrapper:hover,
        .ed-auth-input.ant-input-affix-wrapper-focused {
          background: #ffffff;
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
        }
        .ed-auth-input .ant-input {
          background: transparent !important;
          font-size: 14px;
        }
        .ed-auth-submit-btn {
          width: 100%;
          height: 46px;
          margin-top: 6px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ed-auth-submit-btn:hover:not(:disabled) {
          background: #1f2937;
          transform: translateY(-1px);
        }
        .ed-auth-footer {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13.5px;
        }
        .ed-auth-switch-link {
          color: #111827;
          font-weight: 600;
          text-decoration: none;
        }
        .ed-auth-switch-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
