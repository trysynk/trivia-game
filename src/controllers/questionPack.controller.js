const { QuestionPack, Question } = require('../models');
const { asyncHandler, createError } = require('../utils/helpers');

const getQuestionPacks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive, isPublic, search } = req.query;

  const query = {};

  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isPublic !== undefined) query.isPublic = isPublic === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { nameEn: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [packs, total] = await Promise.all([
    QuestionPack.find(query)
      .populate('createdBy', 'username displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    QuestionPack.countDocuments(query)
  ]);

  res.json({
    packs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getQuestionPack = asyncHandler(async (req, res) => {
  const pack = await QuestionPack.findById(req.params.id)
    .populate('questions', 'shortId questionType questionContent difficulty')
    .populate('createdBy', 'username displayName');

  if (!pack) {
    throw createError('Question pack not found', 404);
  }

  res.json({ pack });
});

const createQuestionPack = asyncHandler(async (req, res) => {
  const {
    name,
    nameEn,
    description,
    coverImage,
    color,
    icon,
    questions,
    shuffleQuestions,
    smartFilters,
    gamesAvailable,
    isPublic
  } = req.body;

  const pack = await QuestionPack.create({
    name,
    nameEn,
    description,
    coverImage,
    color,
    icon,
    questions: questions || [],
    shuffleQuestions,
    smartFilters,
    gamesAvailable,
    isPublic,
    createdBy: req.admin._id
  });

  res.status(201).json({ pack });
});

const updateQuestionPack = asyncHandler(async (req, res) => {
  const pack = await QuestionPack.findById(req.params.id);

  if (!pack) {
    throw createError('Question pack not found', 404);
  }

  const allowedUpdates = [
    'name', 'nameEn', 'description', 'coverImage', 'color', 'icon',
    'questions', 'shuffleQuestions', 'smartFilters', 'gamesAvailable',
    'isActive', 'isPublic'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      pack[field] = req.body[field];
    }
  });

  await pack.save();

  res.json({ pack });
});

const deleteQuestionPack = asyncHandler(async (req, res) => {
  const pack = await QuestionPack.findById(req.params.id);

  if (!pack) {
    throw createError('Question pack not found', 404);
  }

  await pack.deleteOne();

  res.json({ message: 'Question pack deleted successfully' });
});

const addQuestions = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;

  if (!questionIds || !questionIds.length) {
    throw createError('Question IDs are required', 400);
  }

  const pack = await QuestionPack.findById(req.params.id);

  if (!pack) {
    throw createError('Question pack not found', 404);
  }

  // Add questions that don't already exist
  const existingIds = pack.questions.map(q => q.toString());
  const newIds = questionIds.filter(id => !existingIds.includes(id));

  pack.questions.push(...newIds);
  await pack.save();

  res.json({
    pack,
    addedCount: newIds.length,
    message: `${newIds.length} questions added to pack`
  });
});

const removeQuestions = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;

  if (!questionIds || !questionIds.length) {
    throw createError('Question IDs are required', 400);
  }

  const pack = await QuestionPack.findById(req.params.id);

  if (!pack) {
    throw createError('Question pack not found', 404);
  }

  pack.questions = pack.questions.filter(
    q => !questionIds.includes(q.toString())
  );

  await pack.save();

  res.json({
    pack,
    message: 'Questions removed from pack'
  });
});

const getPackQuestions = asyncHandler(async (req, res) => {
  const pack = await QuestionPack.findById(req.params.id);

  if (!pack) {
    throw createError('Question pack not found', 404);
  }

  let questions;

  if (pack.smartFilters && Object.keys(pack.smartFilters).length > 0) {
    // Use smart filters to get questions
    const query = {};

    if (pack.smartFilters.categories?.length) {
      query.category = { $in: pack.smartFilters.categories };
    }
    if (pack.smartFilters.difficulties?.length) {
      query.difficulty = { $in: pack.smartFilters.difficulties };
    }
    if (pack.smartFilters.questionTypes?.length) {
      query.questionType = { $in: pack.smartFilters.questionTypes };
    }
    if (pack.smartFilters.tags?.length) {
      query.tags = { $in: pack.smartFilters.tags };
    }

    query.status = 'active';

    questions = await Question.find(query)
      .populate('category', 'name nameEn icon color')
      .limit(pack.smartFilters.maxQuestions || 50);

  } else {
    // Use explicit question list
    questions = await Question.find({ _id: { $in: pack.questions } })
      .populate('category', 'name nameEn icon color');
  }

  // Shuffle if enabled
  if (pack.shuffleQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  res.json({ questions, count: questions.length });
});

const duplicatePack = asyncHandler(async (req, res) => {
  const originalPack = await QuestionPack.findById(req.params.id);

  if (!originalPack) {
    throw createError('Question pack not found', 404);
  }

  const newPack = await QuestionPack.create({
    name: `${originalPack.name} (Copy)`,
    nameEn: originalPack.nameEn ? `${originalPack.nameEn} (Copy)` : undefined,
    description: originalPack.description,
    coverImage: originalPack.coverImage,
    color: originalPack.color,
    icon: originalPack.icon,
    questions: [...originalPack.questions],
    shuffleQuestions: originalPack.shuffleQuestions,
    smartFilters: originalPack.smartFilters,
    gamesAvailable: originalPack.gamesAvailable,
    isPublic: false,
    createdBy: req.admin._id
  });

  res.status(201).json({ pack: newPack });
});

module.exports = {
  getQuestionPacks,
  getQuestionPack,
  createQuestionPack,
  updateQuestionPack,
  deleteQuestionPack,
  addQuestions,
  removeQuestions,
  getPackQuestions,
  duplicatePack
};
