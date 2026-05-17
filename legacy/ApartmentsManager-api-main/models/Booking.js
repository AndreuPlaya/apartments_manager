const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    adultCount: {
      type: Number,
      min: 1,
      required: true,
    },
    childrenCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      default: "NotPaid",
    },
    totalAmmountDue: {
      type: Number,
      min: 0,
      default: 0,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to strip time from date
function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Date validation
bookingSchema.methods.validateBookingDates = async function () {
  const Apartment = mongoose.model('Apartment');
  const Booking = mongoose.model('Booking');

  // Check if the selected apartment is available
  const apartment = await Apartment.findById(this.apartment).exec();
  if (!apartment || !apartment.isAvailable) {
    throw new Error('The selected apartment is not available.');
  }

  // Check that checkout is greater than check-in + apartment minNights
  const minNights = apartment.minNights || 1;
  const minCheckOutDate = new Date(this.fromDate.getFullYear(), this.fromDate.getMonth(), this.fromDate.getDate() + minNights);

  if (minCheckOutDate.getTime() > this.toDate.getTime()) {
    throw new Error(`The minimum number of nights required for this apartment is ${minNights}.`);
  }

  // Remove time component from the Date objects
  const fromDate = stripTime(this.fromDate);
  const toDate = stripTime(this.toDate);

  // Check for overlapping bookings
  const overlappingBooking = await Booking.findOne({
    _id: { $ne: this._id },
    apartment: this.apartment,
    fromDate: { $lt: toDate },
    toDate: { $gt: fromDate },
  })
    .populate('client')
    .exec();

  if (overlappingBooking) {
    const overlappingFromDate = stripTime(overlappingBooking.fromDate);
    const overlappingToDate = stripTime(overlappingBooking.toDate);

    const overlappingBookingClientName = overlappingBooking.client ? overlappingBooking.client.name : 'Unknown';
    if (fromDate.getTime() < overlappingFromDate.getTime() && toDate.getTime() > overlappingFromDate.getTime()) {
      throw new Error(
        `Checkout date ${toDate} overlaps with an existing booking of ${overlappingBookingClientName}.`
      );
    }
    if (toDate.getTime() > overlappingToDate.getTime() && fromDate.getTime() < overlappingToDate.getTime()) {
      throw new Error(
        `Checkin date ${fromDate} overlaps with an existing booking of ${overlappingBookingClientName}.`
      );
    }
  }
};

// Pre-save hook
bookingSchema.pre('save', async function (next) {
  try {
    // Strip the time component from fromDate and toDate
    this.fromDate = stripTime(this.fromDate);
    this.toDate = stripTime(this.toDate);

    await this.validateBookingDates();
    next();
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
