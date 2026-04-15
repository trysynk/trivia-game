const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    match: [/^[A-Z0-9]{6}$/, 'Session ID must be 6 alphanumeric characters']
  },
  gameType: {
    type: String,
    enum: ['everyone', 'buzzer'],
    required: true
  },
  questionPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPack'
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  hostSocketId: String,
  hostUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  players: [{
    socketId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatar: String,
    color: String,
    score: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lockedOut: { type: Boolean, default: false },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    totalAnswerTime: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    lastActivityAt: Date
  }],
  currentQuestion: {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    questionNumber: Number,
    startedAt: Date,
    endsAt: Date,
    answers: [{
      socketId: String,
      playerName: String,
      answer: String,
      timestamp: Date,
      timeToAnswer: Number,
      correct: Boolean,
      pointsAwarded: Number
    }],
    buzzes: [{
      socketId: String,
      playerName: String,
      timestamp: Date,
      position: Number,
      processed: { type: Boolean, default: false },
      correct: Boolean
    }],
    currentBuzzer: {
      socketId: String,
      playerName: String,
      buzzedAt: Date,
      answerDeadline: Date
    },
    lockedOutPlayers: [String]
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  questionsAsked: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    askedAt: Date,
    results: mongoose.Schema.Types.Mixed
  }],
  settings: {
    questionTime: { type: Number, default: 30 },
    buzzerAnswerTime: { type: Number, default: 10 },
    questionsCount: { type: Number, default: 10 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    difficulties: [String],
    pointsEasy: { type: Number, default: 200 },
    pointsMedium: { type: Number, default: 400 },
    pointsHard: { type: Number, default: 600 },
    speedBonusEnabled: { type: Boolean, default: true },
    wrongAnswerPenalty: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'question_active', 'showing_results', 'between_questions', 'ended'],
    default: 'waiting'
  },
  startedAt: Date,
  endedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 4 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// sessionId index already created via unique: true
sessionSchema.index({ status: 1 });
sessionSchema.index({ hostSocketId: 1 });

sessionSchema.methods.addPlayer = function(socketId, name, avatar) {
  const existing = this.players.find(p => p.socketId === socketId);
  if (existing) {
    existing.isActive = true;
    existing.lastActivityAt = new Date();
    return existing;
  }

  const player = {
    socketId,
    name,
    avatar,
    score: 0,
    joinedAt: new Date(),
    lastActivityAt: new Date()
  };
  this.players.push(player);
  return player;
};

sessionSchema.methods.removePlayer = function(socketId) {
  const player = this.players.find(p => p.socketId === socketId);
  if (player) {
    player.isActive = false;
  }
};

sessionSchema.methods.getActivePlayers = function() {
  return this.players.filter(p => p.isActive);
};

sessionSchema.methods.getLeaderboard = function() {
  return this.players
    .filter(p => p.isActive)
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      ...p.toObject(),
      rank: index + 1
    }));
};

module.exports = mongoose.model('Session', sessionSchema);
