const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const questionRoutes = require('./question.routes');
const gameRoutes = require('./game.routes');
const uploadRoutes = require('./upload.routes');
const sessionRoutes = require('./session.routes');
const tagRoutes = require('./tag.routes');
const settingsRoutes = require('./settings.routes');
const statsRoutes = require('./stats.routes');
const mediaRoutes = require('./media.routes');
const questionPackRoutes = require('./questionPack.routes');
const activityRoutes = require('./activity.routes');
const userRoutes = require('./user.routes');
const paymentRoutes = require('./payment.routes');
const promoCodeRoutes = require('./promoCode.routes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/questions', questionRoutes);
router.use('/games', gameRoutes);
router.use('/upload', uploadRoutes);
router.use('/sessions', sessionRoutes);
router.use('/tags', tagRoutes);
router.use('/settings', settingsRoutes);
router.use('/stats', statsRoutes);
router.use('/media', mediaRoutes);
router.use('/question-packs', questionPackRoutes);
router.use('/activity', activityRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/promo-codes', promoCodeRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

module.exports = router;
