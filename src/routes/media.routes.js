const express = require('express');
const router = express.Router();
const { mediaController } = require('../controllers');
const { authMiddleware, uploadMiddleware } = require('../middleware');
const { validate, mongoIdParam } = require('../validators');

// All media routes require authentication
router.use(authMiddleware);

router.get('/', mediaController.getMedia);
router.get('/unused', mediaController.getUnusedMedia);
router.get('/:id', mongoIdParam, validate, mediaController.getMediaById);

router.post('/', uploadMiddleware.single('file'), mediaController.uploadMedia);
router.post('/multiple', uploadMiddleware.array('files', 10), mediaController.uploadMultiple);

router.delete('/:id', mongoIdParam, validate, mediaController.deleteMedia);
router.post('/bulk/delete', mediaController.bulkDelete);
router.post('/cleanup', mediaController.cleanupUnused);

module.exports = router;
