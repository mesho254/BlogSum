/**
 * Evaluates achievement badges for an author based on metrics and milestones
 */
function evaluateUserBadges(user, blogs = []) {
  const badges = [];
  if (!user) return badges;

  const published = (blogs || []).filter((b) => b && b.status !== 'draft');
  const postCount = published.length;
  const totalLikes = published.reduce(
    (sum, b) => sum + (Array.isArray(b.likes) ? b.likes.length : 0),
    0
  );
  const totalComments = published.reduce(
    (sum, b) => sum + (Array.isArray(b.comments) ? b.comments.length : 0),
    0
  );
  const followerCount = Array.isArray(user.followers) ? user.followers.length : 0;

  if (user.isVerified) {
    badges.push({
      key: 'verified_writer',
      label: 'Verified Writer',
      description: 'Official verified voice on BlogSum',
      icon: 'CheckCircleFilled',
      color: '#2563eb',
      bg: '#eff6ff',
    });
  }

  if (postCount >= 3) {
    badges.push({
      key: 'prolific_creator',
      label: 'Prolific Creator',
      description: 'Published multiple acclaimed stories',
      icon: 'RocketOutlined',
      color: '#7c3aed',
      bg: '#f5f3ff',
    });
  }

  if (totalLikes >= 5 || followerCount >= 2) {
    badges.push({
      key: 'trending_author',
      label: 'Trending Author',
      description: 'High readership engagement across published essays',
      icon: 'FireOutlined',
      color: '#ea580c',
      bg: '#fff7ed',
    });
  }

  if (totalComments >= 3) {
    badges.push({
      key: 'conversation_starter',
      label: 'Conversation Starter',
      description: 'Sparks vibrant community debates and discussion',
      icon: 'CommentOutlined',
      color: '#059669',
      bg: '#ecfdf5',
    });
  }

  // Early contributor badge
  badges.push({
    key: 'founding_author',
    label: 'Founding Author',
    description: 'Active contributor to the BlogSum ecosystem',
    icon: 'CrownOutlined',
    color: '#d97706',
    bg: '#fffbeb',
  });

  return badges;
}

module.exports = {
  evaluateUserBadges,
};

