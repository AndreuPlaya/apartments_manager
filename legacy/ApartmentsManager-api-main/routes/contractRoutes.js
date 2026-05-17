const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
  .get(contractController.getAllContracts)
  .post(contractController.createNewContract)
  .patch(contractController.updateContract)
  .delete(contractController.deleteContract);

module.exports = router;
