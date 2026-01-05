const express = require('express');
const router = express.Router();
const { gameController } = require('../controllers');

router.get('/stats', gameController.getGameStats);
router.get('/history', gameController.getGameHistory);
router.get('/:id', gameController.getGame);
router.post('/', gameController.createGame);
router.put('/:id', gameController.updateGame);
router.post('/:id/complete', gameController.completeGame);

module.exports = router;
