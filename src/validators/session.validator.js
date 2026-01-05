const { body, param } = require('express-validator');

const createSessionValidator = [
  body('gameType')
    .notEmpty().withMessage('Game type is required')
    .isIn(['everyone', 'buzzer']).withMessage('Game type must be everyone or buzzer'),
  body('settings.questionTime')
    .optional()
    .isInt({ min: 5, max: 120 }).withMessage('Question time must be 5-120 seconds'),
  body('settings.questionsCount')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Questions count must be 1-50'),
  body('settings.categories')
    .optional()
    .isArray().withMessage('Categories must be an array'),
  body('settings.categories.*')
    .optional()
    .isMongoId().withMessage('Invalid category ID')
];

const sessionIdParam = param('sessionId')
  .notEmpty().withMessage('Session ID is required')
  .matches(/^[A-Z0-9]{6}$/).withMessage('Invalid session ID format');

module.exports = {
  createSessionValidator,
  sessionIdParam
};
