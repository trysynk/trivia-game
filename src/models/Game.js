const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

const gameSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    default: () => nanoid()
  },
  gameType: {
    type: String,
    enum: ['main', 'everyone', 'buzzer'],
    required: true,
    index: true
  },
  teams: [{
    name: { type: String, required: true },
    icon: String,
    color: String,
    scores: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      points: Number,
      correct: Boolean,
      timestamp: Date
    }],
    finalScore: { type: Number, default: 0 },
    helpersUsed: {
      callFriend: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        usedAt: Date
      }],
      thePit: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        pointsDeducted: Number,
        usedAt: Date
      }],
      doubleAnswer: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        usedAt: Date
      }],
      takeRest: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        targetPlayer: String,
        usedAt: Date
      }]
    }
  }],
  winner: {
    teamIndex: Number,
    teamName: String,
    finalScore: Number
  },
  players: [{
    socketId: String,
    name: String,
    avatar: String,
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: String,
      correct: Boolean,
      points: Number,
      timeToAnswer: Number,
      timestamp: Date
    }],
    buzzes: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      position: Number,
      timestamp: Date,
      answeredCorrectly: Boolean
    }],
    finalScore: { type: Number, default: 0 },
    rank: Number,
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    averageTime: Number
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  questionsPlayed: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    order: Number,
    answeredCorrectly: Boolean,
    answeredBy: String,
    timeToAnswer: Number,
    pointsAwarded: Number,
    helperUsed: String,
    bothTeamsWrong: Boolean,
    playerResults: [{
      playerId: String,
      answer: String,
      correct: Boolean,
      points: Number,
      timeToAnswer: Number
    }],
    playedAt: Date
  }],
  questionPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPack'
  },
  settings: {
    timePerQuestion: Number,
    questionsCount: Number,
    pointsEasy: Number,
    pointsMedium: Number,
    pointsHard: Number
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'abandoned'],
    default: 'waiting'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Live game state (for main game persistence)
  currentTeam: {
    type: Number,
    default: 0
  },
  gamePhase: {
    type: String,
    enum: ['board', 'question', 'answer', 'winner'],
    default: 'board'
  },
  currentQuestion: {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    points: Number
  },
  doubleAnswerActive: {
    type: Boolean,
    default: false
  },
  activeHelper: {
    team: Number,
    helper: String
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  // User owner (for paid games)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  // Backward compatibility
  completedAt: Date
}, {
  timestamps: true
});

gameSchema.index({ gameType: 1, createdAt: -1 });
gameSchema.index({ status: 1 });
gameSchema.index({ 'teams.name': 1 });
gameSchema.index({ categories: 1 });
gameSchema.index({ owner: 1, status: 1 });
gameSchema.index({ lastActivityAt: 1, status: 1 });
// shortId index already created via unique: true

gameSchema.methods.complete = async function() {
  this.status = 'completed';
  this.endedAt = new Date();
  this.completedAt = this.endedAt;
  if (this.startedAt) {
    this.duration = Math.round((this.endedAt - this.startedAt) / 1000);
  }
  await this.save();
};

module.exports = mongoose.model('Game', gameSchema);
