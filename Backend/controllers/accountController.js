/**
 * GDPR Article 17 — "Right to be Forgotten"
 * Self-service, irreversible account deletion with anonymization of
 * shared/community content (comments, replies, messages).
 *
 * What happens to each kind of data:
 *  - Account, profile, picture, notifications, reset tokens  -> permanently deleted
 *  - Authored stories, drafts and series                      -> permanently deleted
 *  - Comments & replies on other people's stories             -> kept, re-attributed to an anonymous "Deleted user"
 *  - Direct/channel messages they sent                        -> content wiped, re-attributed to "Deleted user"
 *  - Likes, reactions, bookmarks, follows, blocks, channel memberships -> removed
 *  - Job applications submitted with their email              -> deleted
 *  - Completed tips (financial records)                       -> retained for accounting, personal details stripped
 *  - Admin audit logs                                          -> retained (legitimate security interest)
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { verifySync } = require('otplib');

const User = require('../Models/User');
const Blog = require('../Models/Blog');
const Series = require('../Models/Series');
const Notification = require('../Models/Notification');
const Message = require('../Models/Message');
const Channel = require('../Models/Channel');
const Token = require('../Models/Token');
const Tip = require('../Models/Tip');
const JobApplication = require('../Models/JobApplication');
const cloudinary = require('../config/cloudinary');
const { invalidateAuthUserCache } = require('../MiddleWares/authMiddleWare');
const { refreshBlogsCache } = require('./blogController');
const { logAdminAction } = require('../Utils/auditLogger');

const DELETED_USER_USERNAME = 'deleted-user';
const DELETED_USER_EMAIL = 'deleted-user@blogsum.invalid';
const CONFIRMATION_PHRASE = 'DELETE';

/**
 * Shared placeholder account that anonymized comments/messages point to.
 * Keeps populate() results non-null so existing UI never crashes on `comment.user.username`.
 * It cannot be logged into: random unknowable password + suspended.
 */
const getDeletedUserPlaceholder = async () => {
  let placeholder = await User.findOne({ username: DELETED_USER_USERNAME });
  if (!placeholder) {
    placeholder = await User.create({
      username: DELETED_USER_USERNAME,
      email: DELETED_USER_EMAIL,
      password: crypto.randomBytes(48).toString('hex'),
      roles: 'system',
      isSuspended: true,
      bio: 'This account was deleted.',
    });
  }
  return placeholder;
};

/** Best-effort removal of a Cloudinary-hosted image from its URL. */
const destroyCloudinaryImage = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return;
  try {
    // .../upload/v1712345678/profile_pictures/abc123.jpg -> profile_pictures/abc123
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return;
    const publicId = afterUpload.replace(/^v\d+\//, '').replace(/\.[a-z0-9]+$/i, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Non-critical: failed to remove Cloudinary image during account deletion:', err.message);
  }
};

const isLastAdmin = async (user) => {
  const isAdmin =
    user.roles === 'admin' || String(user.username || '').trim().toLowerCase() === 'admin';
  if (!isAdmin) return false;
  const otherAdmins = await User.countDocuments({ _id: { $ne: user._id }, roles: 'admin' });
  return otherAdmins === 0;
};

/**
 * GET /api/users/me/deletion-preview
 * Shows the user exactly what will be removed before they confirm.
 */
const getDeletionPreview = async (req, res) => {
  try {
    const userId = req.user._id;
    const [user, storiesCount, seriesCount, commentBlogs, notificationsCount] = await Promise.all([
      User.findById(userId).select('roles username twoFactorEnabled followers following'),
      Blog.countDocuments({ author: userId }),
      Series.countDocuments({ author: userId }),
      Blog.find(
        { $or: [{ 'comments.user': userId }, { 'comments.replies.user': userId }] },
        { comments: 1 }
      ).lean(),
      Notification.countDocuments({ user: userId }),
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });

    let commentsCount = 0;
    const uid = String(userId);
    for (const b of commentBlogs) {
      for (const c of b.comments || []) {
        if (String(c.user) === uid) commentsCount += 1;
        for (const r of c.replies || []) {
          if (String(r.user) === uid) commentsCount += 1;
        }
      }
    }

    res.json({
      storiesCount,
      seriesCount,
      commentsCount,
      notificationsCount,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      blockedReason: (await isLastAdmin(user))
        ? 'You are the only administrator. Promote another admin before deleting this account.'
        : null,
      confirmationPhrase: CONFIRMATION_PHRASE,
    });
  } catch (err) {
    console.error('Error building deletion preview:', err);
    res.status(500).json({ message: 'Failed to load deletion summary' });
  }
};

/**
 * DELETE /api/users/me
 * Body: { password, confirmation: "DELETE", code? (required when 2FA is on) }
 */
