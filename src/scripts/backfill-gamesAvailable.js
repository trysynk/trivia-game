require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');
const { Question } = require('../models');

async function backfill() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const res = await Question.updateMany(
      { 'gamesAvailable.mainGame.enabled': { $exists: false } },
      {
        $set: {
          'gamesAvailable.mainGame.enabled': true,
          'gamesAvailable.mainGame.helpers.callFriend': true,
          'gamesAvailable.mainGame.helpers.doubleAnswer': true,
          'gamesAvailable.mainGame.helpers.takeRest': true,
          'gamesAvailable.mainGame.helpers.thePit': true,
          'gamesAvailable.everyoneAnswers.enabled': false,
          'gamesAvailable.buzzerMode.enabled': false
        }
      }
    );

    console.log(`Updated ${res.modifiedCount} questions`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  }
}

backfill();
