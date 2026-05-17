const Channel = require('../models/Channel');
const Booking = require('../models/Booking');

// @desc Get all channels
// @route GET /channels
// @access Private
const getAllChannels = async (req, res) => {
  const channels = await Channel.find().lean()
  if (!channels?.length) {
    return res.status(400).json({ message: 'No channels found' });
  }
  res.json(channels);
}

// @desc Create new channel
// @route POST /channels
// @access Private
const createNewChannel = async (req, res) => {
  const { name,commissionRate } = req.body;

  // Confirm data
  if (!name ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check for duplicates
  const duplicate = await Channel.findOne({ name }).collation({locale: 'en', strength: 2}).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate name' });
  }


  const channelObject = { name,commissionRate };

  // Create and store new channel
  const channel = await Channel.create(channelObject);

  if (channel) { // created 
    res.status(201).json({ message: `New channel ${name} created` });
  } else {
    res.status(400).json({ message: 'Invalid channel data recieved' });
  }
}

// @desc Update a channel
// @route PATCH /channels
// @access Private
const updateChannel = async (req, res) => {
  const {id, name,commissionRate  } = req.body;

  // Confirm data
  if (!id || !name || !commissionRate) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Does the channel exist to update?
  const channel = await Channel.findById(id).exec()

  if (!channel) {
      return res.status(400).json({ message: 'Channel not found' })
  }

  // Check for duplicate 
  const duplicate = await Channel.findOne({ name }).collation({locale: 'en', strength: 2}).lean().exec()

  // Allow updates to the original channel 
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate name' })
  }

  channel.name = name
  channel.commissionRate = commissionRate


  const updatedChannel = await channel.save();

  res.json({ message: `${updatedChannel.name} updated` })

}

// @desc Delete channel
// @route DELETE /channels
// @access Private
const deleteChannel = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Channel ID Required' });
  }

  const channel = await Channel.findById(id).exec();
  if (!channel) {
    return res.status(400).json({ message: 'Channel not found' });
  }
  const booking = await Booking.findOne({channel: id}).exec();
  if (booking) {
      return res.status(400).json({ message: 'Channel has booking assigned' })
  }

  const result = await channel.deleteOne();

  const reply = `Name ${result.name} with ID ${result._id} deleted`;

  res.json(reply);
}

module.exports = {
  getAllChannels,
  createNewChannel,
  updateChannel,
  deleteChannel
};