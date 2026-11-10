const Channel = require('../Models/Channel');
const Notification = require('../Models/Notification');

const createChannel = async (req, res) => {
  const { name, memberIds = [] } = req.body;
  try {
    const creatorId = req.user._id.toString();
    const pendingInvites = Array.from(
      new Set(
        memberIds
          .map((id) => id.toString())
          .filter((id) => id && id !== creatorId)
      )
    );

    const channel = new Channel({
      name,
      createdBy: req.user._id,
      members: [req.user._id],
      pendingInvites,
    });
    await channel.save();

    if (pendingInvites.length > 0) {
      await Promise.all(
        pendingInvites.map((invitedUserId) =>
          Notification.create({
            user: invitedUserId,
            message: `${req.user.username} invited you to join channel #${channel.name}`,
          }).catch(() => null)
        )
      );

      const io = req.app.get('io');
      if (io) {
        pendingInvites.forEach((invitedUserId) => {
          io.to(invitedUserId).emit('channelUpdated', channel);
        });
      }
    }

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find({}).select('-__v');
    res.json(channels);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const joinChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    channel.pendingInvites = (channel.pendingInvites || []).filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    channel.members.addToSet(req.user._id);
    await channel.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('channelUpdated', channel);
    }

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const leaveChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    channel.members.pull(req.user._id);
    await channel.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('channelUpdated', channel);
    }

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const inviteToChannel = async (req, res) => {
  try {
    const { userIds = [], userId } = req.body;
    const idsToInvite = userId ? [userId] : userIds;
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    const isCreator =
      String(channel.createdBy) === String(req.user._id) ||
      (!channel.createdBy && String(channel.members?.[0]) === String(req.user._id));
    if (!isCreator) {
      return res.status(403).json({ message: 'Only the channel creator can invite users' });
    }

    if (!channel.pendingInvites) {
      channel.pendingInvites = [];
    }

    const newlyInvited = [];
    idsToInvite.forEach((id) => {
      if (!id) return;
      const strId = id.toString();
      const alreadyMember = channel.members.some((m) => m.toString() === strId);
      const alreadyPending = channel.pendingInvites.some((p) => p.toString() === strId);
      if (!alreadyMember && !alreadyPending) {
        channel.pendingInvites.addToSet(id);
        newlyInvited.push(strId);
      }
    });

    await channel.save();

    if (newlyInvited.length > 0) {
      await Promise.all(
        newlyInvited.map((invitedUserId) =>
          Notification.create({
            user: invitedUserId,
            message: `${req.user.username} invited you to join channel #${channel.name}`,
          }).catch(() => null)
        )
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('channelUpdated', channel);
    }

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const acceptChannelInvite = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    channel.pendingInvites = (channel.pendingInvites || []).filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    channel.members.addToSet(req.user._id);
    await channel.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('channelUpdated', channel);
    }

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const declineChannelInvite = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    channel.pendingInvites = (channel.pendingInvites || []).filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await channel.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('channelUpdated', channel);
    }

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate(
      'members',
      '_id username profilePicture'
    );
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  createChannel,
  getChannels,
  joinChannel,
  leaveChannel,
  inviteToChannel,
  acceptChannelInvite,
  declineChannelInvite,
  getChannel,
};
