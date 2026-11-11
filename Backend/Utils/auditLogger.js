const AuditLog = require('../Models/AuditLog');

const logAdminAction = async ({ req, actionType, targetType, targetId, targetLabel, details = {} }) => {
  try {
    const adminId = req.user?._id;
    const adminUsername = req.user?.username || 'admin';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    await AuditLog.create({
      adminId,
      adminUsername,
      actionType,
      targetType,
      targetId: String(targetId || ''),
      targetLabel: targetLabel || '',
      ipAddress,
      userAgent,
      details,
    });
  } catch (error) {
    console.error('Failed to write admin audit log:', error);
  }
};

module.exports = { logAdminAction };

