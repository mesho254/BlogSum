const AuditLog = require('../Models/AuditLog');
const User = require('../Models/User');

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

const recordUserSecurityLog = async (userId, { action, req, status = 'success' }) => {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const userAgent = req?.headers?.['user-agent'] || '';
    await User.findByIdAndUpdate(userId, {
      $push: {
        securityAuditLogs: {
          $each: [
            {
              action,
              ip: String(ip).slice(0, 45),
              userAgent: String(userAgent).slice(0, 200),
              status,
              timestamp: new Date(),
            },
          ],
          $slice: -30, // retain 30 most recent security events
        },
      },
    });
  } catch (error) {
    console.error('Failed to write user security log:', error);
  }
};

module.exports = { logAdminAction, recordUserSecurityLog };


