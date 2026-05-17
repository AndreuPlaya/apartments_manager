const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        roles: {
            type: [String],
            default: ["Guest"]
        },
        email: {
          type: String,
          match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        active: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);