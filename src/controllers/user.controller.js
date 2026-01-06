const { User } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const { asyncHandler, createError } = require('../utils/helpers');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id, type: 'user' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn || '7d'
  });
};

// Send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gamesRemaining: user.gamesRemaining,
      totalGamesPlayed: user.totalGamesPlayed
    }
  });
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('البريد الإلكتروني مستخدم بالفعل', 400);
  }

  const user = await User.create({ name, email, phone, password });
  createSendToken(user, 201, res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('يرجى إدخال البريد الإلكتروني وكلمة المرور', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw createError('بريد إلكتروني أو كلمة مرور غير صحيحة', 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      gamesRemaining: req.user.gamesRemaining,
      totalGamesPlayed: req.user.totalGamesPlayed,
      totalGamesPurchased: req.user.totalGamesPurchased
    }
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gamesRemaining: user.gamesRemaining
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

const useGame = asyncHandler(async (req, res) => {
  const user = await req.user.useGame();

  res.json({
    success: true,
    user: {
      id: user._id,
      gamesRemaining: user.gamesRemaining,
      totalGamesPlayed: user.totalGamesPlayed
    }
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw createError('لا يوجد مستخدم بهذا البريد الإلكتروني', 404);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // TODO: Send email with reset link
  // For now, just return success
  res.json({
    success: true,
    message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw createError('رابط غير صالح أو منتهي الصلاحية', 400);
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  getMe,
  updateMe,
  logout,
  useGame,
  forgotPassword,
  resetPassword
};
