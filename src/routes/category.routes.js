const express = require('express');
const router = express.Router();
const { categoryController } = require('../controllers');
const { authMiddleware } = require('../middleware');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/', authMiddleware, categoryController.createCategory);
router.put('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
