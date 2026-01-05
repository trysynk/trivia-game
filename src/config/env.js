require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS) || 4,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000
};
