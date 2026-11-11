import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, notification } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import useAuth from '../hooks/useAuth';
import Navbar from './NavBar';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [twoFAData, setTwoFAData] = useState(null);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const { login, verify2FALogin } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      const res = await login(email, password);
      if (res?.requires2FA) {
        setTwoFAData(res);
        setStep('2fa');
        notification.info({
          message: 'Two-Factor Authentication Required',
          description: 'Please enter the 6-digit code from your authenticator app.',
        });
        return;
      }
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

  const submit2FAHandler = async (values) => {
    setLoading(true);
    try {
      const { code } = values;
      const res = await verify2FALogin(twoFAData?.temp2FAToken, code);
      if (res?.usedRecoveryCode) {
        notification.warning({
          message: 'Emergency Recovery Code Used',
          description: `You have ${res.remainingRecoveryCodes} recovery backup code(s) remaining.`,
        });
      }
      notification.success({
        message: 'Welcome back',
        description: 'Two-factor authentication successful.',
      });
      navigate('/');
    } catch (error) {
      notification.error({
        message: '2FA Verification Failed',
        description:
          error.response?.data?.message ||
          'Invalid verification code. Please check your authenticator app or try a recovery code.',
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
          {step === 'credentials' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="ed-auth-header">
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
                    marginBottom: 16,
                  }}
                >
                  <SafetyCertificateOutlined style={{ fontSize: 26, color: '#2563eb' }} />
                </div>
                <h1 className="ed-auth-title">Two-Factor Verification</h1>
                <p className="ed-auth-subtitle">
                  {useRecoveryCode
                    ? `Enter one of your 8-character emergency backup recovery codes for ${twoFAData?.email}.`
                    : `Enter the 6-digit verification code from Google Authenticator, 1Password, or Authy for ${twoFAData?.email}.`}
                </p>
              </div>

              <Form
                layout="vertical"
                onFinish={submit2FAHandler}
                requiredMark={false}
                className="ed-auth-form"
              >
                <Form.Item
                  name="code"
                  label={useRecoveryCode ? 'Emergency Recovery Code' : '6-Digit Authenticator Code'}
                  rules={[
                    {
                      required: true,
                      message: useRecoveryCode
                        ? 'Please enter your recovery backup code'
                        : 'Please enter the 6-digit code',
                    },
                  ]}
                >
                  <Input
                    prefix={
                      useRecoveryCode ? (
                        <KeyOutlined style={{ color: '#9ca3af', marginRight: 6 }} />
                      ) : (
                        <SafetyCertificateOutlined style={{ color: '#9ca3af', marginRight: 6 }} />
                      )
                    }
                    placeholder={useRecoveryCode ? 'e.g. A1B2-C3D4' : '000 000'}
                    maxLength={useRecoveryCode ? 16 : 7}
                    autoFocus
                    style={{
                      letterSpacing: useRecoveryCode ? '0.12em' : '0.25em',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    className="ed-auth-input"
                  />
                </Form.Item>

                <div style={{ textAlign: 'right', marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={() => setUseRecoveryCode((prev) => !prev)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563eb',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {useRecoveryCode
                      ? '← Use 6-Digit Authenticator App Code'
                      : 'Can’t access authenticator? Use Recovery Code'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ed-auth-submit-btn"
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                  {!loading && <ArrowRightOutlined style={{ fontSize: 13 }} />}
                </button>

                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setTwoFAData(null);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeftOutlined style={{ fontSize: 11 }} />
                    Back to email & password
                  </button>
                </div>
              </Form>
            </>
          )}
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
