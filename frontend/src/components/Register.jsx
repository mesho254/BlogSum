import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, notification } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import useAuth from '../hooks/useAuth';
import Navbar from './NavBar';

const PASSWORD_RULES = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (pw) => pw.length >= 8,
  },
  {
    key: 'case',
    label: 'Uppercase & lowercase letters (A-Z, a-z)',
    test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  },
  {
    key: 'number',
    label: 'At least one number (0-9)',
    test: (pw) => /\d/.test(pw),
  },
  {
    key: 'special',
    label: 'At least one special character (!@#$...)',
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

const STRENGTH_META = [
  { label: 'Enter password', color: '#e5e7eb' },
  { label: 'Weak', color: '#ef4444' },
  { label: 'Fair', color: '#f59e0b' },
  { label: 'Good', color: '#3b82f6' },
  { label: 'Strong', color: '#10b981' },
];

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const ruleStatuses = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        ...rule,
        passed: rule.test(passwordValue),
      })),
    [passwordValue]
  );

  const passedCount = useMemo(
    () => ruleStatuses.filter((r) => r.passed).length,
    [ruleStatuses]
  );

  const allRulesPassed = passedCount === PASSWORD_RULES.length;
  const passwordsMatch =
    Boolean(passwordValue) &&
    Boolean(confirmValue) &&
    passwordValue === confirmValue;

  const strengthInfo = STRENGTH_META[passedCount] || STRENGTH_META[0];

  const submitHandler = async (values) => {
    setLoading(true);
    try {
      const { username, email, password } = values;
      await register(username, email, password);
      notification.success({
        message: 'Account Created',
        description: 'Your account is ready. Please sign in.',
      });
      navigate('/login');
    } catch (error) {
      notification.error({
        message: 'Registration Failed',
        description:
          error.response?.data?.message || 'Something went wrong. Please try again.',
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
            <span className="ed-auth-kicker">Join the Publication</span>
            <h1 className="ed-auth-title">Create your account</h1>
            <p className="ed-auth-subtitle">
              Start writing essays, building your readership, and bookmarking ideas on BlogSum.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={submitHandler}
            requiredMark={false}
            validateTrigger="onChange"
            className="ed-auth-form"
          >
            <Form.Item
              name="username"
              label="Username / Author Handle"
              rules={[
                { required: true, message: 'Please choose a username' },
                { min: 3, message: 'Username must be at least 3 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="e.g., alexmercer"
                autoComplete="username"
                className="ed-auth-input"
              />
            </Form.Item>

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

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please create a password' },
                {
                  validator(_, value) {
                    const val = value || '';
                    if (!val) return Promise.resolve();
                    const failed = PASSWORD_RULES.filter((r) => !r.test(val));
                    if (failed.length === 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Please meet all password requirements below')
                    );
                  },
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Create a strong password"
                autoComplete="new-password"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChange={(e) => {
                  const next = e.target.value;
                  setPasswordValue(next);
                  if (confirmValue) {
                    form.validateFields(['confirmPassword']);
                  }
                }}
                className="ed-auth-input"
              />
            </Form.Item>

            {/* Live Password Strength Meter & Rules Checklist */}
            {(passwordFocused || passwordValue.length > 0) && (
              <div className="ed-pw-validator">
                <div className="ed-pw-meter-head">
                  <span className="ed-pw-meter-title">Password strength</span>
                  <span
                    className="ed-pw-meter-badge"
                    style={{ color: strengthInfo.color }}
                  >
                    {strengthInfo.label} ({passedCount}/{PASSWORD_RULES.length})
                  </span>
                </div>

                <div className="ed-pw-bars">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="ed-pw-bar"
                      style={{
                        backgroundColor:
                          passedCount >= step ? strengthInfo.color : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>

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

            <Form.Item
              name="confirmPassword"
              label={
                <div className="ed-confirm-label-row">
                  <span>Confirm Password</span>
                  {confirmValue.length > 0 && (
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
              }
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af', marginRight: 6 }} />}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                onChange={(e) => setConfirmValue(e.target.value)}
                className="ed-auth-input"
              />
            </Form.Item>

            <button
              type="submit"
              disabled={loading || (passwordValue.length > 0 && (!allRulesPassed || !passwordsMatch))}
              className="ed-auth-submit-btn"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              {!loading && <ArrowRightOutlined style={{ fontSize: 13 }} />}
            </button>
          </Form>

          <div className="ed-auth-footer">
            <span>Already have an account?</span>
            <Link to="/login" className="ed-auth-switch-link">
              Sign in →
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
          padding: 116px 20px 64px;
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
          margin-bottom: 16px;
        }
        .ed-auth-form .ant-form-item-label > label {
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
          width: 100%;
        }
        .ed-confirm-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 8px;
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
          margin: -4px 0 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .ed-pw-meter-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 11.5px;
        }
        .ed-pw-meter-title {
          color: #6b7280;
          font-weight: 600;
        }
        .ed-pw-meter-badge {
          font-weight: 700;
        }
        .ed-pw-bars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }
        .ed-pw-bar {
          height: 4px;
          border-radius: 999px;
          transition: background-color 0.2s ease;
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
          transition: color 0.15s ease;
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
          flex-shrink: 0;
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

export default Register;
