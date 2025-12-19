const Channel = require('../Models/Channel');


const createChannel = async (req, res) => {
  const { name } = req.body;
  try {
    const channel = new Channel({
      name,
      createdBy: req.user._id,
      members: [req.user._id]
    });
    await channel.save();
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
    channel.members.addToSet(req.user._id);
    await channel.save();
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
    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('members', '_id username');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = { createChannel, getChannels, joinChannel, leaveChannel, getChannel };