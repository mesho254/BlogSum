const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, default: 'Editorial', trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    portfolio: { type: String, default: '', trim: true },
    resumeUrl: { type: String, default: '', trim: true },
    resumeFileName: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'interviewing', 'rejected', 'hired'],
      default: 'new',
    },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobApplication', jobApplicationSchema);

