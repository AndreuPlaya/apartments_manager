const Property = require('../models/Property')
const Contract = require('../models/Contract')

// @desc Get all properties
// @route GET /properties
// @access Private
const getAllProperties = async (req, res) => {
  const properties = await Property.find()
  if (!properties?.length) {
    return res.status(400).json({ message: 'No properties found' })
  }
  res.json(properties);
}

// @desc Create new property
// @route POST /properties
// @access Private
const createNewProperty = async (req, res) => {
  const { name, address, city, floor, door, rentalType, comment } = req.body;
  try {
    // Confirm data
    if (!name) return res.status(400).json({ message: 'Name is required' })
    if (!address) return res.status(400).json({ message: 'All fields are required' })
    if (!rentalType) return res.status(400).json({ message: 'Rental type is required required' })
    

    // Check for duplicates
    const duplicate = await Property.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate name' });
    }

    const propertyObject = {  name, address, city, floor, door, rentalType, comment };

    // Create and store new property
    const property = await Property.create(propertyObject);

    res.status(201).json({ message: `New property ${name} created`, property });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
}

// @desc Update a property
// @route PATCH /properties
// @access Private
const updateProperty = async (req, res) => {
  const { id,  name, address, city, floor, door, isAvailable, rentalType, comment } = req.body;
  try {
    // Confirm data
    if (!id || !name || !address || typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Confirm data
    if (!id) return res.status(400).json({ message: 'ID is required' })
    if (!name) return res.status(400).json({ message: 'Name is required' })
    if (!address) return res.status(400).json({ message: 'All fields are required' })
    if (!rentalType) return res.status(400).json({ message: 'Rental type is required required' })
    // Does the property exist to update?
    const property = await Property.findById(id).exec()

    if (!property) {
      return res.status(400).json({ message: 'Property not found' })
    }

    // Check for duplicate 
    const duplicate = await Property.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow updates to the original property 
    if (duplicate && duplicate?._id.toString() !== id) {
      return res.status(409).json({ message: 'Duplicate name' })
    }

    property.name = name
    property.address = address
    property.city = city
    property.door = door
    property.floor = floor
    property.isAvailable = isAvailable
    property.rentalType = rentalType
    property.comment = comment


    const updatedProperty = await property.save();

    res.status(201).json({ message: `${updatedProperty.name} updated`, updatedProperty });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }

}

// @desc Delete property
// @route DELETE /properties
// @access Private
const deleteProperty = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Property ID Required' });
  }

  const property = await Property.findById(id).exec();
  if (!property) {
    return res.status(400).json({ message: 'Property not found' });
  }
  const contract = await Contract.findOne({ property: id }).exec();
  if (contract) {
    return res.status(400).json({ message: 'Property has contract assigned' })
  }

  const result = await property.deleteOne();

  const reply = `Name ${result.name} with ID ${result._id} deleted`

  res.json(reply);
}

module.exports = {
  getAllProperties,
  createNewProperty,
  updateProperty,
  deleteProperty
};