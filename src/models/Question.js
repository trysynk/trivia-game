const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty is required']
  },
  points: {
    type: Number
  },
  questionType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'blurred_image', 'two_images', 'emoji'],
    required: [true, 'Question type is required']
  },
  questionContent: {
    text: String,
    mediaUrl: String,
    mediaUrl2: String,
    emojis: [String]
  },
  answerType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video'],
    required: [true, 'Answer type is required']
  },
  answerContent: {
    text: String,
    mediaUrl: String
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  timesPlayed: {
    type: Number,
    default: 0
  },
  timesCorrect: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

questionSchema.pre('save', function() {
  const pointsMap = { easy: 200, medium: 400, hard: 600 };
  this.points = pointsMap[this.difficulty];
});

questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ timesPlayed: 1 });

module.exports = mongoose.model('Question', questionSchema);
