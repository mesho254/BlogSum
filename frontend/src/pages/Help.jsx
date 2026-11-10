import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Collapse, Select, message } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleFilled,
  QuestionCircleOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import Navbar from '../components/NavBar';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';

const HELP_GUIDES = [
  {
    icon: <EditOutlined />,
    title: 'Publishing & Scheduling',
    desc: 'Add up to 5 gallery images, preview and edit inline, tag your story, or schedule a future publish date.',
  },
  {
    icon: <BookOutlined />,
    title: 'Reading, Audio & Bookmarks',
    desc: 'Listen to any article with built-in audio synthesis, save essays to your personal library, and filter by category or #tag.',
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Account & Security',
    desc: 'Manage your author profile, update your password with live strength validation, and customize reading preferences.',
  },
];

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'How does scheduled publishing work on BlogSum?',
    children:
      'When creating or editing a story, choose the "Schedule" mode and select a future date and time. Your story will appear under the "Scheduled" tab on your profile as "Not Yet Published" and will automatically go live on the public feed when the scheduled time arrives.',
  },
  {
    key: '2',
    label: 'How many images can I upload per story?',
    children:
      'You can upload up to 5 images per story. The first image serves as the cover on the main blog feed, while all uploaded photos are displayed in an interactive slider on the article reading page.',
  },
  {
    key: '3',
    label: 'How are profile Likes calculated?',
    children:
      'Your profile Likes count reflects the total number of likes your own published stories have received from readers across the community (including your own like if you liked your post).',
  },
  {
    key: '4',
    label: 'How do I reset or change my password?',
    children:
      'You can update your password anytime from Settings → Password & Security, or click "Forgot password?" on the Sign In page to receive a secure password reset link via email.',
  },
  {
    key: '5',
    label: 'How can I get a Verified Writer badge or have my story featured?',
    children:
      'Our editorial administrators review original essays daily to award Verified Writer badges and curate standout pieces as Editor’s Picks.',
  },
];

