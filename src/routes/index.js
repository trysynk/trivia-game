const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const questionRoutes = require('./question.routes');
const gameRoutes = require('./game.routes');
const uploadRoutes = require('./upload.routes');
const sessionRoutes = require('./session.routes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/questions', questionRoutes);
router.use('/games', gameRoutes);
router.use('/upload', uploadRoutes);
router.use('/sessions', sessionRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
