const nodemailer = require('nodemailer');

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getBaseUrl = () =>
  (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/**
 * Master Editorial HTML Email Wrapper (Inline CSS for Gmail, Outlook & Apple Mail)
 */
const wrapEditorialEmailLayout = ({
  kicker = 'BLOGSUM PUBLICATION',
  headline = 'A Dispatch from BlogSum',
  subtitle = '',
  bodyHtml = '',
  ctaLabel = '',
  ctaUrl = '',
  footerNote = 'You are receiving this email from BlogSum, an independent digital publication for thoughtful essays and ideas.',
}) => {
  const baseUrl = getBaseUrl();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
          
          <!-- Dark Slate Publication Masthead -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 36px;border-bottom:1px solid #1e293b;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <a href="${baseUrl}" style="text-decoration:none;display:inline-block;">
                      <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">BlogSum</span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:#6366f1;margin-left:3px;vertical-align:baseline;"></span>
                    </a>
                  </td>
                  <td align="right" style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">
                    ${escapeHtml(kicker)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Editorial Headline & Body Content -->
          <tr>
            <td style="padding:40px 36px 32px 36px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4f46e5;margin-bottom:10px;">
                ${escapeHtml(kicker)}
              </div>
              <h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">
                ${escapeHtml(headline)}
              </h1>
              ${
                subtitle
                  ? `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#475569;font-weight:400;">${escapeHtml(
                      subtitle
                    )}</p>`
                  : ''
              }

              <div style="height:1px;background-color:#e2e8f0;margin:24px 0;"></div>

              <!-- Rich Body Area -->
              <div style="font-size:15px;line-height:1.7;color:#334155;">
                ${bodyHtml}
              </div>

              ${
                ctaLabel && ctaUrl
                  ? `
              <!-- Primary CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px;margin-bottom:8px;">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#0f172a;">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                      ${escapeHtml(ctaLabel)} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Publication Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:26px 36px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 10px 0;font-size:12.5px;line-height:1.6;color:#64748b;">
                ${escapeHtml(footerNote)}
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${year} BlogSum Publication. All rights reserved. &middot;
                <a href="${baseUrl}" style="color:#475569;text-decoration:underline;">Visit Publication</a> &middot;
                <a href="${baseUrl}/about" style="color:#475569;text-decoration:underline;">About</a> &middot;
                <a href="${baseUrl}/help" style="color:#475569;text-decoration:underline;">Help Center</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 1. Newsletter Subscription Welcome Template
 */
const buildSubscriptionWelcomeEmail = (subscriberEmail = '') => {
  const baseUrl = getBaseUrl();
  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hello,</p>
    <p style="margin:0 0 18px 0;">
      Thank you for subscribing to <strong>The BlogSum Weekly Dispatch</strong> with <span style="color:#0f172a;font-weight:600;">${escapeHtml(
        subscriberEmail
      )}</span>. You are now part of a global community of readers, engineers, designers, and essayists.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:22px 0;">
      <tr>
        <td>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;margin-bottom:10px;">
            What you will receive in your inbox
          </div>
          <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:1.75;">
            <li><strong>Editor&rsquo;s Picks:</strong> Hand-curated long-form essays and deep-dives from our community.</li>
            <li><strong>Fresh Perspectives:</strong> Highlights across Technology, Design, Science, Culture, and Business.</li>
            <li><strong>Zero Noise:</strong> Thoughtful reading worth your time&mdash;never spam.</li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="margin:0;">
      While you wait for the next issue, explore today&rsquo;s featured stories or publish your own perspective on BlogSum.
    </p>
  `;

  return wrapEditorialEmailLayout({
    kicker: 'THE WEEKLY DISPATCH',
    headline: 'Welcome to BlogSum.',
    subtitle: 'Your subscription to our editorial newsletter is confirmed.',
    bodyHtml,
    ctaLabel: 'Explore Latest Stories',
    ctaUrl: baseUrl,
    footerNote: `This confirmation was sent to ${subscriberEmail} because you subscribed to The BlogSum Weekly Dispatch.`,
  });
};

/**
 * 2. Newsletter Broadcast Issue Template
 */
const buildNewsletterDispatchEmail = (subject = 'The Weekly Dispatch', messageText = '') => {
  const baseUrl = getBaseUrl();
  const issueDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const paragraphs = String(messageText || '')
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-size:15.5px;line-height:1.75;color:#1e293b;">${escapeHtml(
          p
        ).replace(/\n/g, '<br/>')}</p>`
    )
    .join('');

  const bodyHtml = `
    <div style="font-size:12.5px;color:#64748b;margin-bottom:18px;font-style:italic;">
      Published ${escapeHtml(issueDate)} &middot; Editorial Dispatch
    </div>
    ${paragraphs || `<p style="margin:0;">${escapeHtml(messageText)}</p>`}
  `;

  return wrapEditorialEmailLayout({
    kicker: 'EDITORIAL DISPATCH',
    headline: subject,
    subtitle: 'Curated ideas, essays, and community highlights from BlogSum.',
    bodyHtml,
    ctaLabel: 'Read More on BlogSum',
    ctaUrl: baseUrl,
    footerNote:
      'You received this dispatch because you are subscribed to the BlogSum newsletter.',
  });
};

/**
 * 3. Password Reset Security Template
 */
const buildPasswordResetEmail = ({ username = 'Reader', resetUrl = '' }) => {
  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hello <strong>${escapeHtml(username)}</strong>,</p>
    <p style="margin:0 0 18px 0;">
      We received a request to reset the password for your BlogSum account. Click the button below to choose a new password:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin:22px 0;">
      <tr>
        <td>
          <div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:6px;">
            Direct Reset Link (if button does not open)
          </div>
          <a href="${resetUrl}" style="font-size:13px;color:#4f46e5;word-break:break-all;text-decoration:underline;">
            ${escapeHtml(resetUrl)}
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13.5px;color:#64748b;">
      If you did not request a password reset, you can safely ignore this email&mdash;your account remains secure and no changes have been made.
    </p>
  `;

  return wrapEditorialEmailLayout({
    kicker: 'ACCOUNT SECURITY',
    headline: 'Reset your BlogSum password',
    subtitle: 'Follow the secure link below to set a new password for your account.',
    bodyHtml,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
    footerNote:
      'This is an automated security notification regarding your BlogSum account.',
  });
};

/**
 * 4. Help Center / Contact Us Confirmation Template
 */
const buildContactConfirmationEmail = ({ name = 'Reader', subject = '', message = '' }) => {
  const baseUrl = getBaseUrl();
  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p style="margin:0 0 18px 0;">
      Thank you for reaching out to the BlogSum Support &amp; Editorial desk. We have received your message and a member of our team will respond within 24 hours.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:20px 0;">
      <tr>
        <td>
          <div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:8px;">
            Summary of Your Inquiry
          </div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:6px;">
            ${escapeHtml(subject)}
          </div>
          <div style="font-size:13.5px;color:#475569;line-height:1.6;white-space:pre-wrap;">${escapeHtml(
            message
          )}</div>
        </td>
      </tr>
    </table>
  `;

  return wrapEditorialEmailLayout({
    kicker: 'HELP & SUPPORT DESK',
    headline: 'We received your message',
    subtitle: 'Our support team has logged your inquiry and will reply shortly.',
    bodyHtml,
    ctaLabel: 'Return to Help Center',
    ctaUrl: `${baseUrl}/help`,
  });
};

/**
 * Automatic smart HTML builder when sendEmail(email, subject, text) is called directly
 */
const autoBuildHtmlFromCall = (email, subject = '', text = '') => {
  const lowerSub = String(subject).toLowerCase();
  const trimmedText = String(text || '').trim();

  if (lowerSub.includes('subscription') || lowerSub.includes('welcome')) {
    return buildSubscriptionWelcomeEmail(email);
  }

  if (lowerSub.includes('password reset') || trimmedText.includes('/password-reset/')) {
    const urlMatch = trimmedText.match(/https?:\/\/[^\s]+/);
    const resetUrl = urlMatch ? urlMatch[0] : trimmedText;
    return buildPasswordResetEmail({ username: email.split('@')[0], resetUrl });
  }

  return buildNewsletterDispatchEmail(subject || 'BlogSum Update', trimmedText);
};

const sendEmail = async (email, subject, text = '', customHtml = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    const htmlContent = customHtml || autoBuildHtmlFromCall(email, subject, text);

    await transporter.sendMail({
      from: `"BlogSum Publication" <${process.env.USER}>`,
      to: email,
      subject,
      text: text || subject,
      html: htmlContent,
    });
    console.log('email sent successfully');
  } catch (error) {
    console.log('email not sent!');
    console.log(error);
    return error;
  }
};

sendEmail.wrapEditorialEmailLayout = wrapEditorialEmailLayout;
sendEmail.buildSubscriptionWelcomeEmail = buildSubscriptionWelcomeEmail;
sendEmail.buildNewsletterDispatchEmail = buildNewsletterDispatchEmail;
sendEmail.buildPasswordResetEmail = buildPasswordResetEmail;
sendEmail.buildContactConfirmationEmail = buildContactConfirmationEmail;

module.exports = sendEmail;
