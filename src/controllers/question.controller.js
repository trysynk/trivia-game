const { Question, Category } = require('../models');
const { questionService, activityService } = require('../services');
const { asyncHandler, createError } = require('../utils/helpers');

const getQuestions = asyncHandler(async (req, res) => {
  const {
    category,
    difficulty,
    questionType,
    status,
    game,
    hasMultipleChoice,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const filters = {
    category,
    difficulty,
    questionType,
    status,
    game,
    hasMultipleChoice: hasMultipleChoice === 'true' ? true : hasMultipleChoice === 'false' ? false : undefined,
    search
  };

  const result = await questionService.getQuestionsByFilters(filters, { page: parseInt(page), limit: parseInt(limit) });

  res.json(result);
});

const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('category', 'name nameEn icon color')
    .populate('tags', 'name nameEn color')
    .populate('createdBy', 'username displayName')
    .populate('updatedBy', 'username displayName');

  if (!question) {
    throw createError('Question not found', 404);
  }

  res.json({ question });
});

const getQuestionByShortId = asyncHandler(async (req, res) => {
  const question = await Question.findOne({ shortId: req.params.shortId })
    .populate('category', 'name nameEn icon color')
    .populate('tags', 'name nameEn color');

  if (!question) {
    throw createError('Question not found', 404);
  }

  res.json({ question });
});

const getQuestionsForGame = asyncHandler(async (req, res) => {
  const { categories, gameType = 'everyone', questionsPerDifficulty } = req.body;
  const { excludeQuestionIds = [] } = req.body;

  if (!categories || !categories.length) {
    throw createError('At least one category is required', 400);
  }

  const questions = await questionService.getQuestionsForGame(categories, {
    excludeQuestionIds,
    gameType,
    questionsPerDifficulty
  });

  res.json({ questions });
});

const createQuestion = asyncHandler(async (req, res) => {
  const {
    category,
    difficulty,
    questionType,
    questionContent,
    answerType,
    answerContent,
    answerDisplaySettings,
    gamesAvailable,
    multipleChoice,
    tags,
    points,
    timeLimit,
    status
  } = req.body;

  // Default gamesAvailable if not provided
  const defaultGamesAvailable = {
    mainGame: {
      enabled: true,
      helpers: { callFriend: true, thePit: true, doubleAnswer: true, takeRest: true }
    },
    everyoneAnswers: { enabled: true, pointsMultiplier: 1 },
    buzzerMode: { enabled: true, timeToAnswer: 10, wrongAnswerPenalty: 50, useMultipleChoice: false }
  };

  const question = await Question.create({
    category,
    difficulty,
    questionType,
    questionContent,
    answerType,
    answerContent,
    answerDisplaySettings,
    gamesAvailable: gamesAvailable || defaultGamesAvailable,
    multipleChoice,
    tags,
    points,
    timeLimit,
    status: status || 'draft',
    createdBy: req.admin._id
  });

  await question.populate('category', 'name nameEn icon color');
  await question.populate('tags', 'name nameEn color');

  // Update category stats
  await questionService.updateCategoryStats(category);

  // Log activity
  await activityService.logQuestionCreate(req.admin, question, req);

  res.status(201).json({ question });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw createError('Question not found', 404);
  }

  const oldCategory = question.category;
  const changes = { before: {}, after: {} };

  const allowedUpdates = [
    'category', 'difficulty', 'questionType', 'questionContent',
    'answerType', 'answerContent', 'answerDisplaySettings',
    'gamesAvailable', 'multipleChoice', 'tags', 'points', 'timeLimit', 'status'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      changes.before[field] = question[field];
      changes.after[field] = req.body[field];
      question[field] = req.body[field];
    }
  });

  question.updatedBy = req.admin._id;

  await question.save();
  await question.populate('category', 'name nameEn icon color');
  await question.populate('tags', 'name nameEn color');

  // Update category stats if category changed
  if (oldCategory.toString() !== question.category.toString()) {
    await questionService.updateCategoryStats(oldCategory);
    await questionService.updateCategoryStats(question.category);
  }

  // Log activity
  await activityService.logQuestionUpdate(req.admin, question, changes, req);

  res.json({ question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw createError('Question not found', 404);
  }

  const categoryId = question.category;

  await activityService.logQuestionDelete(req.admin, question, req);

  await question.deleteOne();

  // Update category stats
  await questionService.updateCategoryStats(categoryId);

  res.json({ message: 'Question deleted successfully' });
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { questionIds, status } = req.body;

  if (!questionIds || !questionIds.length) {
    throw createError('Question IDs are required', 400);
  }

  if (!['draft', 'active', 'needs_review', 'archived'].includes(status)) {
    throw createError('Invalid status', 400);
  }

  const result = await Question.updateMany(
    { _id: { $in: questionIds } },
    { status, updatedBy: req.admin._id }
  );

  await activityService.logBulkAction(req.admin, 'status_update', 'question', result.modifiedCount, req);

  res.json({
    message: `${result.modifiedCount} questions updated`,
    modifiedCount: result.modifiedCount
  });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;

  if (!questionIds || !questionIds.length) {
    throw createError('Question IDs are required', 400);
  }

  // Get categories before deletion
  const questions = await Question.find({ _id: { $in: questionIds } }).select('category');
  const categoryIds = [...new Set(questions.map(q => q.category.toString()))];

  const result = await Question.deleteMany({ _id: { $in: questionIds } });

  // Update category stats
  for (const catId of categoryIds) {
    await questionService.updateCategoryStats(catId);
  }

  await activityService.logBulkAction(req.admin, 'delete', 'question', result.deletedCount, req);

  res.json({
    message: `${result.deletedCount} questions deleted`,
    deletedCount: result.deletedCount
  });
});

const markQuestionPlayed = asyncHandler(async (req, res) => {
  const { correct, answerTime, selectedOptionId } = req.body;

  const question = await questionService.markQuestionPlayed(req.params.id, {
    correct: correct === true,
    answerTime,
    selectedOptionId
  });

  if (!question) {
    throw createError('Question not found', 404);
  }

  res.json({ question });
});

const getQuestionStats = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).select('stats');

  if (!question) {
    throw createError('Question not found', 404);
  }

  res.json({ stats: question.stats });
});

module.exports = {
  getQuestions,
  getQuestion,
  getQuestionByShortId,
  getQuestionsForGame,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpdateStatus,
  bulkDelete,
  markQuestionPlayed,
  getQuestionStats
};
