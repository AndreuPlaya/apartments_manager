const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map(item => item.trim())

module.exports = allowedOrigins