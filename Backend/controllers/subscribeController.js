const Subscriber = require('../Models/Subscribe');
const sendEmail = require('../Utils/sendEmail');

const subscribe = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already subscribed.' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    // Send confirmation email
    await sendEmail(email, 'Subscription Confirmation', 'Thank you for subscribing to our newsletter!');

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
      const emailPromises = subscribers.map(subscriber =>
        sendEmail(subscriber.email, subject, message)
      );
      await Promise.all(emailPromises);
  
      res.status(200).json({ message: 'News sent to all subscribers!' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send news.', error: error.message });
    }
  };
  
  module.exports = { subscribe, getSubscribers, sendNewsToSubscribers };