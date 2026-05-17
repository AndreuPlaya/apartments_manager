const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    minNights: {
      type: Number,
      min: 0,
      default: 2,
    },
    door: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    maxGuests: {
      type: Number,
      min: 1,
      default: 2,
      required: true,
    },
    bathrooms: {
      type: Number,
      min: 1,
      default: 2,
      required: true,
    },
    rooms: {
      type: Number,
      min: 1,
      default: 2,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
);

apartmentSchema.virtual('fullAddress').get(function () {

  const addressParts = [];

  addressParts.push(this.address);

  if (this.floor) {
    addressParts.push(this.floor);
  }
  if (this.door) {
    addressParts.push(this.door);
  }
  
  return addressParts.join(' ');
});

apartmentSchema.statics.isAvailableBetweenDates = async function (apartmentId, startDate, endDate) {
  const fromSelectedDate = new Date(startDate);
  const toSelectedDate = new Date(endDate);
  const bookings = await mongoose.model('Booking').find({
    apartment: apartmentId,

    $or: [
      {
        fromDate: { $gte: fromSelectedDate, $lte: toSelectedDate },
      },
      {
        toDate: { $gte: fromSelectedDate, $lte: toSelectedDate },
      },
      {
        $and: [
          { fromDate: { $lt: fromSelectedDate } },
          { toDate: { $gt: toSelectedDate } },
        ],
      },
    ]
  });
  return bookings.length === 0;
};

module.exports = mongoose.model('Apartment', apartmentSchema);