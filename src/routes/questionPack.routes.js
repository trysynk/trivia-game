const express = require('express');
const router = express.Router();
const { questionPackController } = require('../controllers');
const { authMiddleware } = require('../middleware');
const { validate, mongoIdParam } = require('../validators');

// Public routes
router.get('/', questionPackController.getQuestionPacks);
router.get('/:id', mongoIdParam, validate, questionPackController.getQuestionPack);
router.get('/:id/questions', mongoIdParam, validate, questionPackController.getPackQuestions);

// Protected routes
router.use(authMiddleware);

router.post('/', questionPackController.createQuestionPack);
router.put('/:id', mongoIdParam, validate, questionPackController.updateQuestionPack);
router.delete('/:id', mongoIdParam, validate, questionPackController.deleteQuestionPack);

router.post('/:id/questions', mongoIdParam, validate, questionPackController.addQuestions);
router.delete('/:id/questions', mongoIdParam, validate, questionPackController.removeQuestions);
router.post('/:id/duplicate', mongoIdParam, validate, questionPackController.duplicatePack);

module.exports = router;
