const express = require('express');
const router = express.Router();
const { settingsController } = require('../controllers');
const { authMiddleware } = require('../middleware');

// All settings routes require authentication
router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

router.get('/game-defaults', settingsController.getGameDefaults);
router.put('/game-defaults/:gameType', settingsController.updateGameDefaults);

router.get('/sounds', settingsController.getSounds);
router.put('/sounds', settingsController.updateSounds);

router.get('/ui', settingsController.getUISettings);
router.put('/ui', settingsController.updateUISettings);

router.post('/reset', settingsController.resetToDefaults);

module.exports = router;
