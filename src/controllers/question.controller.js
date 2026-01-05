const { Question } = require('../models');
const { questionService } = require('../services');
const { asyncHandler, createError } = require('../utils/helpers');
const { validateQuestion } = require('../utils/validators');

const getQuestions = asyncHandler(async (req, res) => {
  const { category, difficulty, type, page = 1, limit = 20 } = req.query;

  const query = { isActive: true };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (type) query.questionType = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('category', 'name nameEn icon color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Question.countDocuments(query)
  ]);

  res.json({
    questions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('category', 'name nameEn icon color');

  if (!question) {
    throw createError('Question not found', 404);
  }

  res.json({ question });
});

const getQuestionsForGame = asyncHandler(async (req, res) => {
  const { categories, exclude } = req.query;

  if (!categories) {
    throw createError('Categories are required', 400);
  }

  const categoryIds = categories.split(',');
  const excludeIds = exclude ? exclude.split(',') : [];

  const questions = await questionService.getQuestionsForGame(categoryIds, excludeIds);

  res.json({ questions });
});

const createQuestion = asyncHandler(async (req, res) => {
  const validation = validateQuestion(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }

  const {
    category,
    difficulty,
    questionType,
    questionContent,
    answerType,
    answerContent,
    options
  } = req.body;

  const question = await Question.create({
    category,
    difficulty,
    questionType,
    questionContent,
    answerType,
    answerContent,
    options
  });

  await question.populate('category', 'name nameEn icon color');

  res.status(201).json({ question });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw createError('Question not found', 404);
  }

  const allowedUpdates = [
    'category',
    'difficulty',
    'questionType',
    'questionContent',
    'answerType',
    'answerContent',
    'options',
    'isActive'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      question[field] = req.body[field];
    }
  });

  await question.save();
  await question.populate('category', 'name nameEn icon color');

  res.json({ question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw createError('Question not found', 404);
  }

  await question.deleteOne();

  res.json({ message: 'Question deleted successfully' });
});

const markQuestionPlayed = asyncHandler(async (req, res) => {
  const { correct } = req.body;

  const question = await questionService.markQuestionPlayed(
    req.params.id,
    correct === true
  );

  if (!question) {
    throw createError('Question not found', 404);
  }

  res.json({ question });
});

module.exports = {
  getQuestions,
  getQuestion,
  getQuestionsForGame,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  markQuestionPlayed
};
