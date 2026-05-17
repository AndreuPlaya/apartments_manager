const rateLimit = require('express-rate-limit');
const { logEvents } = require('./logger');

// Create a rate limiter for checkAvailability endpoint
const availabilityLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per `window` per minute (you can adjust this value)
    message: { message: 'Too many requests from this IP, please try again after a 60-second pause' },
    handler: (req, res, next, options) => {
        logEvents(`Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log');
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = availabilityLimiter