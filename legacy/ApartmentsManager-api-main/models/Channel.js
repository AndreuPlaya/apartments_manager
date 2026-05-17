const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      commissionRate: {
        type: Number,
        min: 0,
        required: true,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );
  
  module.exports = mongoose.model('Channel', channelSchema);