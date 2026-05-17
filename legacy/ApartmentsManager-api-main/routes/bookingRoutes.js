const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')
const verifyJWT = require('../middleware/verifyJWT')
const availabilityLimiter = require('../middleware/availabilityLimiter')

router.post('/checkAvailability',availabilityLimiter, bookingController.checkAvailability);

router.use(verifyJWT)

router.route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createNewBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
