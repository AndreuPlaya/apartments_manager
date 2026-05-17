const Contract = require('../models/Contract');
const Property = require('../models/Property');
const Client = require('../models/Client');

const getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('property')
      .populate('client')
      .exec();

    if (!contracts || contracts.length === 0) {
      return res.status(404).json({ message: 'No contracts found' });
    }

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

const createNewContract = async (req, res) => {
  const { propertyId, clientId, clientName, fromDate, toDate, monthlyRent, comment } = req.body;

  try {
    let client;
    // If client ID is not provided, create a new client
    if (!clientId) {
      // Validate required client data
      if (!clientName) {
        return res.status(400).json({ message: 'Client name required' });
      }

      // Create the client using the createNewClient function
      const clientObject = { name: clientName };
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

    const property = await Property.findById(propertyId).exec();
    if (!property) {
      return res.status(400).json({ message: 'Invalid property data received' });
    }


    const contractObject = {
      property: property._id,
      client: client._id,
      fromDate,
      toDate,
      monthlyRent,
      comment,
    };

    const contract = await Contract.create(contractObject);

    res.status(201).json({ message: `New contract for client ${client.name} created`, contract });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

const updateContract = async (req, res) => {
  const { id, propertyId, clientId, fromDate, toDate, monthlyRent, comment } = req.body;

  try {
    if (!id || !propertyId || !clientId || !fromDate || !toDate || !monthlyRent) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const contract = await Contract.findById(id).exec();

    if (!contract) {
      return res.status(400).json({ message: 'Invalid contract data received' });
    }

    const property = await Property.findById(propertyId).exec();

    if (!property) {
      return res.status(400).json({ message: 'Invalid property data received' });
    }

    const client = await Client.findById(clientId).exec();

    if (!client) {
      return res.status(400).json({ message: 'Invalid client data received' });
    }

    contract.property = property;
    contract.client = client;
    contract.fromDate = fromDate;
    contract.toDate = toDate;
    contract.monthlyRent = monthlyRent;
    contract.comment = comment;

    const updatedContract = await contract.save();
    res.status(201).json({ message: 'Contract updated', updatedContract });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

const deleteContract = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Contract ID required' });
  }

  const contract = await Contract.findById(id)
    .populate('property')
    .populate('client')
    .exec();

  if (!contract) {
    return res.status(400).json({ message: 'Contract not found' });
  }

  const result = await contract.deleteOne();
  const reply = `Contract with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllContracts,
  createNewContract,
  updateContract,
  deleteContract,
};
