const { body } = require('express-validator');

const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('nameEn')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('English name cannot exceed 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('icon')
    .notEmpty().withMessage('Icon is required'),
  body('iconType')
    .optional()
    .isIn(['emoji', 'icon', 'image']).withMessage('Invalid icon type'),
  body('color')
    .notEmpty().withMessage('Color is required')
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid hex color'),
  body('gamesAvailable.mainGame')
    .optional()
    .isBoolean().withMessage('mainGame must be boolean'),
  body('gamesAvailable.everyoneAnswers')
    .optional()
    .isBoolean().withMessage('everyoneAnswers must be boolean'),
  body('gamesAvailable.buzzerMode')
    .optional()
    .isBoolean().withMessage('buzzerMode must be boolean')
];

const updateCategoryValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('nameEn')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('English name cannot exceed 50 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid hex color'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean')
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator
};
