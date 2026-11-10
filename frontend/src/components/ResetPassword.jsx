import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Input, Alert, Spin, notification } from 'antd';
import {
  LockOutlined,
  LoadingOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import Navbar from './NavBar';

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  {
    key: 'case',
    label: 'Uppercase & lowercase letters (A-Z, a-z)',
    test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  },
  { key: 'number', label: 'At least one number (0-9)', test: (pw) => /\d/.test(pw) },
  {
    key: 'special',
    label: 'At least one special character (!@#$...)',
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

const PasswordReset = () => {
  const [validUrl, setValidUrl] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const param = useParams();
  const url = `/api/auth/password-reset/${param.id}/${param.token}`;

  useEffect(() => {
    const verifyUrl = async () => {
      try {
        await axiosInstance.get(url);
        setValidUrl(true);
      } catch {
        setValidUrl(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyUrl();
  }, [url]);

  const ruleStatuses = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );
  const passedCount = ruleStatuses.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;
  const passwordsMatch =
    Boolean(password) && Boolean(confirmPassword) && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(url, { password });
      setMsg(data.message);
      setError('');
      setIsLoading(false);
      notification.success({ message: data.message });
      window.location = '/login';
    } catch (err) {
      setIsLoading(false);
      const messageText = err.response?.data?.message || 'Unable to reset password.';
      setError(messageText);
      setMsg('');
      notification.error({ message: messageText });
    }
  };

  return (
    <div className="ed-auth-page">
      <Navbar />

      <main className="ed-auth-container">
        <div className="ed-auth-card">
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: '#111827' }} spin />} />
              <p style={{ marginTop: 14, color: '#6b7280', fontSize: 13.5 }}>
                Verifying reset link...
              </p>
            </div>
          ) : validUrl ? (
            <>
              <div className="ed-auth-header">
                <span className="ed-auth-kicker">Security & Access</span>
                <h1 className="ed-auth-title">Set a new password</h1>
                <p className="ed-auth-subtitle">
                  Choose a strong new password for your BlogSum account.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label className="ed-reset-label">New Password</label>
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="ed-auth-input"
                  />
                </div>

                {password.length > 0 && (
                  <div className="ed-pw-validator">
                    <ul className="ed-pw-rules">
                      {ruleStatuses.map((rule) => (
                        <li
                          key={rule.key}
                          className={`ed-pw-rule ${rule.passed ? 'is-passed' : ''}`}
                        >
                          {rule.passed ? (
                            <CheckCircleFilled className="ed-pw-rule__icon is-passed" />
                          ) : (
                            <span className="ed-pw-rule__dot" />
                          )}
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginBottom: 18 }}>
                  <div className="ed-confirm-label-row" style={{ marginBottom: 8 }}>
                    <label className="ed-reset-label" style={{ marginBottom: 0 }}>
                      Confirm Password
                    </label>
                    {confirmPassword.length > 0 && (
                      <span
                        className={`ed-confirm-status ${
                          passwordsMatch ? 'is-match' : 'is-mismatch'
                        }`}
                      >
                        {passwordsMatch ? (
                          <>
                            <CheckCircleFilled /> Passwords match
                          </>
                        ) : (
                          <>
                            <CloseCircleFilled /> Does not match
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    className="ed-auth-input"
                  />
                </div>

                {error && (
                  <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
                )}
                {msg && (
                  <Alert message={msg} type="success" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
                )}

                <button
                  type="submit"
                  disabled={isLoading || !allRulesPassed || !passwordsMatch}
                  className="ed-auth-submit-btn"
                >
                  <span>{isLoading ? 'Updating password...' : 'Update Password'}</span>
                  {!isLoading && <ArrowRightOutlined style={{ fontSize: 13 }} />}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h2 className="ed-auth-title" style={{ fontSize: '1.65rem' }}>
                Reset link expired
              </h2>
              <p className="ed-auth-subtitle" style={{ marginBottom: 22 }}>
                This password reset link is invalid or has already been used.
              </p>
              <Link to="/forgotPassword" className="ed-auth-switch-link">
                Request a new reset link →
              </Link>
            </div>
          )}

          <div className="ed-auth-footer">
            <Link
              to="/login"
              className="ed-auth-switch-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
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
          max-width: 460px;
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
        .ed-reset-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .ed-confirm-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .ed-confirm-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 600;
        }
        .ed-confirm-status.is-match {
          color: #059669;
        }
        .ed-confirm-status.is-mismatch {
          color: #dc2626;
        }
        .ed-pw-validator {
          margin: 0 0 14px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .ed-pw-rules {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ed-pw-rule {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .ed-pw-rule.is-passed {
          color: #111827;
          font-weight: 600;
        }
        .ed-pw-rule__icon.is-passed {
          color: #10b981;
          font-size: 13px;
        }
        .ed-pw-rule__dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 1.5px solid #cbd5e1;
          display: inline-block;
        }
        .ed-auth-input.ant-input-affix-wrapper,
        .ed-auth-input.ant-input {
          height: 46px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          font-size: 14px;
          padding: 0 14px;
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
        .ed-auth-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

export default PasswordReset;
