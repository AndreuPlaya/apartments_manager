const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema(
    {
        apartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Apartment',
            required: true,
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Calendar', calendarSchema);