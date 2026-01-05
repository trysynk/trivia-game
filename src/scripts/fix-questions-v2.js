require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');

const fixQuestions = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const questionsCollection = db.collection('questions');

    // Get all questions
    const questions = await questionsCollection.find({}).toArray();
    console.log(`Found ${questions.length} questions to process`);

    // Check current state
    console.log('\n--- Current State ---');
    const sample = questions[0];
    console.log('Sample question multipleChoice:', JSON.stringify(sample?.multipleChoice, null, 2));
    console.log('Sample question gamesAvailable:', JSON.stringify(sample?.gamesAvailable, null, 2));

    // Fix all questions with direct replacement
    for (const question of questions) {
      // Build proper multipleChoice object
      const options = question.options || question.multipleChoice?.options || [];
      const mcOptions = options.map((opt, idx) => ({
        id: opt.id || `opt${idx + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect || false,
        isTrap: false
      }));

      const hasValidMC = mcOptions.length >= 4 && mcOptions.some(o => o.isCorrect);

      // Full replacement of multipleChoice and gamesAvailable
      await questionsCollection.updateOne(
        { _id: question._id },
        {
          $set: {
            multipleChoice: {
              enabled: hasValidMC,
              options: mcOptions,
              shuffleOptions: true,
              maxSelections: 1,
              showOptionLabels: true,
              partialCredit: false,
              partialCreditPercentage: 50
            },
            gamesAvailable: {
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
                enabled: hasValidMC,
                pointsMultiplier: 1
              },
              buzzerMode: {
                enabled: true,
                timeToAnswer: 10,
                wrongAnswerPenalty: 50,
                useMultipleChoice: hasValidMC
              }
            },
            status: 'active'
          },
          $unset: { options: '' }
        }
      );
    }

    console.log(`\nProcessed ${questions.length} questions`);

    // Verify
    console.log('\n--- After Fix ---');
    const mainGameCount = await questionsCollection.countDocuments({
      'gamesAvailable.mainGame.enabled': true
    });
    console.log(`Main Game enabled: ${mainGameCount} questions`);

    const everyoneCount = await questionsCollection.countDocuments({
      'gamesAvailable.everyoneAnswers.enabled': true
    });
    console.log(`Everyone Answers enabled: ${everyoneCount} questions`);

    const buzzerCount = await questionsCollection.countDocuments({
      'gamesAvailable.buzzerMode.enabled': true
    });
    console.log(`Buzzer Mode enabled: ${buzzerCount} questions`);

    const mcEnabledCount = await questionsCollection.countDocuments({
      'multipleChoice.enabled': true
    });
    console.log(`Multiple Choice enabled: ${mcEnabledCount} questions`);

    const activeCount = await questionsCollection.countDocuments({
      status: 'active'
    });
    console.log(`Active status: ${activeCount} questions`);

    // Show sample after fix
    const sampleAfter = await questionsCollection.findOne({});
    console.log('\nSample question after fix:');
    console.log('- multipleChoice.enabled:', sampleAfter?.multipleChoice?.enabled);
    console.log('- multipleChoice.options count:', sampleAfter?.multipleChoice?.options?.length);
    console.log('- gamesAvailable.mainGame.enabled:', sampleAfter?.gamesAvailable?.mainGame?.enabled);
    console.log('- gamesAvailable.everyoneAnswers.enabled:', sampleAfter?.gamesAvailable?.everyoneAnswers?.enabled);
    console.log('- gamesAvailable.buzzerMode.enabled:', sampleAfter?.gamesAvailable?.buzzerMode?.enabled);

    console.log('\nFix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    process.exit(1);
  }
};

fixQuestions();
