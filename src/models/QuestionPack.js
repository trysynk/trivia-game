const mongoose = require('mongoose');

const questionPackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pack name is required'],
    trim: true,
    maxlength: [100, 'Pack name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  coverImage: String,
  color: String,
  icon: String,
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: { type: Number, default: 0 }
  }],
  shuffleQuestions: { type: Boolean, default: true },
  smartFilters: {
    isSmartPack: { type: Boolean, default: false },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    difficulties: [String],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    minQuestions: Number,
    maxQuestions: Number
  },
  gamesAvailable: {
    mainGame: { type: Boolean, default: true },
    everyoneAnswers: { type: Boolean, default: true },
    buzzerMode: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: false },
  stats: {
    timesUsed: { type: Number, default: 0 },
    lastUsedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

questionPackSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

questionPackSchema.set('toJSON', { virtuals: true });
questionPackSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('QuestionPack', questionPackSchema);
