const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protectUser } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Protected routes (require user authentication)
router.use(protectUser);
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.post('/logout', userController.logout);
router.post('/use-game', userController.useGame);
router.get('/me/games/current', userController.getCurrentGame);
router.patch('/me/games/:gameId/sync', userController.syncGame);
router.patch('/me/games/:gameId/complete', userController.completeMyGame);
router.get('/me/games', userController.getMyGames);

module.exports = router;
