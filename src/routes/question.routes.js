const express = require('express');
const router = express.Router();
const { questionController } = require('../controllers');
const { authMiddleware } = require('../middleware');

router.get('/', questionController.getQuestions);
router.get('/for-game', questionController.getQuestionsForGame);
router.get('/:id', questionController.getQuestion);
router.post('/', authMiddleware, questionController.createQuestion);
router.put('/:id', authMiddleware, questionController.updateQuestion);
router.delete('/:id', authMiddleware, questionController.deleteQuestion);
router.post('/:id/played', questionController.markQuestionPlayed);

module.exports = router;
