const express = require('express')
const router = express.Router()
const calendarController = require('../controllers/calendarController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
  .get(calendarController.getAllCalendars)
  .post(calendarController.createNewCalendar)
  .patch(calendarController.updateCalendar)
  .delete(calendarController.deleteCalendar);

module.exports = router;
