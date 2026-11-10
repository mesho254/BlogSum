const Subscriber = require('../Models/Subscribe');
const Contact = require('../Models/Contact');
const sendEmail = require('../Utils/sendEmail');

const subscribe = async (req, res) => {
  const { email } = req.body;

  try {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already subscribed.' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    const welcomeHtml = sendEmail.buildSubscriptionWelcomeEmail(email);
    await sendEmail(
      email,
      'Welcome to The BlogSum Weekly Dispatch',
      'Thank you for subscribing to The BlogSum Weekly Dispatch!',
      welcomeHtml
    );

    res.status(200).json({ message: 'Subscription successful!' });
  } catch (error) {
    res.status(500).json({ message: 'Subscription failed.', error: error.message });
  }
};

const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({});
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve subscribers.', error: error.message });
  }
};

const sendNewsToSubscribers = async (req, res) => {
  const { subject, message } = req.body;

  try {
    const subscribers = await Subscriber.find({});
    const dispatchHtml = sendEmail.buildNewsletterDispatchEmail(subject, message);
    const emailPromises = subscribers.map((subscriber) =>
      sendEmail(subscriber.email, subject, message, dispatchHtml)
    );
    await Promise.all(emailPromises);

    res.status(200).json({ message: 'News sent to all subscribers!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send news.', error: error.message });
  }
};

const submitContactInquiry = async (req, res) => {
  const { name, email, subject, message, category } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  try {
    const effectiveSubject = subject
      ? `[${category || 'Support'}] ${subject}`
      : `[${category || 'Support'}] Inquiry from ${name}`;

    // Persist inquiry in database for Admin review
    const inquiryRecord = await Contact.create({
      name,
      email,
      category: category || 'General Support',
      subject: effectiveSubject,
      message,
      status: 'new',
    });

    // Send confirmation receipt to the user
    const receiptHtml = sendEmail.buildContactConfirmationEmail({
      name,
      subject: effectiveSubject,
      message,
    });
    sendEmail(
      email,
      'We received your message — BlogSum Support',
      `Hi ${name}, we received your message regarding "${effectiveSubject}" and will respond within 24 hours.`,
      receiptHtml
    ).catch(() => {});

    // Forward inquiry to the publication admin inbox if configured
    if (process.env.USER) {
      const adminHtml = sendEmail.wrapEditorialEmailLayout({
        kicker: 'NEW SUPPORT INQUIRY',
        headline: effectiveSubject,
        subtitle: `From: ${name} (${email})`,
        bodyHtml: `<p style="margin:0;white-space:pre-wrap;">${message}</p>`,
        ctaLabel: `Reply to ${name}`,
        ctaUrl: `mailto:${email}?subject=${encodeURIComponent(`Re: ${effectiveSubject}`)}`,
      });
      sendEmail(process.env.USER, effectiveSubject, message, adminHtml).catch(() => {});
    }

    res.status(200).json({ message: 'Your message has been sent to our editorial support team.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit inquiry.', error: error.message });
  }
};

module.exports = {
  subscribe,
  getSubscribers,
  sendNewsToSubscribers,
  submitContactInquiry,
};
