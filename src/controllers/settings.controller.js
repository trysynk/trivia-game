const { Settings } = require('../models');
const { asyncHandler, createError } = require('../utils/helpers');
const { activityService } = require('../services');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.json({ settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  const changes = { before: {}, after: {} };

  const allowedUpdates = [
    'appName', 'appNameEn', 'gameDefaults', 'sounds', 'sessionSettings', 'uiSettings', 'backup'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      changes.before[field] = settings[field];
      changes.after[field] = req.body[field];

      if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
        settings[field] = { ...settings[field], ...req.body[field] };
      } else {
        settings[field] = req.body[field];
      }
    }
  });

  await settings.save();

  await activityService.logSettingsUpdate(req.admin, changes, req);

  res.json({ settings });
});

const getGameDefaults = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.json({ gameDefaults: settings.gameDefaults });
});

const updateGameDefaults = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  const { gameType } = req.params;

  if (!['mainGame', 'everyoneAnswers', 'buzzerMode'].includes(gameType)) {
    throw createError('Invalid game type', 400);
  }

  const changes = {
    before: { [gameType]: settings.gameDefaults[gameType] },
    after: { [gameType]: req.body }
  };

  settings.gameDefaults[gameType] = { ...settings.gameDefaults[gameType], ...req.body };
  await settings.save();

  await activityService.logSettingsUpdate(req.admin, changes, req);

  res.json({ gameDefaults: settings.gameDefaults });
});

const getSounds = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.json({ sounds: settings.sounds });
});

const updateSounds = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  const changes = {
    before: { sounds: settings.sounds },
    after: { sounds: req.body }
  };

  settings.sounds = { ...settings.sounds, ...req.body };
  await settings.save();

  await activityService.logSettingsUpdate(req.admin, changes, req);

  res.json({ sounds: settings.sounds });
});

const getUISettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.json({ uiSettings: settings.uiSettings });
});

const updateUISettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  const changes = {
    before: { uiSettings: settings.uiSettings },
    after: { uiSettings: req.body }
  };

  settings.uiSettings = { ...settings.uiSettings, ...req.body };
  await settings.save();

  await activityService.logSettingsUpdate(req.admin, changes, req);

  res.json({ uiSettings: settings.uiSettings });
});

const resetToDefaults = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  // Reset to default values
  settings.gameDefaults = {
    mainGame: {
      questionTime: 30,
      roundsCount: 3,
      questionsPerRound: 5,
      pointsPerQuestion: { easy: 200, medium: 400, hard: 600 }
    },
    everyoneAnswers: {
      questionTime: 20,
      questionCount: 10,
      showLeaderboard: true,
      speedBonusTiers: [
        { maxTime: 3, bonus: 50 },
        { maxTime: 6, bonus: 30 },
        { maxTime: 10, bonus: 15 },
        { maxTime: Infinity, bonus: 0 }
      ]
    },
    buzzerMode: {
      questionTime: 15,
      questionCount: 10,
      buzzerLockoutTime: 3,
      showLeaderboard: true,
      speedBonusTiers: [
        { maxTime: 3, bonus: 50 },
        { maxTime: 6, bonus: 30 },
        { maxTime: 10, bonus: 15 },
        { maxTime: Infinity, bonus: 0 }
      ]
    }
  };

  await settings.save();

  await activityService.logSettingsUpdate(req.admin, { action: 'reset_to_defaults' }, req);

  res.json({ settings, message: 'Settings reset to defaults' });
});

module.exports = {
  getSettings,
  updateSettings,
  getGameDefaults,
  updateGameDefaults,
  getSounds,
  updateSounds,
  getUISettings,
  updateUISettings,
  resetToDefaults
};
