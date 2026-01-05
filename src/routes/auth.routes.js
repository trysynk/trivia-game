const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authMiddleware } = require('../middleware');
const { validate, loginValidator, registerValidator, changePasswordValidator } = require('../validators');

// Public routes
router.post('/login', loginValidator, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(authMiddleware);

router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);
router.put('/change-password', changePasswordValidator, validate, authController.changePassword);

// Admin management (super_admin only)
router.post('/admins', registerValidator, validate, authController.createAdmin);
router.get('/admins', authController.getAdmins);
router.put('/admins/:id', authController.updateAdmin);
router.delete('/admins/:id', authController.deleteAdmin);

module.exports = router;
