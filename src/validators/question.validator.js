const { body, query } = require('express-validator');

const QUESTION_TYPES = ['text', 'image', 'audio', 'video', 'blurred_image', 'two_images', 'emoji', 'sequence', 'estimation', 'complete', 'map', 'before_after'];
const ANSWER_TYPES = ['text', 'image', 'audio', 'video', 'number', 'sequence', 'location'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const createQuestionValidator = [
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(DIFFICULTIES).withMessage('Difficulty must be easy, medium, or hard'),
  body('questionType')
    .notEmpty().withMessage('Question type is required')
    .isIn(QUESTION_TYPES).withMessage('Invalid question type'),
  body('questionContent.text')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Question text cannot exceed 1000 characters'),
  body('answerType')
    .notEmpty().withMessage('Answer type is required')
    .isIn(ANSWER_TYPES).withMessage('Invalid answer type'),
  body('answerContent.text')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Answer text cannot exceed 500 characters'),
  body('multipleChoice.options')
    .optional()
    .isArray().withMessage('Options must be an array'),
  body('multipleChoice.options.*.text')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Option text cannot exceed 200 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'needs_review', 'archived']).withMessage('Invalid status')
];

const updateQuestionValidator = [
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  body('difficulty')
    .optional()
    .isIn(DIFFICULTIES).withMessage('Difficulty must be easy, medium, or hard'),
  body('questionType')
    .optional()
    .isIn(QUESTION_TYPES).withMessage('Invalid question type'),
  body('answerType')
    .optional()
    .isIn(ANSWER_TYPES).withMessage('Invalid answer type'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'needs_review', 'archived']).withMessage('Invalid status')
];

const questionsQueryValidator = [
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('difficulty').optional().isIn(DIFFICULTIES).withMessage('Invalid difficulty'),
  query('questionType').optional(),
  query('status').optional().isIn(['draft', 'active', 'needs_review', 'archived']),
  query('game').optional().isIn(['mainGame', 'everyoneAnswers', 'buzzerMode']),
  query('hasMultipleChoice').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const forGameValidator = [
  body('categories').optional()
    .isArray({ min: 1 }).withMessage('At least one category is required'),
  body('categories.*').optional()
    .isMongoId().withMessage('Invalid category ID'),
  body('categoryIds').optional()
    .isArray({ min: 1 }).withMessage('At least one category is required'),
  body('categoryIds.*').optional()
    .isMongoId().withMessage('Invalid category ID'),
  body('gameType')
    .optional()
    .isIn(['main', 'everyone', 'buzzer']).withMessage('Invalid game type'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be 1-50'),
  body('questionsPerDifficulty')
    .optional()
    .isObject().withMessage('questionsPerDifficulty must be an object'),
  body('excludeQuestionIds')
    .optional()
    .isArray().withMessage('excludeQuestionIds must be an array')
];

module.exports = {
  createQuestionValidator,
  updateQuestionValidator,
  questionsQueryValidator,
  forGameValidator,
  QUESTION_TYPES,
  ANSWER_TYPES,
  DIFFICULTIES
};
