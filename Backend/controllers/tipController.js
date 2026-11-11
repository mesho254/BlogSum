const Tip = require('../Models/Tip');
const Blog = require('../Models/Blog');
const Notification = require('../Models/Notification');
const { createPayPalOrder, capturePayPalOrder } = require('../Utils/paypal');

/**
 * Returns public PayPal Client Configuration for frontend SDK initialization
 */
const getPayPalConfig = (req, res) => {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    mode: process.env.PAYPAL_MODE || 'sandbox',
    currency: 'USD',
  });
};

/**
 * Creates a PayPal Order for tipping an author
 */
const createTipOrder = async (req, res) => {
  try {
    const { blogId, amount, tierName = 'Custom', note = '' } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 0.5) {
      return res.status(400).json({ error: 'Tip amount must be at least $0.50' });
    }

    const blog = await Blog.findById(blogId).populate('author', 'username email');
    if (!blog) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (!blog.author) {
      return res.status(400).json({ error: 'Author profile not found for this story' });
    }

    const authorUsername = blog.author.username || 'Author';
    const sender = req.user ? req.user._id : null;
    const senderName = req.user ? req.user.username : (req.body.senderName || 'Generous Reader');
    const senderEmail = req.user ? req.user.email : '';

    // Initialize PayPal Order
    const paypalOrder = await createPayPalOrder({
      amount: parsedAmount,
      currency: 'USD',
      description: `Tip for ${authorUsername} on "${blog.title.slice(0, 45)}"`,
      customId: blogId,
    });

    // Save pending tip record
    const tip = await Tip.create({
      sender,
      senderName,
      senderEmail,
      recipient: blog.author._id,
      blog: blog._id,
      amount: parsedAmount,
      currency: 'USD',
      tierName,
      note: note.trim().slice(0, 300),
      paypalOrderId: paypalOrder.id,
      status: 'PENDING',
    });

    res.status(201).json({
      orderId: paypalOrder.id,
      tipId: tip._id,
    });
  } catch (error) {
    console.error('Error creating tip order:', error);
    res.status(500).json({
      error: error.message || 'Failed to initialize PayPal order',
    });
  }
};

/**
 * Captures the PayPal payment upon user approval
 */
const captureTipOrder = async (req, res) => {
  try {
    const { orderId, blogId, note } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'PayPal Order ID is required' });
    }

    // Call PayPal Capture API
    const captureData = await capturePayPalOrder(orderId);

    // Find and update Tip record
    let tip = await Tip.findOne({ paypalOrderId: orderId });

    const captureId =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';

    if (tip) {
      tip.status = 'COMPLETED';
      tip.paypalCaptureId = captureId;
      if (note && !tip.note) {
        tip.note = note.trim().slice(0, 300);
      }
      await tip.save();
    } else {
      // Fallback in case webhook or async creation
      const blog = await Blog.findById(blogId).populate('author', 'username');
      const sender = req.user ? req.user._id : null;
      const senderName = req.user ? req.user.username : 'Generous Reader';

      tip = await Tip.create({
        sender,
        senderName,
        recipient: blog?.author?._id,
        blog: blogId,
        amount: parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '5.00'),
        currency: 'USD',
        paypalOrderId: orderId,
        paypalCaptureId: captureId,
        note: note ? note.trim().slice(0, 300) : '',
        status: 'COMPLETED',
      });
    }

    // Send in-app notification & real-time socket alert to the recipient author
    try {
      const blog = await Blog.findById(tip.blog).select('title');
      const blogTitle = blog ? blog.title : 'your story';

      const notificationMsg = `🎉 You received a $${tip.amount} tip from ${tip.senderName} on "${blogTitle}"!${
        tip.note ? ` Note: "${tip.note}"` : ''
      }`;

      const newNotification = await Notification.create({
        user: tip.recipient,
        message: notificationMsg,
        read: false,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(tip.recipient.toString()).emit('newNotification', newNotification);
        io.to(tip.recipient.toString()).emit('tipReceived', {
          tip,
          blogTitle,
          amount: tip.amount,
          senderName: tip.senderName,
          note: tip.note,
        });
      }
    } catch (notifErr) {
      console.error('Non-critical error emitting tip notification:', notifErr);
    }

    res.json({
      success: true,
      tip,
      captureId,
    });
  } catch (error) {
    console.error('Error capturing tip payment:', error);
    res.status(500).json({
      error: error.message || 'Failed to capture PayPal payment',
    });
  }
};

/**
 * Get tips received by an author
 */
const getAuthorTips = async (req, res) => {
  try {
    const { authorId } = req.params;
    const tips = await Tip.find({ recipient: authorId, status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username profilePicture')
      .populate('blog', 'title');

    const totalAmount = tips.reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      tips,
      totalAmount,
      count: tips.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: Get all platform tips with financial metrics
 */
const getAllTips = async (req, res) => {
  try {
    const tips = await Tip.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'username profilePicture email')
      .populate('recipient', 'username profilePicture email')
      .populate('blog', 'title');

    const completedTips = tips.filter((t) => t.status === 'COMPLETED');
    const totalVolume = completedTips.reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      tips,
      totalVolume,
      count: completedTips.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPayPalConfig,
  createTipOrder,
  captureTipOrder,
  getAuthorTips,
  getAllTips,
};

