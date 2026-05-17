const express = require('express');
const router = express.Router();
const channelsController = require('../controllers/channelController');
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
  .get(channelsController.getAllChannels)
  .post(channelsController.createNewChannel)
  .patch(channelsController.updateChannel)
  .delete(channelsController.deleteChannel);
  
module.exports = router;