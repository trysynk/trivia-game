const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const questionSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    default: () => nanoid()
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be easy, medium, or hard'
    },
    required: [true, 'Difficulty is required'],
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  questionType: {
    type: String,
    enum: {
      values: ['text', 'image', 'audio', 'video', 'blurred_image', 'two_images', 'emoji', 'sequence', 'estimation', 'complete', 'map', 'before_after'],
      message: 'Invalid question type'
    },
    required: [true, 'Question type is required'],
    index: true
  },
  questionContent: {
    text: { type: String, trim: true, maxlength: 1000 },
    formattedText: { type: String, trim: true },
    mediaUrl: { type: String, trim: true },
    mediaType: { type: String, enum: ['image', 'audio', 'video', null] },
    mediaUrl2: { type: String, trim: true },
    mediaSettings: {
      startTime: { type: Number, default: 0 },
      endTime: Number,
      autoPlay: { type: Boolean, default: true },
      loop: { type: Boolean, default: false },
      showControls: { type: Boolean, default: false },
      blurLevel: { type: Number, min: 1, max: 10, default: 5 },
      revealMode: { type: String, enum: ['instant', 'gradual'], default: 'instant' },
      revealDuration: { type: Number, default: 3 },
      displayMode: { type: String, enum: ['side_by_side', 'overlay_toggle', 'slider'], default: 'side_by_side' },
      differencesCount: Number
    },
    emojis: [{ type: String, trim: true }],
    emojiHint: { type: String, trim: true },
    sequenceItems: [{
      id: { type: String, required: true },
      content: { type: String, required: true },
      contentType: { type: String, enum: ['text', 'image'], default: 'text' },
      imageUrl: String,
      correctPosition: { type: Number, required: true }
    }],
    estimationSettings: {
      unit: String,
      unitPlural: String,
      minValue: Number,
      maxValue: Number,
      showSlider: { type: Boolean, default: false }
    },
    completeSettings: {
      fullText: String,
      blankMarker: { type: String, default: '___' },
      completeType: { type: String, enum: ['proverb', 'song', 'verse', 'quote', 'other'], default: 'other' },
      attribution: String
    },
    mapSettings: {
      centerLat: Number,
      centerLng: Number,
      zoom: Number,
      markerLat: Number,
      markerLng: Number,
      hideLabels: { type: Boolean, default: true }
    },
    image1Label: String,
    image2Label: String
  },
  answerType: {
    type: String,
    enum: {
      values: ['text', 'image', 'audio', 'video', 'number', 'sequence', 'location'],
      message: 'Invalid answer type'
    },
    required: [true, 'Answer type is required']
  },
  answerContent: {
    text: { type: String, trim: true, maxlength: 500 },
    alternativeAnswers: [{ type: String, trim: true }],
    matchSettings: {
      caseSensitive: { type: Boolean, default: false },
      ignoreSpaces: { type: Boolean, default: true },
      ignoreDiacritics: { type: Boolean, default: true },
      partialMatch: { type: Boolean, default: false },
      partialMatchThreshold: { type: Number, default: 0.8 }
    },
    mediaUrl: String,
    mediaType: { type: String, enum: ['image', 'audio', 'video', null] },
    number: Number,
    numberRange: {
      exactMatch: { type: Boolean, default: false },
      percentageRange: Number,
      absoluteRange: Number,
      closestWins: { type: Boolean, default: false }
    },
    sequenceExplanation: String,
    location: {
      name: String,
      lat: Number,
      lng: Number,
      acceptableRadius: Number
    },
    explanation: { type: String, trim: true, maxlength: 1000 },
    funFact: { type: String, trim: true, maxlength: 500 },
    source: { type: String, trim: true },
    sourceUrl: { type: String, trim: true }
  },
  answerDisplaySettings: {
    revealDelay: { type: Number, default: 0 },
    animation: { type: String, enum: ['fade', 'zoom', 'flip', 'slide', 'none'], default: 'fade' },
    showExplanation: { type: Boolean, default: true },
    showFunFact: { type: Boolean, default: true }
  },
  gamesAvailable: {
    mainGame: {
      enabled: { type: Boolean, default: true },
      timeOverride: { type: Number, min: 10, max: 300 },
      helpers: {
        callFriend: { type: Boolean, default: true },
        thePit: { type: Boolean, default: true },
        doubleAnswer: { type: Boolean, default: true },
        takeRest: { type: Boolean, default: true }
      }
    },
    everyoneAnswers: {
      enabled: { type: Boolean, default: false },
      timeOverride: { type: Number, min: 5, max: 120 },
      pointsMultiplier: { type: Number, default: 1, min: 0.5, max: 3 }
    },
    buzzerMode: {
      enabled: { type: Boolean, default: false },
      timeToAnswer: { type: Number, default: 10 },
      wrongAnswerPenalty: { type: Number, default: 50 },
      useMultipleChoice: { type: Boolean, default: false }
    }
  },
  multipleChoice: {
    enabled: { type: Boolean, default: false },
    options: [{
      id: { type: String, default: () => customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4)() },
      text: { type: String, required: true, trim: true, maxlength: 200 },
      imageUrl: String,
      isCorrect: { type: Boolean, default: false },
      isTrap: { type: Boolean, default: false }
    }],
    shuffleOptions: { type: Boolean, default: true },
    maxSelections: { type: Number, default: 1 },
    showOptionLabels: { type: Boolean, default: true },
    partialCredit: { type: Boolean, default: false },
    partialCreditPercentage: { type: Number, default: 50 }
  },
  timing: {
    defaultTime: { type: Number, default: 30 },
    warningTime: { type: Number, default: 10 },
    bonusTimeThreshold: Number,
    bonusPoints: { type: Number, default: 0 }
  },
  stats: {
    timesPlayed: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
    timesWrong: { type: Number, default: 0 },
    timesSkipped: { type: Number, default: 0 },
    averageAnswerTime: { type: Number, default: 0 },
    mainGamePlays: { type: Number, default: 0 },
    everyoneAnswersPlays: { type: Number, default: 0 },
    buzzerPlays: { type: Number, default: 0 },
    optionSelections: [{
      optionId: String,
      timesSelected: { type: Number, default: 0 }
    }],
    lastPlayedAt: Date,
    lastPlayedInGame: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'needs_review', 'archived'],
      message: 'Invalid status'
    },
    default: 'draft',
    index: true
  },
  reviewNotes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  importSource: String,
  importId: String,
  // Keep backward compatibility
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ category: 1, difficulty: 1, status: 1 });
questionSchema.index({ 'stats.timesPlayed': 1 });
questionSchema.index({ 'gamesAvailable.mainGame.enabled': 1 });
questionSchema.index({ 'gamesAvailable.everyoneAnswers.enabled': 1 });
questionSchema.index({ 'gamesAvailable.buzzerMode.enabled': 1 });
questionSchema.index({ 'multipleChoice.enabled': 1 });
questionSchema.index({ status: 1, category: 1 });
questionSchema.index({ tags: 1 });
// shortId index already created via unique: true
questionSchema.index({ createdAt: -1 });
questionSchema.index({ isActive: 1 });

