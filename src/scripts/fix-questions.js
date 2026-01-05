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

    let fixed = 0;
    for (const question of questions) {
      const updates = {};

      // Fix 1: Move top-level options to multipleChoice.options
      if (question.options && question.options.length > 0 &&
          (!question.multipleChoice?.options || question.multipleChoice.options.length === 0)) {
        updates['multipleChoice.options'] = question.options.map((opt, idx) => ({
          id: `opt${idx + 1}`,
          text: opt.text,
          isCorrect: opt.isCorrect || false,
          isTrap: false
        }));
        updates['multipleChoice.enabled'] = true;
        updates['multipleChoice.shuffleOptions'] = true;
      }

      // Fix 2: Enable gamesAvailable for all game types
      updates['gamesAvailable.mainGame.enabled'] = true;
      updates['gamesAvailable.everyoneAnswers.enabled'] = true;
      updates['gamesAvailable.buzzerMode.enabled'] = true;

      // Fix 3: Ensure status is active
      if (!question.status || question.status === 'draft') {
        updates['status'] = 'active';
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await questionsCollection.updateOne(
          { _id: question._id },
          { $set: updates }
        );
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} questions`);

    // Remove top-level options field (cleanup)
    await questionsCollection.updateMany(
      { options: { $exists: true } },
      { $unset: { options: '' } }
    );
    console.log('Cleaned up top-level options field');

    // Verify the fix
    const verifyCount = await questionsCollection.countDocuments({
      'gamesAvailable.everyoneAnswers.enabled': true,
      'multipleChoice.enabled': true,
      status: 'active'
    });
    console.log(`\nVerification: ${verifyCount} questions now have everyoneAnswers enabled with multipleChoice`);

    const mainGameCount = await questionsCollection.countDocuments({
      'gamesAvailable.mainGame.enabled': true,
      status: 'active'
    });
    console.log(`Verification: ${mainGameCount} questions have mainGame enabled`);

    console.log('\nFix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    process.exit(1);
  }
};

fixQuestions();
