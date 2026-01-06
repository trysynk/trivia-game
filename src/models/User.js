const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'بريد إلكتروني غير صالح']
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
    select: false
  },

  // Game Credits
  gamesRemaining: {
    type: Number,
    default: 0,
    min: 0
  },
  totalGamesPurchased: {
    type: Number,
    default: 0
  },
  totalGamesPlayed: {
    type: Number,
    default: 0
  },

  // Payment History Reference
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],

  // Games Played Reference
  gamesHistory: [{
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    playedAt: { type: Date, default: Date.now }
  }],

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,

  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,

  lastLogin: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Use a game credit
userSchema.methods.useGame = async function() {
  if (this.gamesRemaining <= 0) {
    throw new Error('لا يوجد رصيد ألعاب كافي');
  }
  this.gamesRemaining -= 1;
  this.totalGamesPlayed += 1;
  await this.save();
  return this;
};

// Add game credits
userSchema.methods.addGames = async function(count) {
  this.gamesRemaining += count;
  this.totalGamesPurchased += count;
  await this.save();
  return this;
};

module.exports = mongoose.model('User', userSchema);
