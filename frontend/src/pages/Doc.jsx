import React from 'react';
import Navbar from '../components/NavBar';
import { BookOutlined, ArrowRightOutlined, CodeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const DOC_SECTIONS = [
  {
    title: '1. Publishing Studio & Formatting',
    content: (
      <>
        <p>
          BlogSum provides an editorial workspace for writers. When composing or editing a story:
        </p>
        <ul>
          <li><strong>Rich Editor:</strong> Bold, italic, headers (H1/H2), bullet lists, blockquotes, and inline code formatting.</li>
          <li><strong>Multi-Photo Gallery:</strong> Upload up to 5 photos. The first image serves as the card cover, and the remaining photos appear in the reading carousel.</li>
          <li><strong>Live Preview:</strong> Toggle or view side-by-side to review exact reader rendering and make inline edits.</li>
          <li><strong>Topics &amp; Tags:</strong> Select from 15 categories and add up to 10 #tags for community discovery.</li>
        </ul>
      </>
    ),
  },
  {
    title: '2. Scheduled Releases & Automated Publishing',
    content: (
      <>
        <p>
          You don&apos;t have to publish immediately. BlogSum incorporates a background cron runner:
        </p>
        <ul>
          <li><strong>Scheduled Status:</strong> Set your story&apos;s publish date/time into the future. The story will stay in your private profile queue marked &quot;Not Yet Published&quot;.</li>
          <li><strong>Automated Publishing:</strong> Every 30 seconds, our cron runner inspects due stories and flips them to <code>published</code> in MongoDB.</li>
          <li><strong>Real-Time Notifications:</strong> Followers receive an in-app notification when the story becomes public.</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Reader Engagement & Social Proof',
    content: (
      <>
        <p>
          BlogSum connects readers and writers with meaningful interaction tools:
        </p>
        <ul>
          <li><strong>Reactions:</strong> Choose from 6 nuanced reactions (Love, Like, Celebrate, Insightful, Support, Funny).</li>
          <li><strong>Audio Read-Aloud:</strong> Built-in web speech synthesis lets readers listen to any article hands-free.</li>
          <li><strong>Threaded Discussions:</strong> Leave comments, reply directly to readers, and like comments.</li>
          <li><strong>Personal Library:</strong> Bookmark stories to your reading list.</li>
        </ul>
      </>
    ),
  },
  {
    title: '4. REST API & Architecture Overview',
    content: (
      <>
        <p>
          BlogSum is built on Node.js, Express, MongoDB Atlas, and React. Key API endpoints:
        </p>
        <div style={{ background: '#0f172a', color: '#f8fafc', padding: '16px 20px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.86rem', lineHeight: 1.7, overflowX: 'auto' }}>
          <div>GET &nbsp;&nbsp;/api/blogs &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&middot; Public published stories feed (in-memory cached)</div>
          <div>GET &nbsp;&nbsp;/api/blogs/:id &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&middot; Story details with comments and author profile</div>
          <div>POST &nbsp;/api/blogs &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&middot; Create new story (supports multipart/form-data)</div>
          <div>PUT &nbsp;&nbsp;/api/blogs/:id &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&middot; Update story (author or admin override)</div>
          <div>POST &nbsp;/api/subscribe/subscribe &middot; Newsletter subscription &amp; welcome dispatch</div>
          <div>POST &nbsp;/api/subscribe/contact &nbsp;&nbsp;&middot; Support inquiry submission with receipt email</div>
        </div>
      </>
    ),
  },
];

function Doc() {
  const navigate = useNavigate();

  return (
    <div className="ed-doc-page">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-doc-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-top: 96px;
          padding-bottom: 80px;
        }

        .ed-doc-container {
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px;
          transition: max-width 0.2s ease;
        }
        @media (min-width: 1536px) {
          .ed-doc-container {
            max-width: 1320px;
            width: 94%;
          }
        }
        @media (min-width: 1920px) {
          .ed-doc-container {
            max-width: 1540px;
            width: 95%;
          }
        }

        .ed-doc-hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 44px 36px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px -8px rgba(15, 23, 42, 0.04);
        }

        .ed-doc-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #4f46e5;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .ed-doc-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 10px 0;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .ed-doc-sub {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }

        .ed-doc-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          margin-bottom: 24px;
          line-height: 1.75;
          color: #334155;
          font-size: 0.94rem;
        }

        .ed-doc-sec-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 14px 0;
        }

        .ed-doc-card ul {
          padding-left: 20px;
          margin: 12px 0 16px;
        }

        .ed-doc-card li {
          margin-bottom: 8px;
        }
      `}</style>

      <div className="ed-doc-container">
        <header className="ed-doc-hero">
          <div className="ed-doc-kicker">
            <BookOutlined />
            <span>Platform Guides &middot; Documentation</span>
          </div>
          <h1 className="ed-doc-title">BlogSum Documentation</h1>
          <p className="ed-doc-sub">
            A comprehensive reference for publishing, scheduled release queues, audio reading, and API architecture.
          </p>
        </header>

        {DOC_SECTIONS.map((sec) => (
          <article key={sec.title} className="ed-doc-card">
            <h2 className="ed-doc-sec-title">{sec.title}</h2>
            {sec.content}
          </article>
        ))}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
          <button
            type="button"
            onClick={() => navigate('/createBlog')}
            style={{
              height: 44,
              padding: '0 24px',
              borderRadius: 999,
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <span>Open Publishing Studio</span>
            <ArrowRightOutlined style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Doc;
