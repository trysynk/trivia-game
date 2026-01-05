const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameType: {
    type: String,
    enum: ['main', 'everyone', 'buzzer'],
    required: [true, 'Game type is required']
  },
  teams: [{
    name: String,
    icon: String,
    color: String,
    finalScore: Number
  }],
  winner: {
    type: Number,
    default: null
  },
  players: [{
    name: String,
    finalScore: Number,
    rank: Number
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  questionsPlayed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  duration: {
    type: Number
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

gameSchema.index({ gameType: 1 });
gameSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
