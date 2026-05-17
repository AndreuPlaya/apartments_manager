const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    identityDocument: {
      type: String,
      uppercase: true,
      match: /^[A-Za-z0-9]{3,20}$/,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      match: /^[\p{L}\p{M}\s\d]{3,40}$/u
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    },
    phoneNumber: {
      type: String,
      match: /^\+?\d{1,3}(?:[\s-]?\d{1,3}){2,}$/
    },
    street: {
      type: String,
      match: /^[\p{L}\p{M}\d\s,-]{3,}$/u
    },
    city: {
      type: String,
      match: /^[\p{L}\p{M}\s]{3,}$/u
    },
    country: {
      type: String,
      match: /^[\p{L}\p{M}\s]{2,}$/u
    },
    zipCode: {
      type: String,
      match: /^\d{5}(?:[-\s]\d{4})?$/
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.virtual('address').get(function () {
  const { street, city, country, zipCode } = this;
  const addressParts = [];

  if (street) {
    addressParts.push(street);
  }
  if (city) {
    addressParts.push(city);
  }
  if (country) {
    addressParts.push(country);
  }
  if (zipCode) {
    addressParts.push(zipCode);
  }

  return addressParts.join(', ');
});

module.exports = mongoose.model('Client', clientSchema);
