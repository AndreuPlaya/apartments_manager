const Apartment = require('../models/Apartment')
const Channel = require('../models/Channel')
const Calendar = require('../models/Calendar')

// @desc Get all calendars
// @route GET /calendars
// @access Private
// @desc Get all calendars
// @route GET /calendars
// @access Private
const getAllCalendars = async (req, res, next) => {
  const calendars = await Calendar.find()
    .populate("apartment")
    .populate("channel")
    .lean()
    .exec();

  if (!calendars || calendars.length === 0) {
    return res.status(404).json({ message: "No calendars found" });
  }

  res.json(calendars);
};


// @desc Create new calendar
// @route POST /calendars
// @access Private
const createNewCalendar = async (req, res) => {
  const { apartmentId, channelId, url } = req.body;
  // Confirm data
  if (!apartmentId || !channelId || !url ) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const apartment = await Apartment.findById(apartmentId).exec();

  if (!apartment) {
    return res.status(400).json({ message: 'Invalid apartment data recieved' });
  }
  const channel = await Channel.findById(channelId).exec();

  if (!channel) {
    return res.status(400).json({ message: 'Invalid channel data recieved' });
  }
  

  const calendarObject = {
    apartment: apartment,
    channel: channel,
    url
  }

  const calendar = await Calendar.create(calendarObject);

  if (!calendar) {
    return res.status(400).json({ message: 'Invalid calendar data recieved' });
  }

  res.status(201).json({ message: `New calendar for client ${calendar.client.name} created` })
}

// @desc Update a calendar
// @route PATCH /calendarss
// @access Private
const updateCalendar = async (req, res) => {
  const { id, apartmentId, channelId, url } = req.body;
  if (!id || !apartmentId  || !channelId || !url ) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const calendar = await Calendar.findById(id)
    .exec();

  if (!calendar) {
    return res.status(400).json({ message: 'Invalid calendar data recieved' });
  }

  const apartment = await Apartment.findById(apartmentId).exec();

  if (!apartment) {
    return res.status(400).json({ message: 'Invalid apartment data recieved' });
  }
  const channel = await Channel.findById(channelId).exec();

  if (!channel) {
    return res.status(400).json({ message: 'Invalid channel data recieved' });
  }
  

  calendar.apartment = apartment;
  calendar.channel = channel;
  calendar.url = url;

  const updatedCalendar = await calendar.save();
  res.json({ message: `Calendar of apartment ${updatedCalendar.apartment.name} and channel ${updatedCalendar.channel.name} updated` });
};

const deleteCalendar = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Calendar ID Required' });
  }

  const calendar = await Calendar.findById(id)
    .populate('apartment')
    .populate('channel')
    .exec();

  if (!calendar) {
    return res.status(400).json({ message: 'Calendar not found' });
  }

  const result = await calendar.deleteOne();

  const reply = `Calendar with ID ${result._id} from apartment ${updatedCalendar.apartment.name} and channel ${updatedCalendar.channel.name} deleted`;

  res.json(reply);
};

module.exports = {
  getAllCalendars,
  createNewCalendar,
  updateCalendar,
  deleteCalendar
};
