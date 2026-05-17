const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartmentController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
  .get(apartmentController.getAllApartments)
  .post(apartmentController.createNewApartment)
  .patch(apartmentController.updateApartment)
  .delete(apartmentController.deleteApartment);

module.exports = router;