const deleteMyAccount = async (req, res) => {
  try {
    const { password, confirmation, code } = req.body || {};
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.username === DELETED_USER_USERNAME) {
      return res.status(400).json({ message: 'This system account cannot be deleted.' });
    }

    if (confirmation !== CONFIRMATION_PHRASE) {
      return res.status(400).json({ message: `Type ${CONFIRMATION_PHRASE} to confirm account deletion.` });
    }

    if (!password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect password. Account was not deleted.' });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const clean = String(code || '').trim().replace(/[\s-]/g, '');
      if (!clean) {
        return res.status(400).json({ message: 'Enter your 6-digit authenticator code or a recovery code.' });
      }
      const totp = verifySync({ token: clean, secret: user.twoFactorSecret });
      const recoveryOk = (user.twoFactorRecoveryCodes || []).some(
        (rc) => rc.replace(/[\s-]/g, '').toUpperCase() === clean.toUpperCase()
      );
      if (!(totp && totp.valid) && !recoveryOk) {
        return res.status(401).json({ message: 'Invalid 2FA code. Account was not deleted.' });
      }
    }

    if (await isLastAdmin(user)) {
      return res.status(403).json({
        message: 'You are the only administrator. Promote another admin before deleting this account.',
      });
    }

    const userId = user._id;
    const placeholder = await getDeletedUserPlaceholder();
    const placeholderId = placeholder._id;

    // 1. Authored stories & series — permanently removed
    const ownBlogs = await Blog.find({ author: userId }).select('_id imageUrl images').lean();
    const ownBlogIds = ownBlogs.map((b) => b._id);

    await Promise.all([
      Blog.deleteMany({ author: userId }),
      Series.deleteMany({ author: userId }),
      // Remove deleted stories from everyone's likes/bookmarks/shares and from other people's series
      ownBlogIds.length
        ? User.updateMany(
            {},
            {
              $pull: {
                likedBlogs: { $in: ownBlogIds },
                bookmarkedBlogs: { $in: ownBlogIds },
                MyShares: { $in: ownBlogIds },
              },
            }
          )
        : Promise.resolve(),
      ownBlogIds.length
        ? Series.updateMany({}, { $pull: { stories: { $in: ownBlogIds } } })
        : Promise.resolve(),
    ]);

    // 2. Comments & replies on other people's stories — anonymized, not deleted,
    //    so discussion threads stay readable. Also drops their comment/reply likes.
    //    Done in JS (not positional $[] operators) so legacy docs missing a
    //    `replies` array can't abort the deletion midway.
    const uid = String(userId);
    const threads = await Blog.find(
      {
        $or: [
          { 'comments.user': userId },
          { 'comments.replies.user': userId },
          { 'comments.likes': userId },
          { 'comments.replies.likes': userId },
        ],
      },
      { comments: 1 }
    ).lean();

    for (const thread of threads) {
      const comments = (thread.comments || []).map((c) => ({
        ...c,
        user: String(c.user) === uid ? placeholderId : c.user,
        likes: (c.likes || []).filter((id) => String(id) !== uid),
        replies: (c.replies || []).map((r) => ({
          ...r,
          user: String(r.user) === uid ? placeholderId : r.user,
          likes: (r.likes || []).filter((id) => String(id) !== uid),
        })),
      }));
      await Blog.updateOne({ _id: thread._id }, { $set: { comments } });
    }

    // 3. Engagement traces on remaining stories
    await Blog.updateMany(
      {
        $or: [
          { likes: userId },
          { bookmarks: userId },
          { shares: userId },
          { 'reactions.user': userId },
        ],
      },
      {
        $pull: {
          likes: userId,
          bookmarks: userId,
          shares: userId,
          reactions: { user: userId },
        },
      }
    );

    // 4. Social graph
    await User.updateMany(
      {},
      { $pull: { followers: userId, following: userId, blockedUsers: userId } }
    );

    // 5. Messages — wipe content of messages they sent, detach them from received ones
    await Message.updateMany(
      { sender: userId },
      {
        $set: {
          sender: placeholderId,
          message: 'This message was deleted',
          fileUrl: '',
          isDeleted: true,
        },
      }
    );
    await Message.updateMany({ receiver: userId }, { $set: { receiver: placeholderId } });
    await Message.updateMany(
      {},
      {
        $pull: {
          readBy: userId,
          deliveredTo: userId,
          favoritedBy: userId,
          reportedBy: userId,
          reactions: { user: userId },
          reports: { user: userId },
        },
      }
    );

    // 6. Channels — leave all channels; hand ownership to placeholder; drop empty channels
    await Channel.updateMany({}, { $pull: { members: userId, pendingInvites: userId } });
    await Channel.updateMany({ createdBy: userId }, { $set: { createdBy: placeholderId } });
    await Channel.deleteMany({ members: { $size: 0 } });

    // 7. Tips — financial records retained for accounting, personal details stripped
    await Tip.updateMany(
      { sender: userId },
      { $set: { sender: null, senderName: 'Deleted user', senderEmail: '', note: '' } }
    );
    await Tip.updateMany({ recipient: userId }, { $set: { recipient: placeholderId } });

    // 8. Job applications submitted with this email, notifications, reset tokens
    await Promise.all([
      user.email ? JobApplication.deleteMany({ email: String(user.email).toLowerCase() }) : Promise.resolve(),
      Notification.deleteMany({ user: userId }),
      Token.deleteMany({ userId }),
    ]);

    // 9. Hosted images (best effort — never blocks deletion)
    const imageUrls = [
      user.profilePicture,
      ...ownBlogs.flatMap((b) => [b.imageUrl, ...(b.images || [])]),
    ].filter(Boolean);
    await Promise.all([...new Set(imageUrls)].map(destroyCloudinaryImage));

    // 10. Audit trail (kept; stores username as plain text so it survives deletion)
    await logAdminAction({
      req,
      actionType: 'ACCOUNT_DELETED',
      targetType: 'User',
      targetId: userId,
      targetLabel: user.username,
      details: {
        storiesDeleted: ownBlogIds.length,
        selfService: true,
      },
    });

    // 11. Finally remove the account itself and end the session
    await User.deleteOne({ _id: userId });
    invalidateAuthUserCache(userId);
    refreshBlogsCache().catch(() => {});

    const io = req.app.get('io');
    if (io) io.in(String(userId)).disconnectSockets(true);

    res.clearCookie('token');
    return res.json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.',
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    // Your account record is removed last, so a failed attempt can be safely retried.
    res.status(500).json({ message: 'Account deletion did not complete. Your account is still active — please try again.' });
  }
};

module.exports = {
  getDeletionPreview,
  deleteMyAccount,
  DELETED_USER_USERNAME,
};
