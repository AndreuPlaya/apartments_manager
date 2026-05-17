const allowedOrigins = require('./allowedOrigins');

const corsOptions = {
  origin: (origin, callback) => {
    const isOriginAllowed =
      process.env.NODE_ENV === 'development'
        ? allowedOrigins.includes(origin) || !origin
        : allowedOrigins.includes(origin);

    if (isOriginAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;