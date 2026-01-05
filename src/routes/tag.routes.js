const express = require('express');
const router = express.Router();
const { tagController } = require('../controllers');
const { authMiddleware } = require('../middleware');
const { validate, mongoIdParam } = require('../validators');

// Public routes
router.get('/', tagController.getTags);
router.get('/:id', mongoIdParam, validate, tagController.getTag);
router.get('/:id/questions', mongoIdParam, validate, tagController.getTagQuestions);

// Protected routes
router.use(authMiddleware);

router.post('/', tagController.createTag);
router.put('/:id', mongoIdParam, validate, tagController.updateTag);
router.delete('/:id', mongoIdParam, validate, tagController.deleteTag);
router.post('/:id/update-count', mongoIdParam, validate, tagController.updateTagCount);

module.exports = router;
