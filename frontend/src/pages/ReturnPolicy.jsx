import React from 'react';
import Navbar from '../components/NavBar';
import { ShoppingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';

function ReturnPolicy() {
  const { data: publicSettings } = useQuery({
    queryKey: ['publicSiteSettings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/admin/public-settings');
      return data;
    },
    staleTime: 60 * 1000,
  });

  const customText = publicSettings?.customReturnText?.trim();
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
            <ShoppingOutlined />
            <span>Digital Publication Services</span>
          </div>
          <h1 className="ed-policy-title">Return &amp; Refund Policy</h1>
          <p className="ed-policy-meta">
            Effective Date: November 2026 &middot; BlogSum Editorial Publication
          </p>
        </header>

        <article className="ed-policy-card">
          {customText ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{customText}</div>
          ) : (
            <>
              <h2 className="ed-policy-sec-title">1. Digital Publication Model</h2>
              <p>
                BlogSum is a digital reading and writing platform. As an independent online publication, our services are delivered digitally, and open reading across our articles is free to the community.
              </p>

              <h2 className="ed-policy-sec-title" style={{ marginTop: 28 }}>2. Subscriptions &amp; Paid Features</h2>
              <p>
                For any premium tiers or reader sponsorships offered through BlogSum:
              </p>
              <ul className="ed-policy-list">
                <li><strong>14-Day Refund Window:</strong> If you purchase a premium reader membership or author sponsorship, you may request a full refund within 14 days of your initial purchase if you are unsatisfied.</li>
                <li><strong>Billing Discrepancies:</strong> Any duplicate or mistaken charges verified by our billing desk will be refunded immediately to your original payment method.</li>
                <li><strong>Pro-rated Cancellations:</strong> You can cancel any recurring subscription at any time via your account settings; your access will continue until the end of the current billing cycle without further charges.</li>
              </ul>

              <h2 className="ed-policy-sec-title" style={{ marginTop: 28 }}>3. Requesting a Refund</h2>
              <p>
                To submit a billing inquiry or request a refund, please contact our support team through the <Link to="/help#contact" style={{ color: '#4f46e5', fontWeight: 600 }}>Help Center</Link> or email <strong>billing@blogsum.com</strong> with your account username and transaction details. Requests are reviewed and resolved within 3-5 business days.
              </p>
            </>
          )}
        </article>
      </div>
    </div>
  );
}

export default ReturnPolicy;
