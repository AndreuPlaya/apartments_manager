const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
  .get(invoiceController.getAllInvoices)
  .post(invoiceController.createInvoice)
  .patch(invoiceController.updateInvoice)
  .delete(invoiceController.deleteInvoice);


module.exports = router;
