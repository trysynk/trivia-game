const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name in Arabic is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  nameEn: {
    type: String,
    trim: true,
    maxlength: [50, 'English name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  descriptionEn: {
    type: String,
    trim: true,
    maxlength: [500, 'English description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required']
  },
  iconType: {
    type: String,
    enum: ['emoji', 'icon', 'image'],
    default: 'emoji'
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
    default: '#3B82F6'
  },
  coverImage: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  gamesAvailable: {
    mainGame: { type: Boolean, default: true },
    everyoneAnswers: { type: Boolean, default: true },
    buzzerMode: { type: Boolean, default: true }
  },
  defaultTimeLimit: {
    type: Number,
    min: 10,
    max: 300,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stats: {
    totalQuestions: { type: Number, default: 0 },
    questionsEasy: { type: Number, default: 0 },
    questionsMedium: { type: Number, default: 0 },
    questionsHard: { type: Number, default: 0 },
    timesPlayed: { type: Number, default: 0 },
    averageSuccessRate: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ 'gamesAvailable.mainGame': 1 });
categorySchema.index({ 'gamesAvailable.everyoneAnswers': 1 });
categorySchema.index({ 'gamesAvailable.buzzerMode': 1 });

categorySchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'category'
});

categorySchema.methods.updateStats = async function() {
  const Question = mongoose.model('Question');
  const stats = await Question.aggregate([
    { $match: { category: this._id, status: 'active' } },
    {
      $group: {
        _id: '$difficulty',
        count: { $sum: 1 }
      }
    }
  ]);

  this.stats.questionsEasy = 0;
  this.stats.questionsMedium = 0;
  this.stats.questionsHard = 0;
  this.stats.totalQuestions = 0;

  stats.forEach(s => {
    if (s._id === 'easy') this.stats.questionsEasy = s.count;
    else if (s._id === 'medium') this.stats.questionsMedium = s.count;
    else if (s._id === 'hard') this.stats.questionsHard = s.count;
    this.stats.totalQuestions += s.count;
  });

  await this.save();
};

module.exports = mongoose.model('Category', categorySchema);
