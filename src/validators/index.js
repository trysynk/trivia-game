const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors.array().map(e => e.msg)
    });
  }
  next();
};

const authValidators = require('./auth.validator');
const categoryValidators = require('./category.validator');
const questionValidators = require('./question.validator');
const sessionValidators = require('./session.validator');
const commonValidators = require('./common.validator');

module.exports = {
  validate,
  ...authValidators,
  ...categoryValidators,
  ...questionValidators,
  ...sessionValidators,
  ...commonValidators
};
