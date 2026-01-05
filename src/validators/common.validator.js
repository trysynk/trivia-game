const { body, param, query } = require('express-validator');

const mongoIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage(`Invalid ${field} format`);

const mongoIdBody = (field) =>
  body(field).isMongoId().withMessage(`Invalid ${field} format`);

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be 1-100')
];

const searchQuery = query('search').optional().trim().escape();

module.exports = {
  mongoIdParam,
  mongoIdBody,
  paginationQuery,
  searchQuery
};
