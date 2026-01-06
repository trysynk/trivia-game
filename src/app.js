const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const routes = require('./routes');
const { errorMiddleware, notFoundMiddleware } = require('./middleware');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin.split(',').map(origin => origin.trim()),
  credentials: true
}));

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});

app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Arabic Trivia Game API',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      categories: '/api/categories',
      questions: '/api/questions',
      games: '/api/games',
      sessions: '/api/sessions',
      upload: '/api/upload',
      tags: '/api/tags',
      settings: '/api/settings',
      stats: '/api/stats',
      media: '/api/media',
      questionPacks: '/api/question-packs',
      activity: '/api/activity',
      users: '/api/users',
      payments: '/api/payments'
    }
  });
});

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
