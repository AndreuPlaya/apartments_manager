const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const conceptSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    vatPercentage: {
      type: Number,
      required: true,
    },
  }
);

const invoiceSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    concepts: [conceptSchema],
  },
  {
    timestamps: true,
  }
);

// Define the virtual property for concept totals
conceptSchema.virtual('totalWithoutVAT').get(function () {
  return (this.price * this.quantity).toFixed(2);
});

conceptSchema.virtual('totalVAT').get(function () {
  return ((this.price * this.quantity * this.vatPercentage) / 100).toFixed(2);
});

conceptSchema.virtual('totalWithVAT').get(function () {
  return (parseFloat(this.totalWithoutVAT) + parseFloat(this.totalVAT)).toFixed(2);
});

// Define the virtual property for the invoice totals
invoiceSchema.virtual('totalAmountWithoutVAT').get(function () {
  let totalWithoutVAT = 0;
  if (this.concepts && this.concepts.length > 0) {
    for (const concept of this.concepts) {
      totalWithoutVAT += parseFloat(concept.totalWithoutVAT);
    }
  }
  return totalWithoutVAT.toFixed(2);
});

invoiceSchema.virtual('totalVAT').get(function () {
  let totalVAT = 0;
  if (this.concepts && this.concepts.length > 0) {
    for (const concept of this.concepts) {
      totalVAT += parseFloat(concept.totalVAT);
    }
  }
  return totalVAT.toFixed(2);
});

invoiceSchema.virtual('totalAmountWithVAT').get(function () {
  let totalWithVAT = 0;
  if (this.concepts && this.concepts.length > 0) {
    for (const concept of this.concepts) {
      totalWithVAT += parseFloat(concept.totalWithVAT);
    }
  }
  return totalWithVAT.toFixed(2);
});

invoiceSchema.plugin(AutoIncrement, {
  inc_field: 'invoice-id',
  id: 'invoiceNums',
  start_seq: 500,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
