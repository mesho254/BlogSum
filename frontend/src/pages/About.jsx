import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  EditOutlined,
  BookOutlined,
  ClockCircleOutlined,
  SoundOutlined,
  TeamOutlined,
  CheckCircleFilled,
  CompassOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import Navbar from '../components/NavBar';

const PILLARS = [
  {
    icon: <EditOutlined />,
    title: 'Distraction-Free Publishing Studio',
    description:
      'Write with live side-by-side preview, direct inline editing, multi-image galleries (up to 5 photos), custom topic tags, and automatic read-time estimation.',
  },
  {
    icon: <ClockCircleOutlined />,
    title: 'Scheduled Editorial Releases',
    description:
      'Draft essays ahead of time and schedule exact publication dates. Your queued stories remain private on your profile until our automated publisher makes them live.',
  },
  {
    icon: <SoundOutlined />,
    title: 'Audio Read-Aloud & Clean Typography',
    description:
      'Every article is typeset for effortless long-form reading and includes built-in voice synthesis so readers can listen on the go.',
  },
  {
    icon: <TeamOutlined />,
    title: 'Thoughtful Reader Engagement',
    description:
      'Connect with authors through nuanced reactions, threaded discussions, personal reading bookmarks, and real-time community channels.',
  },
  {
    icon: <CompassOutlined />,
    title: '15 Curated Editorial Verticals',
    description:
      'Explore perspectives spanning Technology, Design, Science, Finance, Business, Culture, Health, Education, Travel, and more.',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Editor’s Picks & Verified Voices',
    description:
      'Our editorial team highlights standout essays and awards Verified Writer badges to trusted contributors in the community.',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Draft & Refine in Live Preview',
    body: 'Compose your story in the BlogSum Studio with rich formatting, cover galleries, and instant preview editing.',
  },
  {
    step: '02',
    title: 'Publish Immediately or Schedule',
    body: 'Release your essay right away or pick a future date and time—our background scheduler publishes and notifies followers automatically.',
  },
  {
    step: '03',
    title: 'Build Your Readership',
    body: 'Readers discover your work via category feeds, #tags, Editor’s Picks, and The Weekly Dispatch newsletter.',
  },
];

