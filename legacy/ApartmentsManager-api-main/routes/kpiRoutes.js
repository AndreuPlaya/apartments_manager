const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router.route('/metrics').get(metricsController.getMetrics);

module.exports = router;