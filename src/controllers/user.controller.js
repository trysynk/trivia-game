const { User, Game, Category } = require('../models');
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
  const { categories, teams } = req.body;

  const user = await req.user.useGame();

  const game = await Game.create({
    gameType: 'main',
    categories: categories || [],
    teams: (teams || []).map(t => ({
      name: t.name,
      icon: t.icon,
      color: t.color,
      finalScore: 0
    })),
    status: 'in_progress',
    startedAt: new Date(),
    owner: user._id
  });

  user.gamesHistory.push({ game: game._id });
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    gameId: game._id,
    user: {
      id: user._id,
      gamesRemaining: user.gamesRemaining,
      totalGamesPlayed: user.totalGamesPlayed
    }
  });
});

const completeMyGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { teams, questionsPlayed, winner, duration } = req.body;

  const game = await Game.findOne({ _id: gameId, owner: req.user._id });
  if (!game) throw createError('اللعبة غير موجودة', 404);
  if (game.status === 'completed') throw createError('اللعبة منتهية بالفعل', 400);

  if (teams) {
    game.teams = teams.map(t => ({
      name: t.name,
      icon: t.icon,
      color: t.color,
      finalScore: t.score || t.finalScore || 0,
      helpersUsed: t.helpersUsed || {}
    }));
  }

  if (questionsPlayed) {
    game.questionsPlayed = questionsPlayed;
  }

  if (winner) {
    game.winner = winner;
  }

  game.status = 'completed';
  game.endedAt = new Date();
  game.completedAt = game.endedAt;
  game.duration = duration || Math.round((game.endedAt - game.startedAt) / 1000);

  await game.save();

  res.json({
    success: true,
    game: {
      id: game._id,
      status: game.status,
      duration: game.duration,
      winner: game.winner
    }
  });
});

const getMyGames = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { owner: req.user._id, status: 'completed' };

  const [games, total] = await Promise.all([
    Game.find(filter)
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('categories', 'name nameEn color icon')
      .select('shortId gameType teams players winner categories startedAt endedAt duration status'),
    Game.countDocuments(filter)
  ]);

  res.json({
    success: true,
    games: games.map(g => ({
      id: g._id,
      shortId: g.shortId,
      gameType: g.gameType,
      playedAt: g.endedAt || g.startedAt,
      duration: g.duration,
      teams: g.teams.map(t => ({
        name: t.name,
        icon: t.icon,
        color: t.color,
        score: t.finalScore
      })),
      players: g.players.map(p => ({
        name: p.name,
        avatar: p.avatar,
        score: p.finalScore,
        rank: p.rank
      })),
      winner: g.winner,
      categories: g.categories.map(c => ({
        name: c.name,
        nameEn: c.nameEn,
        color: c.color,
        icon: c.icon
      }))
    })),
    total,
    page,
    pages: Math.ceil(total / limit)
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
  completeMyGame,
  getMyGames,
  forgotPassword,
  resetPassword
};
