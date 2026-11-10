import React from 'react';
import Navbar from '../components/NavBar';
import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';

function PrivacyPolicy() {
  const { data: publicSettings } = useQuery({
    queryKey: ['publicSiteSettings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/admin/public-settings');
      return data;
    },
    staleTime: 60 * 1000,
  });

  const customText = publicSettings?.customPrivacyText?.trim();
  return (
    <div className="ed-policy-page">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-policy-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-top: 96px;
          padding-bottom: 80px;
        }

        .ed-policy-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ed-policy-hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 44px 36px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px -8px rgba(15, 23, 42, 0.04);
        }

        .ed-policy-kicker {
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

        .ed-policy-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 10px 0;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .ed-policy-meta {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .ed-policy-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          margin-bottom: 24px;
          line-height: 1.75;
          color: #334155;
          font-size: 0.94rem;
        }

        .ed-policy-sec-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.35rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .ed-policy-list {
          padding-left: 20px;
          margin: 12px 0;
        }

        .ed-policy-list li {
          margin-bottom: 8px;
        }
      `}</style>

      <div className="ed-policy-container">
        <header className="ed-policy-hero">
          <div className="ed-policy-kicker">
            <LockOutlined />
            <span>Legal &amp; Privacy Standards</span>
          </div>
          <h1 className="ed-policy-title">Privacy Policy</h1>
          <p className="ed-policy-meta">
            Effective Date: November 2026 &middot; BlogSum Editorial Publication
          </p>
        </header>

        <article className="ed-policy-card">
          {customText ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{customText}</div>
          ) : (
            <>
              <h2 className="ed-policy-sec-title">1. Introduction</h2>
              <p>
                BlogSum (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to respecting and protecting the privacy of readers, authors, and contributors. This Privacy Policy details how we handle account credentials, reading telemetry, newsletter communications, and personal data across our digital publication.
              </p>

              <h2 className="ed-policy-sec-title" style={{ marginTop: 28 }}>2. Information We Collect</h2>
              <p>We collect only the minimum information required to deliver a calm, high-signal reading and writing experience:</p>
              <ul className="ed-policy-list">
                <li><strong>Account Profile Data:</strong> Username, email address, profile picture, location, and optional author bio provided during registration or profile updates.</li>
                <li><strong>Editorial Content:</strong> Essays, stories, images, tags, comments, reactions, bookmarks, and scheduled release configurations you create.</li>
                <li><strong>Newsletter Subscriptions:</strong> Email addresses submitted to receive <em>The Weekly Dispatch</em>.</li>
                <li><strong>Platform Telemetry:</strong> Anonymized reading interactions to compute estimated read times and popular essay rankings.</li>
              </ul>

              <h2 className="ed-policy-sec-title" style={{ marginTop: 28 }}>3. How We Use Your Data</h2>
              <ul className="ed-policy-list">
                <li>To publish and display your articles with appropriate author attribution.</li>
                <li>To notify you when users comment on your stories or when authors you follow publish new essays.</li>
                <li>To deliver the Weekly Dispatch newsletter (which you can unsubscribe from at any time).</li>
                <li>To enforce platform safety, prevent automated spam, and investigate security concerns.</li>
              </ul>

              <h2 className="ed-policy-sec-title" style={{ marginTop: 28 }}>4. Data Security &amp; Retention</h2>
              <p>
                Passward hashes are encrypted using industry-standard bcrypt algorithms. All authenticated communication occurs over encrypted HTTPS connections. We never sell, rent, or trade your personal information with third-party advertisers.
              </p>

              <h2 className="ed-policy-sec-title" style={{ marginTop: 28 }}>5. Questions &amp; Inquiries</h2>
              <p>
                If you have questions regarding this policy or wish to request data removal, please visit our <Link to="/help#contact" style={{ color: '#4f46e5', fontWeight: 600 }}>Help &amp; Contact Desk</Link> or email us at <strong>privacy@blogsum.com</strong>.
              </p>
            </>
          )}
        </article>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
