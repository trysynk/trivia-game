const express = require('express');
const router = express.Router();
const { questionController } = require('../controllers');
const { authMiddleware } = require('../middleware');
const {
  validate,
  createQuestionValidator,
  updateQuestionValidator,
  questionsQueryValidator,
  forGameValidator,
  mongoIdParam
} = require('../validators');

// Public routes
router.get('/', questionsQueryValidator, validate, questionController.getQuestions);
router.get('/short/:shortId', questionController.getQuestionByShortId);
router.post('/for-game', forGameValidator, validate, questionController.getQuestionsForGame);
router.post('/:id/played', mongoIdParam, validate, questionController.markQuestionPlayed);

// Protected routes
router.use(authMiddleware);

router.get('/:id', mongoIdParam, validate, questionController.getQuestion);
router.get('/:id/stats', mongoIdParam, validate, questionController.getQuestionStats);
router.post('/', createQuestionValidator, validate, questionController.createQuestion);
router.put('/:id', mongoIdParam, updateQuestionValidator, validate, questionController.updateQuestion);
router.delete('/:id', mongoIdParam, validate, questionController.deleteQuestion);

// Bulk operations
router.post('/bulk/status', questionController.bulkUpdateStatus);
router.post('/bulk/delete', questionController.bulkDelete);

module.exports = router;
