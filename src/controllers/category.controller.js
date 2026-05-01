const { Category, Question } = require('../models');
const { asyncHandler, createError } = require('../utils/helpers');
const { validateCategory } = require('../utils/validators');

const getCategories = asyncHandler(async (req, res) => {
  const { active } = req.query;

  const query = {};
  if (active === 'true') {
    query.isActive = true;
  }

  // Restriction filter: show category if no restriction OR current user is whitelisted
  // Handle both missing field and empty array
  const noRestriction = {
    $or: [
      { restrictedToUsers: { $exists: false } },
      { restrictedToUsers: { $size: 0 } }
    ]
  };
  if (req.user) {
    query.$or = [
      ...noRestriction.$or,
      { restrictedToUsers: req.user._id }
    ];
  } else {
    Object.assign(query, noRestriction);
  }

  const categories = await Category.find(query).sort({ order: 1, createdAt: 1 });

  res.json({ categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw createError('Category not found', 404);
  }

  // Restriction check
  if (category.restrictedToUsers?.length > 0) {
    const userId = req.user?._id?.toString();
    const allowed = category.restrictedToUsers.some(id => id.toString() === userId);
    if (!allowed) throw createError('Category not found', 404);
  }

  res.json({ category });
});

const createCategory = asyncHandler(async (req, res) => {
  const validation = validateCategory(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }

  const { name, nameEn, icon, iconType, coverImage, color, order } = req.body;

  const category = await Category.create({
    name,
    nameEn,
    icon,
    iconType,
    coverImage,
    color,
    order
  });

  res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, nameEn, icon, iconType, coverImage, color, order, isActive } = req.body;

  if (name !== undefined) {
    const validation = validateCategory({ name });
    if (!validation.isValid) {
      throw createError(validation.errors.join(', '), 400);
    }
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, nameEn, icon, iconType, coverImage, color, order, isActive },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw createError('Category not found', 404);
  }

  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw createError('Category not found', 404);
  }

  const questionCount = await Question.countDocuments({ category: req.params.id });
  if (questionCount > 0) {
    throw createError(`Cannot delete category with ${questionCount} questions. Delete questions first or deactivate the category.`, 400);
  }

  await category.deleteOne();

  res.json({ message: 'Category deleted successfully' });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
