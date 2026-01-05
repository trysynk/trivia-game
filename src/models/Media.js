const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'audio', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  duration: Number,
  thumbnailUrl: String,
  usedInQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  usageCount: { type: Number, default: 0 },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  tags: [String]
}, {
  timestamps: true
});

mediaSchema.index({ type: 1 });
mediaSchema.index({ filename: 1 });

module.exports = mongoose.model('Media', mediaSchema);
