const authMiddleware = require('./auth.middleware');
const { errorMiddleware, notFoundMiddleware } = require('./error.middleware');
const { upload, uploadImage, uploadAudio, uploadVideo } = require('./upload.middleware');

module.exports = {
  authMiddleware,
  errorMiddleware,
  notFoundMiddleware,
  upload,
  uploadImage,
  uploadAudio,
  uploadVideo
};