// Text index for search
questionSchema.index({
  'questionContent.text': 'text',
  'answerContent.text': 'text'
}, {
  weights: {
    'questionContent.text': 10,
    'answerContent.text': 5
  },
  default_language: 'arabic'
});

// Pre-save hooks
questionSchema.pre('save', function() {
  const pointsMap = { easy: 200, medium: 400, hard: 600 };
  this.points = pointsMap[this.difficulty];

  // Auto-enable everyoneAnswers if MC options exist
  if (this.multipleChoice?.options?.length >= 4) {
    const hasCorrect = this.multipleChoice.options.some(o => o.isCorrect);
    if (hasCorrect) {
      this.multipleChoice.enabled = true;
    }
  }

  // Validate game compatibility
  if (this.gamesAvailable?.everyoneAnswers?.enabled) {
    if (!this.multipleChoice?.enabled || this.multipleChoice?.options?.length < 4) {
      this.gamesAvailable.everyoneAnswers.enabled = false;
    }
  }

  // Sync isActive with status for backward compatibility
  this.isActive = this.status === 'active' || this.status === 'draft';
});

// Virtual for success rate
questionSchema.virtual('successRate').get(function() {
  if (this.stats.timesPlayed === 0) return 0;
  return Math.round((this.stats.timesCorrect / this.stats.timesPlayed) * 100);
});

// Methods
questionSchema.methods.recordPlay = async function(correct, answerTime, gameType) {
  this.stats.timesPlayed++;
  if (correct) {
    this.stats.timesCorrect++;
  } else {
    this.stats.timesWrong++;
  }

  // Update average answer time
  const totalTime = this.stats.averageAnswerTime * (this.stats.timesPlayed - 1) + answerTime;
  this.stats.averageAnswerTime = totalTime / this.stats.timesPlayed;

  // Update game type stats
  if (gameType === 'main') this.stats.mainGamePlays++;
  else if (gameType === 'everyone') this.stats.everyoneAnswersPlays++;
  else if (gameType === 'buzzer') this.stats.buzzerPlays++;

  this.stats.lastPlayedAt = new Date();

  await this.save();
};

questionSchema.methods.recordOptionSelection = async function(optionId) {
  const optionStat = this.stats.optionSelections.find(o => o.optionId === optionId);
  if (optionStat) {
    optionStat.timesSelected++;
  } else {
    this.stats.optionSelections.push({ optionId, timesSelected: 1 });
  }
  await this.save();
};

// Ensure virtuals are included in JSON
questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema);
