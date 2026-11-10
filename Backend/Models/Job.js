const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: {
      type: String,
      required: true,
      trim: true,
      default: 'Editorial',
    },
    location: { type: String, default: 'Remote', trim: true },
    type: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
      default: 'Full-Time',
    },
    experience: {
      type: String,
      enum: ['Entry-Level', 'Mid-Level', 'Senior', 'Lead / Director'],
      default: 'Mid-Level',
    },
    salaryRange: { type: String, default: 'Competitive', trim: true },
    description: { type: String, required: true, trim: true },
    responsibilities: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    perks: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    applyEmail: { type: String, default: 'careers@blogsum.com', trim: true },
    isActive: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);

