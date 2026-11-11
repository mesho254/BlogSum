const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminUsername: { type: String, default: '' },
    actionType: {
      type: String,
      required: true,
      enum: [
        'USER_SUSPENDED',
        'USER_ACTIVATED',
        'ROLE_CHANGED',
        'USER_VERIFIED',
        'BLOG_DELETED',
        'BLOG_STATUS_CHANGED',
        'SETTINGS_UPDATED',
        'JOB_CREATED',
        'JOB_UPDATED',
        'JOB_DELETED',
        'INQUIRY_RESOLVED',
        '2FA_ENABLED',
        '2FA_DISABLED',
        'ACCOUNT_DELETED',
      ],
    },
    targetType: { type: String, default: 'General' },
    targetId: { type: String, default: '' },
    targetLabel: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actionType: 1 });
auditLogSchema.index({ adminId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

