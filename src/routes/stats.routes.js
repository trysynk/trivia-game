const express = require('express');
const router = express.Router();
const { statsController } = require('../controllers');
const { authMiddleware } = require('../middleware');

// All stats routes require authentication
router.use(authMiddleware);

router.get('/dashboard', statsController.getDashboard);
router.get('/questions', statsController.getQuestionStats);
router.get('/categories', statsController.getCategoryStats);
router.get('/games', statsController.getGameStats);
router.get('/activity', statsController.getActivityStats);
router.get('/health', statsController.getSystemHealth);

module.exports = router;
