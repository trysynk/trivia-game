/**
 * Migration script to fix gamesAvailable structure in questions
 *
 * The schema expects:
 *   gamesAvailable: {
 *     mainGame: { enabled: true, ... },
 *     everyoneAnswers: { enabled: false, ... },
 *     buzzerMode: { enabled: false, ... }
 *   }
 *
 * But some questions have:
 *   - gamesAvailable missing entirely
 *   - gamesAvailable with boolean values instead of objects
 *
 * This script fixes both cases.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const DEFAULT_GAMES_AVAILABLE = {
  mainGame: {
    enabled: true,
    helpers: {
      callFriend: true,
      thePit: true,
      doubleAnswer: true,
      takeRest: true
    }
  },
  everyoneAnswers: {
    enabled: true,
    pointsMultiplier: 1
  },
  buzzerMode: {
    enabled: true,
    timeToAnswer: 10,
    wrongAnswerPenalty: 50,
    useMultipleChoice: false
  }
};

async function fixGamesAvailable() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const questionsCollection = db.collection('questions');

    // Step 1: Fix questions missing gamesAvailable entirely
    const missingGamesAvailable = await questionsCollection.find({
      $or: [
        { gamesAvailable: { $exists: false } },
        { gamesAvailable: null }
      ]
    }).toArray();

    console.log(`Found ${missingGamesAvailable.length} questions missing gamesAvailable`);

    for (const question of missingGamesAvailable) {
      await questionsCollection.updateOne(
        { _id: question._id },
        { $set: { gamesAvailable: DEFAULT_GAMES_AVAILABLE } }
      );
      console.log(`Added gamesAvailable to question ${question._id} (${question.shortId})`);
    }

    // Step 2: Fix questions with boolean gamesAvailable values
    const booleanGamesAvailable = await questionsCollection.find({
      $or: [
        { 'gamesAvailable.mainGame': { $type: 'bool' } },
        { 'gamesAvailable.everyoneAnswers': { $type: 'bool' } },
        { 'gamesAvailable.buzzerMode': { $type: 'bool' } }
      ]
    }).toArray();

    console.log(`Found ${booleanGamesAvailable.length} questions with boolean gamesAvailable`);

    for (const question of booleanGamesAvailable) {
      const update = {};

      if (typeof question.gamesAvailable?.mainGame === 'boolean') {
        update['gamesAvailable.mainGame'] = {
          ...DEFAULT_GAMES_AVAILABLE.mainGame,
          enabled: question.gamesAvailable.mainGame
        };
      }

      if (typeof question.gamesAvailable?.everyoneAnswers === 'boolean') {
        update['gamesAvailable.everyoneAnswers'] = {
          ...DEFAULT_GAMES_AVAILABLE.everyoneAnswers,
          enabled: question.gamesAvailable.everyoneAnswers
        };
      }

      if (typeof question.gamesAvailable?.buzzerMode === 'boolean') {
        update['gamesAvailable.buzzerMode'] = {
          ...DEFAULT_GAMES_AVAILABLE.buzzerMode,
          enabled: question.gamesAvailable.buzzerMode
        };
      }

      if (Object.keys(update).length > 0) {
        await questionsCollection.updateOne(
          { _id: question._id },
          { $set: update }
        );
        console.log(`Fixed boolean gamesAvailable in question ${question._id} (${question.shortId})`);
      }
    }

    const totalFixed = missingGamesAvailable.length + booleanGamesAvailable.length;
    console.log(`\nTotal fixed: ${totalFixed} questions`);

    // Verify
    const stillMissing = await questionsCollection.countDocuments({
      $or: [
        { gamesAvailable: { $exists: false } },
        { gamesAvailable: null },
        { 'gamesAvailable.mainGame': { $type: 'bool' } }
      ]
    });
    console.log(`Questions still needing fix: ${stillMissing}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixGamesAvailable();
