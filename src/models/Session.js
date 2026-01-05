const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: [true, 'Session ID is required']
  },
  gameType: {
    type: String,
    enum: ['everyone', 'buzzer'],
    required: [true, 'Game type is required']
  },
  players: [{
    socketId: String,
    name: String,
    avatar: String,
    score: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lockedOut: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentQuestion: {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    startedAt: Date,
    answers: [{
      socketId: String,
      answer: String,
      timestamp: Date,
      correct: Boolean,
      pointsAwarded: Number
    }],
    buzzes: [{
      socketId: String,
      timestamp: Date,
      position: Number
    }]
  },
  questionsAsked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'question_active', 'showing_results', 'ended'],
    default: 'waiting'
  },
  settings: {
    questionTime: {
      type: Number,
      default: 30
    },
    questionsCount: {
      type: Number,
      default: 10
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }]
  },
  hostSocketId: String,
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
