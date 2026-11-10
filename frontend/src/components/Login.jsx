import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, notification } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import useAuth from '../hooks/useAuth';
import Navbar from './NavBar';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      await login(email, password);
      notification.success({
        message: 'Welcome back',
        description: 'You have signed in to BlogSum.',
      });
      navigate('/');
    } catch (error) {
      notification.error({
        message: 'Sign in failed',
        description:
          error.response?.data?.message || 'Invalid email or password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ed-auth-page">
      <Navbar />

      <main className="ed-auth-container">
        <div className="ed-auth-card">
          <div className="ed-auth-header">
            <span className="ed-auth-kicker">BlogSum Editorial</span>
            <h1 className="ed-auth-title">Welcome back</h1>
            <p className="ed-auth-subtitle">
              Sign in with your email and password to publish, bookmark, and join discussions.
            </p>
          </div>

          <Form
            layout="vertical"
            onFinish={submitHandler}
            requiredMark={false}
            className="ed-auth-form"
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="you@example.com"
                autoComplete="email"
                className="ed-auth-input"
              />
            </Form.Item>

            <div className="ed-auth-label-row">
              <span className="ed-auth-field-label">Password</span>
              <Link to="/forgotPassword" className="ed-auth-forgot-link">
                Forgot password?
              </Link>
            </div>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="ed-auth-input"
              />
            </Form.Item>

            <button
              type="submit"
              disabled={loading}
              className="ed-auth-submit-btn"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRightOutlined style={{ fontSize: 13 }} />}
            </button>
          </Form>

          <div className="ed-auth-footer">
            <span>New to BlogSum?</span>
            <Link to="/register" className="ed-auth-switch-link">
              Create an account →
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
          margin-bottom: 26px;
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
          font-size: 2.15rem;
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
        .ed-auth-form .ant-form-item {
          margin-bottom: 18px;
        }
        .ed-auth-form .ant-form-item-label > label {
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
        }
        .ed-auth-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .ed-auth-field-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
        }
        .ed-auth-forgot-link {
          font-size: 12.5px;
          font-weight: 600;
          color: #4b5563;
          text-decoration: none;
        }
        .ed-auth-forgot-link:hover {
          color: #111827;
          text-decoration: underline;
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
        .ed-auth-input.ant-input-affix-wrapper-focused,
        .ed-auth-input.ant-input:focus {
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
        .ed-auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ed-auth-footer {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13.5px;
          color: #6b7280;
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

export default Login;
