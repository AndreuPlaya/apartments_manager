const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
  .get(propertyController.getAllProperties)
  .post(propertyController.createNewProperty)
  .patch(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;
