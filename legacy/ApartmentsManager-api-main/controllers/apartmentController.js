const Apartment = require('../models/Apartment')
const Booking = require('../models/Booking')

// @desc Get all apartments
// @route GET /apartments
// @access Private
const getAllApartments = async (req, res) => {
  const apartments = await Apartment.find()
  if (!apartments?.length) {
    return res.status(400).json({ message: 'No apartments found' })
  }
  res.json(apartments);
}

// @desc Create new apartment
// @route POST /apartments
// @access Private
const createNewApartment = async (req, res) => {
  const { name, address, price, minNights, door, floor, isAvailable, maxGuests, bathrooms, rooms, description } = req.body;

  // Confirm data
  if (!name || !address || !price || !minNights || !door || !floor || !maxGuests || !bathrooms || !rooms) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  // Check for duplicates
  const duplicate = await Apartment.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec()

  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate name' });
  }


  const apartmentObject = { name, address, price, minNights, door, floor, isAvailable, maxGuests, bathrooms, rooms, description };

  // Create and store new apartment
  const apartment = await Apartment.create(apartmentObject);

  if (apartment) { // created 
    res.status(201).json({ message: `New apartment ${name} created` });
  } else {
    res.status(400).json({ message: 'Invalid apartment data recieved' });
  }
}

// @desc Update a apartment
// @route PATCH /apartments
// @access Private
const updateApartment = async (req, res) => {
  const { id, name, address, price, minNights, door, floor, isAvailable, maxGuests, bathrooms, rooms, description } = req.body;
  try {
    // Confirm data
    if (!id || !name || !address || !price  || !minNights || !door || !floor || !maxGuests || !bathrooms || !rooms || typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Does the apartment exist to update?
    const apartment = await Apartment.findById(id).exec()

    if (!apartment) {
      return res.status(400).json({ message: 'Apartment not found' })
    }

    // Check for duplicate 
    const duplicate = await Apartment.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow updates to the original apartment 
    if (duplicate && duplicate?._id.toString() !== id) {
      return res.status(409).json({ message: 'Duplicate name' })
    }

    apartment.name = name
    apartment.address = address
    apartment.price = price
    apartment.door = door
    apartment.floor = floor
    apartment.minNights = minNights
    apartment.isAvailable = isAvailable
    apartment.maxGuests = maxGuests
    apartment.bathrooms = bathrooms
    apartment.rooms = rooms
    apartment.description = description


    const updatedApartment = await apartment.save();

    res.status(201).json({ message: `${updatedApartment.name} updated`, updatedApartment });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }

}

// @desc Delete apartment
// @route DELETE /apartments
// @access Private
const deleteApartment = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Apartment ID Required' });
  }

  const apartment = await Apartment.findById(id).exec();
  if (!apartment) {
    return res.status(400).json({ message: 'Apartment not found' });
  }
  const booking = await Booking.findOne({ apartment: id }).exec();
  if (booking) {
    return res.status(400).json({ message: 'Apartment has booking assigned' })
  }

  const result = await apartment.deleteOne();

  const reply = `Name ${result.name} with ID ${result._id} deleted`

  res.json(reply);
}

module.exports = {
  getAllApartments,
  createNewApartment,
  updateApartment,
  deleteApartment
};