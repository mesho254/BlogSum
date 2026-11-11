const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: 'Generous Reader',
    },
    senderEmail: {
      type: String,
      default: '',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.5,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    tierName: {
      type: String,
      default: 'Custom',
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    paypalOrderId: {
      type: String,
      required: true,
    },
    paypalCaptureId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

tipSchema.index({ recipient: 1, createdAt: -1 });
tipSchema.index({ blog: 1, createdAt: -1 });

const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;

