const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // PayPal Transaction
  paypalOrderId: {
    type: String,
    required: true,
    unique: true
  },
  paypalPayerId: String,
  paypalPaymentId: String,

  // Package Details
  package: {
    games: { type: Number, required: true },
    label: { type: String, required: true },
    priceKWD: { type: Number, required: true }
  },

  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KWD'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  // Metadata
  ipAddress: String,
  userAgent: String,

  completedAt: Date,
  refundedAt: Date,
  refundReason: String
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ paypalOrderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
