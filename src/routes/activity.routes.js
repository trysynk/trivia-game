const express = require('express');
const router = express.Router();
const { activityController } = require('../controllers');
const { authMiddleware } = require('../middleware');

// All activity routes require authentication
router.use(authMiddleware);

router.get('/', activityController.getActivityLogs);
router.get('/me', activityController.getMyActivity);
router.get('/recent', activityController.getRecentActivity);

module.exports = router;
