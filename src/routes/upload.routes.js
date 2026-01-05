const express = require('express');
const router = express.Router();
const { uploadController } = require('../controllers');
const { authMiddleware, uploadImage, uploadAudio, uploadVideo } = require('../middleware');

router.post('/image', authMiddleware, uploadImage, uploadController.uploadImage);
router.post('/audio', authMiddleware, uploadAudio, uploadController.uploadAudio);
router.post('/video', authMiddleware, uploadVideo, uploadController.uploadVideo);
router.delete('/', authMiddleware, uploadController.deleteFile);

module.exports = router;
