const authController = require('./auth.controller');
const categoryController = require('./category.controller');
const questionController = require('./question.controller');
const gameController = require('./game.controller');
const uploadController = require('./upload.controller');
const sessionController = require('./session.controller');
const tagController = require('./tag.controller');
const settingsController = require('./settings.controller');
const statsController = require('./stats.controller');
const mediaController = require('./media.controller');
const questionPackController = require('./questionPack.controller');
const activityController = require('./activity.controller');

module.exports = {
  authController,
  categoryController,
  questionController,
  gameController,
  uploadController,
  sessionController,
  tagController,
  settingsController,
  statsController,
  mediaController,
  questionPackController,
  activityController
};
