const { Tag, Question } = require('../models');
const { asyncHandler, createError } = require('../utils/helpers');

const getTags = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { nameEn: { $regex: search, $options: 'i' } }
    ];
  }

  const tags = await Tag.find(query)
    .populate('createdBy', 'username displayName')
    .sort({ questionCount: -1 });

  res.json({ tags });
});

const getTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id)
    .populate('createdBy', 'username displayName');

  if (!tag) {
    throw createError('Tag not found', 404);
  }

  res.json({ tag });
});

const createTag = asyncHandler(async (req, res) => {
  const { name, nameEn, color } = req.body;

  const existingTag = await Tag.findOne({ name });
  if (existingTag) {
    throw createError('Tag already exists', 400);
  }

  const tag = await Tag.create({
    name,
    nameEn,
    color,
    createdBy: req.admin._id
  });

  res.status(201).json({ tag });
});

const updateTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);

  if (!tag) {
    throw createError('Tag not found', 404);
  }

  const { name, nameEn, color } = req.body;

  if (name) tag.name = name;
  if (nameEn) tag.nameEn = nameEn;
  if (color) tag.color = color;

  await tag.save();

  res.json({ tag });
});

const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);

  if (!tag) {
    throw createError('Tag not found', 404);
  }

  // Remove tag from all questions
  await Question.updateMany(
    { tags: tag._id },
    { $pull: { tags: tag._id } }
  );

  await tag.deleteOne();

  res.json({ message: 'Tag deleted successfully' });
});

const getTagQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const tag = await Tag.findById(req.params.id);
  if (!tag) {
    throw createError('Tag not found', 404);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [questions, total] = await Promise.all([
    Question.find({ tags: tag._id })
      .populate('category', 'name nameEn icon color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Question.countDocuments({ tags: tag._id })
  ]);

  res.json({
    tag,
    questions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const updateTagCount = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);

  if (!tag) {
    throw createError('Tag not found', 404);
  }

  const count = await Question.countDocuments({ tags: tag._id });
  tag.questionCount = count;
  await tag.save();

  res.json({ tag });
});

module.exports = {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getTagQuestions,
  updateTagCount
};
