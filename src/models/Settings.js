const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  appName: { type: String, default: 'تريفيا ماستر' },
  appNameEn: { type: String, default: 'Trivia Master' },
  logoUrl: String,
  faviconUrl: String,
  gameDefaults: {
    mainGame: {
      timePerQuestion: { type: Number, default: 30 },
      questionsPerCategory: { type: Number, default: 6 },
      pointsEasy: { type: Number, default: 200 },
      pointsMedium: { type: Number, default: 400 },
      pointsHard: { type: Number, default: 600 }
    },
    everyoneAnswers: {
      timePerQuestion: { type: Number, default: 30 },
      defaultQuestionsCount: { type: Number, default: 10 },
      speedBonusEnabled: { type: Boolean, default: true },
      speedBonusTiers: {
        tier1: { withinSeconds: { type: Number, default: 5 }, percentage: { type: Number, default: 100 } },
        tier2: { withinSeconds: { type: Number, default: 15 }, percentage: { type: Number, default: 75 } },
        tier3: { withinSeconds: { type: Number, default: 25 }, percentage: { type: Number, default: 50 } },
        tier4: { withinSeconds: { type: Number, default: 30 }, percentage: { type: Number, default: 25 } }
      }
    },
    buzzerMode: {
      timeToAnswerAfterBuzz: { type: Number, default: 10 },
      wrongAnswerPenalty: { type: Number, default: 50 },
      defaultQuestionsCount: { type: Number, default: 15 }
    }
  },
  sounds: {
    enabled: { type: Boolean, default: true },
    volume: { type: Number, default: 0.7 }
  },
  sessionSettings: {
    maxPlayersPerSession: { type: Number, default: 20 },
    sessionExpiryHours: { type: Number, default: 4 }
  },
  uiSettings: {
    defaultLanguage: { type: String, default: 'ar' },
    showTimerWarningAt: { type: Number, default: 10 }
  },
  backup: {
    autoBackupEnabled: { type: Boolean, default: false },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    lastBackupAt: Date
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
