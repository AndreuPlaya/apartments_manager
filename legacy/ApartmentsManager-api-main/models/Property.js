const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
    },
    floor: {
      type: String,
    },
    door: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rentalType: {
      type: String,
      enum: ['short-term', 'long-term', 'room'],
      required: true,
      default: 'short-term'
    },
    comment: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
);
propertySchema.virtual('fullName').get(function () {

  const addressParts = [];

  addressParts.push(this.name);

  addressParts.push(this.address);

  if (this.floor) {
    addressParts.push(this.floor);
  }
  if (this.door) {
    addressParts.push(this.door);
  }
  
  return addressParts.join(' ');
});


module.exports = mongoose.model('Property', propertySchema);