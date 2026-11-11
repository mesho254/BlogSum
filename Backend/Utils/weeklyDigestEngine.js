const cron = require('node-cron');
const User = require('../Models/User');
const Blog = require('../Models/Blog');
const sendEmail = require('./sendEmail');

const getBaseUrl = () =>
  (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/**
 * Builds the HTML content for the Sunday Weekly Editorial Digest
 */
function buildWeeklyDigestHtml(stories = []) {
  const baseUrl = getBaseUrl();

  const storyRows = stories
    .map(
      (b, idx) => `
    <div style="padding: 16px; margin-bottom: 14px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
        #${idx + 1} &middot; ${b.category || 'Story'} &middot; ${b.readTime || '5 min read'}
      </div>
      <h3 style="margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #0f172a;">
        <a href="${baseUrl}/blog/${b._id}" style="color: #0f172a; text-decoration: none;">
          ${b.title}
        </a>
      </h3>
      ${
        b.subtitle
          ? `<p style="margin: 0 0 10px; font-size: 14px; color: #475569; line-height: 1.5;">${b.subtitle}</p>`
          : ''
      }
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b;">
        <span>By <strong>${b.author?.username || 'Author'}</strong></span>
        <a href="${baseUrl}/blog/${b._id}" style="color: #4f46e5; font-weight: 700; text-decoration: none;">
          Read Story &rarr;
        </a>
      </div>
    </div>
  `
    )
    .join('');

  const bodyHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Here is your curated Sunday digest featuring the top stories and discussions trending across the BlogSum platform this week.
    </p>
    ${storyRows}
  `;

  return sendEmail.wrapEditorialEmailLayout({
    kicker: 'BLOGSUM SUNDAY DIGEST',
    headline: 'Top Stories & Ideas This Week',
    subtitle: 'Thoughtful essays and perspectives handpicked for your weekend reading.',
    bodyHtml,
    ctaLabel: 'Browse All Stories',
    ctaUrl: baseUrl,
    footerNote: 'You received this weekly dispatch because you are a registered reader on BlogSum.',
  });
}

/**
 * Executes sending of the weekly digest
 */
async function dispatchWeeklyDigest() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch top 4 stories from the past 7 days, ranked by likes & comments
    const topStories = await Blog.find({
      status: 'published',
      date: { $gte: oneWeekAgo },
    })
      .populate('author', 'username')
      .lean();

    // Sort by engagement
    const sorted = topStories
      .sort((a, b) => {
        const scoreA = (a.likes?.length || 0) * 2 + (a.comments?.length || 0) * 3;
        const scoreB = (b.likes?.length || 0) * 2 + (b.comments?.length || 0) * 3;
        return scoreB - scoreA;
      })
      .slice(0, 4);

    if (sorted.length === 0) {
      console.log('No recent stories found for weekly digest.');
      return { success: false, reason: 'No new stories' };
    }

    const digestHtml = buildWeeklyDigestHtml(sorted);
    const users = await User.find({ isSuspended: false }).select('email username').lean();

    let sentCount = 0;
    for (const u of users) {
      if (u.email) {
        await sendEmail(
          u.email,
          'Your Sunday Editorial Digest - BlogSum',
          'Explore top stories and essays published this week on BlogSum.',
          digestHtml
        );
        sentCount++;
      }
    }

    console.log(`Weekly digest successfully sent to ${sentCount} readers.`);
    return { success: true, recipients: sentCount, storiesCount: sorted.length };
  } catch (error) {
    console.error('Error dispatching weekly digest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initializes the weekly digest cron runner (Sundays at 6:00 PM UTC)
 */
function initWeeklyDigestCron() {
  // Cron: '0 18 * * 0' (At 18:00 on Sunday)
  cron.schedule('0 18 * * 0', () => {
    console.log('Running automated Sunday Weekly Digest job...');
    dispatchWeeklyDigest().catch((err) =>
      console.error('Failed to run scheduled weekly digest:', err)
    );
  });
}

module.exports = {
  dispatchWeeklyDigest,
  buildWeeklyDigestHtml,
  initWeeklyDigestCron,
};

