const Invoice = require('../models/Invoice');
const Client = require('../models/Client');

const getAllInvoices = async (req, res) => {
  const invoices = await Invoice.find()
    .populate("client")
    .lean()
    .exec();

  if (!invoices || invoices.length === 0) {
    return res.status(404).json({ message: "No invoices found" });
  }

  res.json(invoices);
};

const createInvoice = async (req, res) => {
  const { clientId, dueDate, isPaid, concepts } = req.body;

  try {

    const client = await Client.findById(clientId).exec();
    if (!client) {
      return res.status(400).json({ message: 'Invalid client data received' });
    }
    const invoiceObject = {
      clientId,
      dueDate,
      isPaid,
      concepts,
    };
    const invoice = await Invoice.create(invoiceObject)
    res.status(201).json({ message: `New invoice for client ${client.name} created`, invoice });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

const updateInvoice = async (req, res) => {
  const { id, clientId, dueDate, isPaid, concepts } = req.body;

  try {
    if (!id || !clientId || !dueDate || !isPaid || !concepts) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invalid invoice data recieved' });
    }
    const client = await Client.findById(clientId).exec();

    if (!client) {
      return res.status(400).json({ message: 'Invalid client data recieved' });
    }

    invoice.client = client;
    invoice.dueDate = dueDate;
    invoice.isPaid = isPaid;
    invoice.concepts = concepts;

    await invoice.save();

    const updatedInvoice = await invoice.save();
    res.status(201).json({ message: `Invoice of client ${updatedInvoice.client.name} updated`, updatedInvoice });
  } catch (error) {
    res.status(400).json({ message: `${error}` });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Invoice ID Required' });
  }

  const invoice = await Invoice.findById(id)
    .populate('client')
    .exec();

  if (!invoice) {
    return res.status(400).json({ message: 'Invoice not found' });
  }

  const result = await invoice.deleteOne();

  const reply = `Invoice with ID ${result._id} from ${invoice.client.name} deleted`;

  res.json(reply);
};

module.exports = {
  getAllInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