function Help() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [contactForm, setContactForm] = useState({
    name: user?.username || '',
    email: user?.email || '',
    category: 'General Support',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setContactForm((prev) => ({
        ...prev,
        name: prev.name || user.username || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (location.hash === '#contact' || location.pathname === '/contactus') {
      const el = document.getElementById('contact');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [location.hash, location.pathname]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      message.warning('Please fill in your name, email address, and message.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/api/subscribe/contact', contactForm);
      setSubmitted(true);
      message.success('Your message has been sent! Check your email for confirmation.');
      setContactForm((prev) => ({ ...prev, subject: '', message: '' }));
    } catch (error) {
      message.error(
        error?.response?.data?.message || 'Could not send message right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ed-help-page">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-help-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-top: 96px;
          padding-bottom: 80px;
        }

        .ed-help-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-help-container {
            max-width: 1440px;
          }
        }
        @media (min-width: 1920px) {
          .ed-help-container {
            max-width: 1600px;
          }
        }

        .ed-help-hero {
          background: #0f172a;
          color: #ffffff;
          border-radius: 24px;
          padding: 52px 44px;
          margin-bottom: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }

        .ed-help-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.73rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.16);
          border: 1px solid rgba(99, 102, 241, 0.35);
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .ed-help-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2rem, 3.8vw, 2.85rem);
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 10px 0;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .ed-help-sub {
          font-size: 0.96rem;
          color: #94a3b8;
          margin: 0;
          max-width: 580px;
          line-height: 1.65;
        }

        .ed-help-guides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 44px;
        }

        .ed-help-guide-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
        }

        .ed-help-guide-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f1f5f9;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-bottom: 14px;
        }

        .ed-help-section-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .ed-help-faq-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 48px;
        }

        /* Contact Us Grid inside Help Center */
        .ed-help-contact-grid {
          display: grid;
          grid-template-columns: 0.95fr 1.35fr;
          gap: 28px;
          scroll-margin-top: 100px;
        }

        .ed-help-contact-info {
          background: #0f172a;
          color: #f8fafc;
          border-radius: 22px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .ed-help-contact-form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 36px 34px;
          box-shadow: 0 10px 30px -15px rgba(15, 23, 42, 0.05);
        }

        .ed-help-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .ed-help-input,
        .ed-help-textarea {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: all 0.16s ease;
          box-sizing: border-box;
        }

        .ed-help-input:focus,
        .ed-help-textarea:focus {
          background: #ffffff;
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06);
        }

        .ed-help-submit-btn {
          height: 44px;
          padding: 0 24px;
          border-radius: 10px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .ed-help-submit-btn:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .ed-help-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 860px) {
          .ed-help-hero {
            padding: 36px 24px;
          }
          .ed-help-contact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ed-help-container">
        {/* Hero Header */}
        <section className="ed-help-hero">
          <div>
            <div className="ed-help-kicker">
              <QuestionCircleOutlined />
              <span>Help &amp; Support Center</span>
            </div>
            <h1 className="ed-help-title">How can we help you today?</h1>
            <p className="ed-help-sub">
              Browse quick answers on publishing, scheduling, and account management—or send a
              direct message to our editorial support desk below.
            </p>
          </div>
          <a
            href="#contact"
            style={{
              height: 44,
              padding: '0 22px',
              borderRadius: 999,
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <MailOutlined />
            <span>Contact Us Directly</span>
          </a>
        </section>

        {/* Quick Topic Guides */}
        <section className="ed-help-guides-grid">
          {HELP_GUIDES.map((g) => (
            <div key={g.title} className="ed-help-guide-card">
              <div className="ed-help-guide-icon">{g.icon}</div>
              <h3
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: '1.22rem',
                  fontWeight: 600,
                  margin: '0 0 8px 0',
                }}
              >
                {g.title}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {g.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Frequently Asked Questions */}
        <section className="ed-help-faq-box">
          <div style={{ marginBottom: 20 }}>
            <h2 className="ed-help-section-title">Frequently Asked Questions</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Everything you need to know about writing and reading on BlogSum.
            </p>
          </div>
          <Collapse accordion bordered={false} items={FAQ_ITEMS} style={{ background: '#fff' }} />
        </section>

        {/* Integrated Contact Us Section */}
        <section id="contact" className="ed-help-contact-grid">
          {/* Left: Support Channels */}
          <div className="ed-help-contact-info">
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#818cf8',
                }}
              >
                DIRECT CONTACT CHANNELS
              </span>
              <h2
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: '2rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: '10px 0 12px 0',
                }}
              >
                Get in touch with our team.
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 28 }}>
                Whether you have a technical question, editorial pitch, or account inquiry, our team
                responds within 24 hours.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <MailOutlined style={{ fontSize: 18, color: '#818cf8', marginTop: 3 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      Editorial &amp; Support Email
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>support@blogsum.com</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <PhoneOutlined style={{ fontSize: 18, color: '#818cf8', marginTop: 3 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      Direct Support Line
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>+254 700 000 000</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <EnvironmentOutlined style={{ fontSize: 18, color: '#818cf8', marginTop: 3 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      Newsroom &amp; Studio
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                      Nairobi, Kenya · Global Remote Desk
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <ClockCircleOutlined style={{ fontSize: 18, color: '#818cf8', marginTop: 3 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      Support Hours
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                      Monday – Friday, 8:00 AM – 6:00 PM (EAT)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.8rem',
                color: '#94a3b8',
              }}
            >
              We also send an automated confirmation copy of your message directly to your email
              inbox.
            </div>
          </div>

          {/* Right: Interactive Contact Us Form */}
          <div className="ed-help-contact-form-card">
            <h3
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: '1.65rem',
                fontWeight: 600,
                margin: '0 0 6px 0',
                color: '#0f172a',
              }}
            >
              Send Us a Message
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.88rem' }}>
              Fill out the form below and we&apos;ll email you a confirmation receipt right away.
            </p>

            {submitted && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                <span>
                  <CheckCircleFilled style={{ marginRight: 8, color: '#10b981' }} />
                  Your message has been delivered to our team!
                </span>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#047857',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Send another
                </button>
              </div>
            )}

            <form onSubmit={handleContactSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label className="ed-help-label">Your Name</label>
                  <input
                    type="text"
                    className="ed-help-input"
                    required
                    placeholder="e.g., Alex Mercer"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="ed-help-label">Your Email Address</label>
                  <input
                    type="email"
                    className="ed-help-input"
                    required
                    placeholder="you@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.9fr 1.3fr',
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label className="ed-help-label">Topic</label>
                  <Select
                    style={{ width: '100%', height: 42 }}
                    value={contactForm.category}
                    onChange={(val) => setContactForm((f) => ({ ...f, category: val }))}
                    options={[
                      { value: 'General Support', label: 'General Support' },
                      { value: 'Publishing & Scheduling', label: 'Publishing & Scheduling' },
                      { value: 'Account & Verification', label: 'Account & Verification' },
                      { value: 'Editorial Pitch', label: 'Editorial Pitch' },
                      { value: 'Bug Report', label: 'Bug Report' },
                    ]}
                  />
                </div>
                <div>
                  <label className="ed-help-label">Subject</label>
                  <input
                    type="text"
                    className="ed-help-input"
                    required
                    placeholder="How can we help?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="ed-help-label">Message</label>
                <textarea
                  rows={5}
                  className="ed-help-textarea"
                  required
                  placeholder="Describe your question, feedback, or support request in detail..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>

              <button type="submit" className="ed-help-submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingOutlined />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <SendOutlined />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Help;
