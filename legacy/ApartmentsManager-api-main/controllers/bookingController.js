const Booking = require('../models/Booking')
const Apartment = require('../models/Apartment')
const Channel = require('../models/Channel')
const Client = require('../models/Client')

// @desc Get all bookings
// @route GET /bookings
// @access Private
const getAllBookings = async (req, res, next) => {
  const bookings = await Booking.find()
    .populate("apartment")
    .populate("channel")
    .populate("client")
    .lean()
    .exec();

  if (!bookings || bookings.length === 0) {
    return res.status(404).json({ message: "No bookings found" });
  }

  res.json(bookings);
};


// @desc Create new booking
// @route POST /bookings
// @access Private
const createNewBooking = async (req, res) => {
  const { apartmentId, channelId, clientId, clientName, email, phoneNumber, identityDocument, adultCount, childrenCount, fromDate, toDate, totalAmmountDue, comment } = req.body;

  try {
    let client;
    // If client ID is not provided, create a new client
    if (!clientId) {
      // Validate required client data
      if (!clientName) {
        return res.status(400).json({ message: 'Client name required' });
      }

      // Create the client using the createNewClient function
      const clientObject = { 
        name: clientName,
        email,
        phoneNumber,
        identityDocument
      };
      client = await Client.create(clientObject);
      if (!client) {
        return res.status(400).json({ message: 'Failed to create a new client' });
      }
    } else {
      // Retrieve the existing client
      client = await Client.findById(clientId).exec();
      if (!client) {
        return res.status(400).json({ message: 'Invalid client data received' });
      }
    }

    const apartment = await Apartment.findById(apartmentId).exec();
    if (!apartment) {
      return res.status(400).json({ message: 'Invalid apartment data received' });
    }

    const channel = await Channel.findById(channelId).exec();
    if (!channel) {
      return res.status(400).json({ message: 'Invalid channel data received' });
    }

    const bookingObject = {
      apartment: apartment._id,
      client: client._id,
      channel: channel._id,
      adultCount,
      childrenCount,
      fromDate,
      toDate,
      totalAmmountDue,
      comment,
    };

    const booking = await Booking.create(bookingObject);

    res.status(201).json({ message: `New booking for client ${client.name} created`, booking });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

// @desc Update a booking
// @route PATCH /bookings
// @access Private
const updateBooking = async (req, res) => {
  const { id, apartmentId, clientId, channelId, adultCount, childrenCount, fromDate, toDate, totalAmmountDue, comment } = req.body;
  try {
    if (!id || !apartmentId || !clientId || !channelId || !fromDate || !toDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const booking = await Booking.findById(id)
      .exec();

    if (!booking) {
      return res.status(400).json({ message: 'Invalid booking data recieved' });
    }

    const apartment = await Apartment.findById(apartmentId).exec();

    if (!apartment) {
      return res.status(400).json({ message: 'Invalid apartment data recieved' });
    }
    const channel = await Channel.findById(channelId).exec();

    if (!channel) {
      return res.status(400).json({ message: 'Invalid channel data recieved' });
    }
    const client = await Client.findById(clientId).exec();

    if (!client) {
      return res.status(400).json({ message: 'Invalid client data recieved' });
    }

    booking.apartment = apartment
    booking.client = client
    booking.channel = channel
    booking.fromDate = fromDate
    booking.adultCount = adultCount
    booking.childrenCount = childrenCount
    booking.toDate = toDate
    booking.totalAmmountDue = totalAmmountDue
    booking.comment = comment

    const updatedBooking = await booking.save();
    res.status(201).json({ message: `Booking of client ${updatedBooking.client.name} updated`, updatedBooking });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

// @desc Update a booking
// @route PATCH /bookings
// @access Private
const deleteBooking = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Booking ID Required' });
  }

  const booking = await Booking.findById(id)
    .populate('apartment')
    .populate('channel')
    .populate('client')
    .exec();

  if (!booking) {
    return res.status(400).json({ message: 'Booking not found' });
  }

  const result = await booking.deleteOne();

  const reply = `Booking with ID ${result._id} from ${booking.client.name} deleted`;

  res.json(reply);
};


// @desc Check availability of apartments
// @route POST /bookings/checkAvailability
// @access Public
const checkAvailability = async (req, res) => {
  const { checkinDate, checkoutDate } = req.body;
  try {
    // Validate input
    if (!checkinDate || !checkoutDate) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const checkin = new Date(checkinDate)
    const checkout = new Date(checkoutDate)
    const nights = new Date(checkout - checkin).getDate() - 1
    // Find available apartments based on the date range
    const availableApartments = await Apartment.find({
      isAvailable: true,
    }).exec();

    const filteredApartments = await Promise.all(
      availableApartments.map(async (apartment) => {
        const isAvailable = await Apartment.isAvailableBetweenDates(apartment._id, checkin, checkout);
        if (!isAvailable) return null
        const bookingObject = {
          name: apartment.name,
          price: apartment.price,
          rooms: apartment.rooms,
          bathrooms: apartment.bathrooms,
          maxGuests: apartment.maxGuests,
          from: checkin,
          to: checkout,
          nights: nights,
          total: nights * apartment.price,
          description: apartment.description
        };
        return bookingObject
      })
    );

    // Remove null values from the array (apartments that are not available)
    const finalAvailableApartments = filteredApartments.filter((apartment) => apartment !== null);

    res.json(finalAvailableApartments);
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

module.exports = {
  getAllBookings,
  createNewBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
};
