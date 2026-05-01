const express = require('express');
const router = express.Router();
const { categoryController } = require('../controllers');
const { authMiddleware } = require('../middleware');
const { optionalUser } = require('../middleware/auth.middleware');

router.get('/', optionalUser, categoryController.getCategories);
router.get('/:id', optionalUser, categoryController.getCategory);
router.post('/', authMiddleware, categoryController.createCategory);
router.put('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
