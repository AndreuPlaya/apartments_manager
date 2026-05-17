const Client = require('../models/Client');
const Booking = require('../models/Booking');

// @desc Get all clients
// @route GET /clients
// @access Private
const getAllClients = async (req, res) => {
    const clients = await Client.find().lean();
    if (!clients) {
        return res.status(400).json({ message: 'No clients found' });
    }
    res.json(clients);
}


// @desc Create new client
// @route POST /clients
// @access Private
const createNewClient = async (req, res) => {
    const { identityDocument, name, email, phoneNumber, street, city, country, zipCode, comment } = req.body;
    try {
        // Confirm data
        if (!name) return res.status(400).json({ message: 'Name field is required' });


        // Check for duplicates
        const duplicate = await Client.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec();

        if (duplicate) return res.status(409).json({ message: 'Duplicate client name' });


        const clientObject = { identityDocument, name, email, phoneNumber, street, city, country, zipCode, comment };

        const client = await Client.create(clientObject);

        res.status(201).json({ message: `New client ${name} created` });

    } catch (error) {
        res.status(400).json({ message: `${error}` });
    }
}

// @desc Update a client
// @route PATCH /clients
// @access Private
const updateClient = async (req, res) => {
    const { id, identityDocument, name, email, phoneNumber, street, city, country, zipCode, comment } = req.body;
    try{
    if (!name) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const client = await Client.findById(id).exec();

    if (!client) {
        return res.status(400).json({ message: 'Invalid client data recieved' });
    }

    const duplicate = await Client.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean().exec();
    // Allow update to the original client
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate name' });
    }

    client.identityDocument = identityDocument;
    client.name = name;
    client.email = email;
    client.phoneNumber = phoneNumber;
    client.street = street;
    client.city = city;
    client.country = country;
    client.zipCode = zipCode;
    client.comment = comment;

    const updatedClient = await client.save();
    
    res.status(201).json({ message: `${updatedClient.name} updated`, updatedClient });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }

}

// @desc Delete client
// @route DELETE /clients
// @access Private
const deleteClient = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'Client ID Required' });
    }

    const client = await Client.findById(id).exec();
    if (!client) {
        return res.status(400).json({ message: 'Client not found' });
    }

    const booking = await Booking.findOne({ client: id }).exec();
    if (booking) {
        return res.status(400).json({ message: 'Client has booking assigned' })
    }

    const result = await client.deleteOne();

    const reply = `Clientname ${result.name} with ID ${result._id} deleted`;

    res.json(reply);
}

module.exports = {
    getAllClients,
    createNewClient,
    updateClient,
    deleteClient
};