function About() {
  const navigate = useNavigate();

  return (
    <div className="ed-about-page">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-about-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-top: 96px;
          padding-bottom: 80px;
        }

        .ed-about-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-about-container {
            max-width: 1440px;
          }
        }
        @media (min-width: 1920px) {
          .ed-about-container {
            max-width: 1600px;
          }
        }

        /* Editorial Hero Section */
        .ed-about-hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 64px 48px;
          margin-bottom: 40px;
          box-shadow: 0 12px 32px -16px rgba(15, 23, 42, 0.05);
          position: relative;
          overflow: hidden;
        }

        .ed-about-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #4f46e5;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          padding: 5px 13px;
          border-radius: 999px;
          margin-bottom: 20px;
        }

        .ed-about-headline {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2.25rem, 4.5vw, 3.6rem);
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin: 0 0 22px 0;
          max-width: 820px;
        }

        .ed-about-lead {
          font-size: clamp(1.02rem, 1.5vw, 1.18rem);
          line-height: 1.75;
          color: #475569;
          margin: 0 0 32px 0;
          max-width: 720px;
        }

        .ed-about-cta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ed-about-btn-primary {
          height: 46px;
          padding: 0 24px;
          border-radius: 999px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ed-about-btn-primary:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .ed-about-btn-secondary {
          height: 46px;
          padding: 0 22px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ed-about-btn-secondary:hover {
          background: #f8fafc;
          border-color: #0f172a;
        }

        /* Editorial Manifesto Split */
        .ed-about-manifesto {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 48px;
          background: #0f172a;
          color: #f8fafc;
          border-radius: 24px;
          padding: 52px 48px;
          margin-bottom: 40px;
        }

        .ed-about-manifesto-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.4rem);
          font-weight: 600;
          line-height: 1.2;
          margin: 10px 0 18px 0;
          color: #ffffff;
        }

        .ed-about-manifesto-p {
          font-size: 0.96rem;
          line-height: 1.8;
          color: #cbd5e1;
          margin: 0 0 16px 0;
        }

        .ed-about-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .ed-about-stat-num {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 2rem;
          font-weight: 600;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 4px;
        }

        .ed-about-stat-label {
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Section Header */
        .ed-about-sec-head {
          margin-bottom: 28px;
        }

        .ed-about-sec-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(1.65rem, 2.5vw, 2.15rem);
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .ed-about-sec-sub {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }

        /* Pillars Grid */
        .ed-about-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .ed-about-pillar-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 26px;
          transition: all 0.2s ease;
        }

        .ed-about-pillar-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.08);
        }

        .ed-about-pillar-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-bottom: 16px;
        }

        .ed-about-pillar-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .ed-about-pillar-desc {
          font-size: 0.9rem;
          line-height: 1.65;
          color: #64748b;
          margin: 0;
        }

        /* Workflow Steps */
        .ed-about-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .ed-about-step-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 28px;
        }

        .ed-about-step-num {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.8rem;
          font-weight: 600;
          color: #4f46e5;
          margin-bottom: 10px;
        }

        /* Bottom Banner */
        .ed-about-bottom-cta {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 40px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        @media (max-width: 860px) {
          .ed-about-hero,
          .ed-about-manifesto {
            padding: 36px 24px;
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ed-about-container">
        {/* Hero */}
        <section className="ed-about-hero">
          <div className="ed-about-kicker">
            <BookOutlined />
            <span>The Publication Manifesto</span>
          </div>
          <h1 className="ed-about-headline">
            Where thoughtful essays, technical depth, and independent voices meet.
          </h1>
          <p className="ed-about-lead">
            BlogSum is a modern publishing platform built for writers who care about craft and
            readers who value substance over noise. From engineering deep-dives to cultural essays,
            we give every idea a clean, distraction-free home.
          </p>
          <div className="ed-about-cta-row">
            <button
              type="button"
              className="ed-about-btn-primary"
              onClick={() => navigate('/')}
            >
              <span>Explore Stories</span>
              <ArrowRightOutlined style={{ fontSize: 13 }} />
            </button>
            <button
              type="button"
              className="ed-about-btn-secondary"
              onClick={() => navigate('/createBlog')}
            >
              <EditOutlined />
              <span>Write a Story</span>
            </button>
            <button
              type="button"
              className="ed-about-btn-secondary"
              onClick={() => navigate('/help')}
            >
              <span>Help &amp; Contact</span>
            </button>
          </div>
        </section>

        {/* Editorial Mission & Standards */}
        <section className="ed-about-manifesto">
          <div>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#818cf8',
              }}
            >
              OUR EDITORIAL PHILOSOPHY
            </span>
            <h2 className="ed-about-manifesto-title">
              Built for signal in an era of endless feeds.
            </h2>
            <div className="ed-about-stats-row">
              <div>
                <div className="ed-about-stat-num">15+</div>
                <div className="ed-about-stat-label">Editorial Categories</div>
              </div>
              <div>
                <div className="ed-about-stat-num">5x</div>
                <div className="ed-about-stat-label">Gallery Photos / Story</div>
              </div>
              <div>
                <div className="ed-about-stat-num">24/7</div>
                <div className="ed-about-stat-label">Scheduled Publishing</div>
              </div>
            </div>
          </div>

          <div>
            <p className="ed-about-manifesto-p">
              Most platforms optimize for fleeting clicks and cluttered feeds. BlogSum was designed
              around a simple conviction: great writing deserves calm typography, expressive visual
              storytelling, and genuine connection between author and reader.
            </p>
            <p className="ed-about-manifesto-p" style={{ marginBottom: 0 }}>
              Whether you are publishing a technical post-mortem, a design critique, or a personal
              travel essay, our studio gives you live preview editing, multi-photo carousels,
              scheduled release automation, and direct community dialogue.
            </p>
          </div>
        </section>

        {/* Platform Capabilities */}
        <div className="ed-about-sec-head">
          <h2 className="ed-about-sec-title">Crafted for Writers &amp; Readers</h2>
          <p className="ed-about-sec-sub">
            Everything needed to compose, schedule, curate, and discuss long-form stories.
          </p>
        </div>

        <section className="ed-about-pillars-grid">
          {PILLARS.map((item) => (
            <div key={item.title} className="ed-about-pillar-card">
              <div className="ed-about-pillar-icon">{item.icon}</div>
              <h3 className="ed-about-pillar-title">{item.title}</h3>
              <p className="ed-about-pillar-desc">{item.description}</p>
            </div>
          ))}
        </section>

        {/* How Publishing Works */}
        <div className="ed-about-sec-head">
          <h2 className="ed-about-sec-title">How BlogSum Works</h2>
          <p className="ed-about-sec-sub">
            From first draft to your readers&apos; inbox in three steps.
          </p>
        </div>

        <section className="ed-about-steps-grid">
          {WORKFLOW_STEPS.map((s) => (
            <div key={s.step} className="ed-about-step-card">
              <div className="ed-about-step-num">{s.step}</div>
              <h3 className="ed-about-pillar-title">{s.title}</h3>
              <p className="ed-about-pillar-desc">{s.body}</p>
            </div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="ed-about-bottom-cta">
          <div>
            <h3
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: '1.6rem',
                fontWeight: 600,
                margin: '0 0 6px 0',
                color: '#0f172a',
              }}
            >
              Have questions or want to reach our editorial team?
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
              Visit our Help &amp; Contact Center for guides, FAQs, and direct support.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ed-about-btn-secondary"
              onClick={() => navigate('/help#contact')}
            >
              <span>Contact Support</span>
            </button>
            <button
              type="button"
              className="ed-about-btn-primary"
              onClick={() => navigate('/register')}
            >
              <CheckCircleFilled />
              <span>Join BlogSum</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
