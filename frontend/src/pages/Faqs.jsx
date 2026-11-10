import React, { useMemo } from 'react';
import Navbar from '../components/NavBar';
import { Collapse } from 'antd';
import { QuestionCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';

const FAQ_CATEGORIES = [
  {
    title: 'Publishing & Editorial Studio',
    items: [
      {
        key: '1',
        label: 'How do I publish a new story on BlogSum?',
        children:
          'Click the "Write" button in the navigation bar to open the BlogSum Publishing Studio. You can compose with live side-by-side preview, select up to 5 gallery images, choose from 15 editorial categories, add custom #tags, and set estimated read times.',
      },
      {
        key: '2',
        label: 'How does scheduled publishing work?',
        children:
          'When drafting a story, switch the publishing mode to "Schedule" and choose your desired release date and time. Your post will remain safely hidden from the public feed on your profile marked "Not Yet Published". Our background scheduler checks every 30 seconds and automatically publishes the post and notifies your followers when the scheduled time arrives.',
      },
      {
        key: '3',
        label: 'Can I edit a story directly in the preview mode?',
        children:
          'Yes. The BlogSum studio features an interactive preview panel that allows direct editing and instant typography re-rendering before you publish.',
      },
      {
        key: '4',
        label: 'How many gallery photos can I attach?',
        children:
          'You can upload up to 5 photos per essay. On the main blog feed, the primary photo is featured with an indicator badge (e.g. "1/5 photos"). On the article page, readers can click or swipe through the photos in an interactive slider stage.',
      },
    ],
  },
  {
    title: 'Reader Experience & Community',
    items: [
      {
        key: '5',
        label: 'How does the Audio Read-Aloud feature work?',
        children:
          'Every published story on BlogSum comes with voice synthesis. Simply tap the "Listen" button in the article byline strip to listen to the essay read aloud at a comfortable pace.',
      },
      {
        key: '6',
        label: 'How do Reactions and Bookmarks work?',
        children:
          'Readers can react to articles with expressive reactions (Love, Like, Celebrate, Insightful, Support, Funny). You can also bookmark articles to your personal library by clicking the bookmark icon on any card or article.',
      },
      {
        key: '7',
        label: 'How are profile Likes calculated?',
        children:
          'Profile Likes reflect the cumulative total of likes received across all of an author’s published stories from readers across the platform.',
      },
    ],
  },
  {
    title: 'Account, Security & Newsletter',
    items: [
      {
        key: '8',
        label: 'How do I update my profile or reset my password?',
        children:
          'Head over to Settings or My Profile to edit your bio, author handle, and location. To change your password, use the Password & Security tab where real-time password strength validation helps you choose a secure password.',
      },
      {
        key: '9',
        label: 'How do I subscribe to The Weekly Dispatch newsletter?',
        children:
          'Enter your email address in the newsletter card located in the website footer or on our Help page. You will receive an immediate confirmation email and will get hand-curated essays delivered straight to your inbox.',
      },
    ],
  },
];

function Faqs() {
  const navigate = useNavigate();

  const { data: publicSettings } = useQuery({
    queryKey: ['publicSiteSettings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/admin/public-settings');
      return data;
    },
    staleTime: 60 * 1000,
  });

  const displayedCategories = useMemo(() => {
    const customFaqs = publicSettings?.customFaqs;
    if (Array.isArray(customFaqs) && customFaqs.length > 0) {
      const map = {};
      customFaqs.forEach((faq, idx) => {
        const cat = faq.category || 'General & Editorial';
        if (!map[cat]) map[cat] = [];
        map[cat].push({
          key: `custom-${idx}`,
          label: faq.question,
          children: faq.answer,
        });
      });
      const customCatList = Object.keys(map).map((title) => ({
        title,
        items: map[title],
      }));
      return [...customCatList, ...FAQ_CATEGORIES];
    }
    return FAQ_CATEGORIES;
  }, [publicSettings?.customFaqs]);

  return (
    <div className="ed-faq-page">
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .ed-faq-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-top: 96px;
          padding-bottom: 80px;
        }

        .ed-faq-container {
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ed-faq-hero {
          background: #0f172a;
          color: #ffffff;
          border-radius: 24px;
          padding: 48px 40px;
          margin-bottom: 36px;
        }

        .ed-faq-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.16);
          border: 1px solid rgba(99, 102, 241, 0.35);
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .ed-faq-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 10px 0;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .ed-faq-sub {
          font-size: 0.95rem;
          color: #94a3b8;
          margin: 0;
          line-height: 1.6;
        }

        .ed-faq-group {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
        }

        .ed-faq-group-title {
          font-family: 'Newsreader', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 16px 0;
        }

        .ed-faq-contact-cta {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
      `}</style>

      <div className="ed-faq-container">
        <header className="ed-faq-hero">
          <div className="ed-faq-kicker">
            <QuestionCircleOutlined />
            <span>Knowledge Base &middot; FAQs</span>
          </div>
          <h1 className="ed-faq-title">Frequently Asked Questions</h1>
          <p className="ed-faq-sub">
            Clear answers about writing, scheduling, reading, and account security on BlogSum.
          </p>
        </header>

        {displayedCategories.map((cat) => (
          <section key={cat.title} className="ed-faq-group">
            <h2 className="ed-faq-group-title">{cat.title}</h2>
            <Collapse accordion bordered={false} items={cat.items} style={{ background: '#fff' }} />
          </section>
        ))}

        <section className="ed-faq-contact-cta">
          <div>
            <h3
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: '1.4rem',
                fontWeight: 600,
                color: '#0f172a',
                margin: '0 0 4px 0',
              }}
            >
              Still have a question?
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
              Our editorial support team responds within 24 hours.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/help#contact')}
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 999,
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <span>Ask in Help Center</span>
            <ArrowRightOutlined style={{ fontSize: 12 }} />
          </button>
        </section>
      </div>
    </div>
  );
}

export default Faqs;
