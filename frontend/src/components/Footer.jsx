import React, { useState } from 'react';
import { message } from 'antd';
import {
  InstagramOutlined,
  TwitterOutlined,
  FacebookOutlined,
  DiscordOutlined,
  TikTokOutlined,
  GithubOutlined,
  LinkedinOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Link as RouterLink } from 'react-router-dom';
import Logo from '../assets/logo.png';
import axiosInstance from '../axiosConfig';
import { useQuery } from '@tanstack/react-query';

function CustomFooter() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const { data: publicSettings } = useQuery({
    queryKey: ['publicSiteSettings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/admin/public-settings');
      return data;
    },
    staleTime: 60 * 1000,
  });

  const socialLinks = publicSettings?.socialLinks || {
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    discord: 'https://discord.com',
    tiktok: 'https://tiktok.com',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      message.warning('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      message.warning('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/api/subscribe/subscribe', { email: trimmed });
      setSubscribed(true);
      setEmail('');
      message.success('Welcome to the BlogSum Dispatch! Check your inbox soon.');
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Could not subscribe right now. Please try again.';
      if (errMsg.toLowerCase().includes('already subscribed')) {
        setSubscribed(true);
        message.info('You are already subscribed to our newsletter.');
      } else {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="ed-site-footer">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-site-footer {
          margin-top: auto;
          flex-shrink: 0;
          width: 100%;
          background: #0f172a;
          color: #f8fafc;
          border-top: 1px solid #1e293b;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          z-index: 10;
        }

        .ed-footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 64px 28px 36px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-footer-inner {
            max-width: 1560px;
          }
        }
        @media (min-width: 1920px) {
          .ed-footer-inner {
            max-width: 1720px;
            width: 95%;
          }
        }

        .ed-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 0.8fr 1.3fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Brand Column */
        .ed-footer-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          margin-bottom: 18px;
        }

        .ed-footer-logo-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          flex-shrink: 0;
        }

        .ed-footer-logo-box img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .ed-footer-brand-name {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.6rem;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #ffffff;
          line-height: 1;
        }

        .ed-footer-brand-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          margin-left: 3px;
        }

        .ed-footer-mission {
          font-size: 0.92rem;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0 0 24px 0;
          max-width: 340px;
        }

        .ed-footer-socials {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ed-footer-social-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #cbd5e1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .ed-footer-social-btn:hover {
          background: #ffffff;
          color: #0f172a;
          border-color: #ffffff;
          transform: translateY(-2px);
        }

        /* Navigation Columns */
        .ed-footer-col-title {
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #f8fafc;
          margin: 0 0 18px 0;
        }

        .ed-footer-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ed-footer-nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.16s ease, transform 0.16s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .ed-footer-nav-link:hover {
          color: #ffffff;
          transform: translateX(2px);
        }

        /* Newsletter Column */
        .ed-footer-dispatch-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 22px;
        }

        .ed-footer-dispatch-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 8px 0;
          letter-spacing: -0.01em;
        }

        .ed-footer-dispatch-desc {
          font-size: 0.86rem;
          color: #94a3b8;
          line-height: 1.55;
          margin: 0 0 16px 0;
        }

        .ed-footer-form {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        .ed-footer-input-wrap {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .ed-footer-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 14px;
          pointer-events: none;
        }

        .ed-footer-input {
          width: 100%;
          height: 42px;
          padding: 0 12px 0 36px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.75);
          color: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.86rem;
          outline: none;
          transition: all 0.18s ease;
          box-sizing: border-box;
        }

        .ed-footer-input::placeholder {
          color: #64748b;
        }

        .ed-footer-input:focus {
          border-color: #6366f1;
          background: #0f172a;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .ed-footer-submit-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 10px;
          border: none;
          background: #ffffff;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }

        .ed-footer-submit-btn:hover:not(:disabled) {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .ed-footer-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .ed-footer-subscribed-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          font-size: 0.84rem;
          font-weight: 600;
        }

        /* Bottom Bar */
        .ed-footer-bottom {
          padding-top: 28px;
          padding-right: 140px; /* Leaves room so the floating Messages widget never overlaps links */
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ed-footer-copy {
          font-size: 0.84rem;
          color: #64748b;
          margin: 0;
        }

        .ed-footer-legal-links {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .ed-footer-legal-link {
          font-size: 0.84rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.16s ease;
        }

        .ed-footer-legal-link:hover {
          color: #ffffff;
        }

        @media (max-width: 1024px) {
          .ed-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
          }
          .ed-footer-bottom {
            padding-right: 0;
          }
        }

        @media (max-width: 640px) {
          .ed-footer-inner {
            padding: 48px 20px 96px; /* Extra bottom space on mobile for floating action button */
          }
          .ed-footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .ed-footer-form {
            flex-direction: column;
          }
          .ed-footer-submit-btn {
            width: 100%;
          }
          .ed-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="ed-footer-inner">
        <div className="ed-footer-grid">
          {/* Column 1: Brand & Mission */}
          <div>
            <RouterLink to="/" className="ed-footer-brand-link">
              <div className="ed-footer-logo-box">
                <img src={Logo} alt="BlogSum Logo" />
              </div>
              <span className="ed-footer-brand-name">
                BlogSum<span className="ed-footer-brand-dot" />
              </span>
            </RouterLink>
            <p className="ed-footer-mission">
              An independent publishing platform for thoughtful essays, technical deep-dives, and cultural perspectives written by creators worldwide.
            </p>
            <div className="ed-footer-socials">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="Instagram"
                >
                  <InstagramOutlined />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="Twitter / X"
                >
                  <TwitterOutlined />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="Facebook"
                >
                  <FacebookOutlined />
                </a>
              )}
              {socialLinks.discord && (
                <a
                  href={socialLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="Discord"
                >
                  <DiscordOutlined />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="TikTok"
                >
                  <TikTokOutlined />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="LinkedIn"
                >
                  <LinkedinOutlined />
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-footer-social-btn"
                  aria-label="GitHub"
                >
                  <GithubOutlined />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Publication */}
          <div>
            <h4 className="ed-footer-col-title">Publication</h4>
            <ul className="ed-footer-nav-list">
              <li>
                <RouterLink to="/" className="ed-footer-nav-link">
                  Stories & Feed
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/createBlog" className="ed-footer-nav-link">
                  Write a Story
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/about" className="ed-footer-nav-link">
                  About Us
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/careers" className="ed-footer-nav-link">
                  Careers
                </RouterLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Support */}
          <div>
            <h4 className="ed-footer-col-title">Support</h4>
            <ul className="ed-footer-nav-list">
              <li>
                <RouterLink to="/help" className="ed-footer-nav-link">
                  Help Center
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/help#contact" className="ed-footer-nav-link">
                  Contact Us
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/doc" className="ed-footer-nav-link">
                  Documentation
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/faq" className="ed-footer-nav-link">
                  FAQs
                </RouterLink>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter Dispatch */}
          <div>
            <div className="ed-footer-dispatch-card">
              <h4 className="ed-footer-dispatch-title">The Weekly Dispatch</h4>
              <p className="ed-footer-dispatch-desc">
                Get curated essays, featured ideas, and community highlights delivered straight to your inbox.
              </p>
              {subscribed ? (
                <div className="ed-footer-subscribed-msg">
                  <CheckCircleFilled />
                  <span>You&apos;re subscribed to the Dispatch!</span>
                </div>
              ) : (
                <form className="ed-footer-form" onSubmit={handleSubscribe}>
                  <div className="ed-footer-input-wrap">
                    <MailOutlined className="ed-footer-input-icon" />
                    <input
                      type="email"
                      className="ed-footer-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="submit"
                    className="ed-footer-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <LoadingOutlined />
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <ArrowRightOutlined style={{ fontSize: '12px' }} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Row */}
        <div className="ed-footer-bottom">
          <p className="ed-footer-copy">
            © {currentYear} BlogSum Publication. All rights reserved.
          </p>
          <div className="ed-footer-legal-links">
            <RouterLink to="/privacypolicy" className="ed-footer-legal-link">
              Privacy Policy
            </RouterLink>
            <RouterLink to="/terms-of-service" className="ed-footer-legal-link">
              Terms of Service
            </RouterLink>
            <RouterLink to="/return" className="ed-footer-legal-link">
              Return Policy
            </RouterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default CustomFooter;
