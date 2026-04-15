const { Game, Question, Category } = require('../models');
const { customAlphabet } = require('nanoid');
const scoringService = require('./scoring.service');

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const createGame = async (gameType, options = {}) => {
  const { categories, teams = [], questionPack, settings = {}, owner } = options;

  const game = await Game.create({
    shortId: nanoid(),
    gameType,
    categories,
    questionPack,
    settings,
    teams: teams.map(team => ({
      name: team.name,
      icon: team.icon,
      color: team.color,
      score: [],
      helpersUsed: {
        skip: false,
        double: false,
        hint: false
      },
      finalScore: 0
    })),
    questionsPlayed: [],
    status: 'waiting',
    owner: owner || undefined
  });

  return game;
};

const startGame = async (gameId) => {
  return Game.findByIdAndUpdate(
    gameId,
    {
      status: 'playing',
      startedAt: new Date()
    },
    { new: true }
  );
};

const updateGame = async (gameId, updates) => {
  return Game.findByIdAndUpdate(gameId, updates, { new: true });
};

const addQuestionResult = async (gameId, questionData) => {
  const {
    questionId,
    teamResults = [],
    playerResults = []
  } = questionData;

  const game = await Game.findById(gameId);
  if (!game) return null;

  game.questionsPlayed.push({
    question: questionId,
    teamResults,
    playerResults,
    playedAt: new Date()
  });

  await game.save();
  return game;
};

const updateTeamScore = async (gameId, teamIndex, points, roundNumber) => {
  const game = await Game.findById(gameId);
  if (!game || !game.teams[teamIndex]) return null;

  game.teams[teamIndex].score.push({
    round: roundNumber,
    points,
    timestamp: new Date()
  });

  game.teams[teamIndex].finalScore += points;

  await game.save();
  return game;
};

const useTeamHelper = async (gameId, teamIndex, helperType) => {
  const game = await Game.findById(gameId);
  if (!game || !game.teams[teamIndex]) return null;

  if (game.teams[teamIndex].helpersUsed[helperType]) {
    throw new Error(`Helper ${helperType} already used`);
  }

  game.teams[teamIndex].helpersUsed[helperType] = true;

  await game.save();
  return game;
};

const completeGame = async (gameId, data = {}) => {
  const game = await Game.findById(gameId);
  if (!game) return null;

  game.status = 'completed';
  game.completedAt = new Date();

  if (data.teams) {
    game.teams = data.teams;
  }

  if (data.players) {
    game.players = data.players.map((player, index) => ({
      name: player.name,
      finalScore: player.score,
      rank: index + 1,
      correctAnswers: player.correctAnswers || 0,
      wrongAnswers: player.wrongAnswers || 0,
      avgResponseTime: player.totalAnswerTime && player.correctAnswers
        ? Math.round(player.totalAnswerTime / player.correctAnswers)
        : 0
    }));
  }

  if (game.gameType === 'main' && game.teams.length > 0) {
    const winner = scoringService.determineWinner(game.teams, 'main');
    if (winner) {
      game.winner = winner;
    }
  } else if (game.players.length > 0) {
    const winner = scoringService.determineWinner(game.players, game.gameType);
    if (winner) {
      game.winner = winner;
    }
  }

  if (game.startedAt) {
    game.duration = Math.round((game.completedAt - game.startedAt) / 1000);
  }

  await game.save();

  for (const played of game.questionsPlayed) {
    const hasCorrect = played.playerResults?.some(r => r.correct) ||
                       played.teamResults?.some(r => r.correct);

    await Question.findByIdAndUpdate(played.question, {
      $inc: {
        'stats.timesPlayed': 1,
        'stats.timesCorrect': hasCorrect ? 1 : 0
      }
    });
  }

  await game.complete();

  return game;
};

const getGameHistory = async (options = {}) => {
  const { page = 1, limit = 10, gameType, status, dateFrom, dateTo } = options;
  const skip = (page - 1) * limit;

  const query = {};

  if (gameType) query.gameType = gameType;
  if (status) query.status = status;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const [games, total] = await Promise.all([
    Game.find(query)
      .populate('categories', 'name nameEn icon color')
      .populate('questionPack', 'name nameEn')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Game.countDocuments(query)
  ]);

  return {
    games,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

const getGameStats = async () => {
  const [totalGames, gamesByType, totalQuestions, totalCategories, recentGames, avgDuration] = await Promise.all([
    Game.countDocuments({ status: 'completed' }),
    Game.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$gameType', count: { $sum: 1 } } }
    ]),
    Question.countDocuments({ status: 'active' }),
    Category.countDocuments({ isActive: true }),
    Game.find({ status: 'completed' })
      .populate('categories', 'name nameEn')
      .sort({ createdAt: -1 })
      .limit(5),
    Game.aggregate([
      { $match: { status: 'completed', duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ])
  ]);

  const gameTypeStats = {
    main: 0,
    everyone: 0,
    buzzer: 0
  };

  gamesByType.forEach(item => {
    gameTypeStats[item._id] = item.count;
  });

  return {
    totalGames,
    totalQuestions,
    totalCategories,
    gamesByType: gameTypeStats,
    recentGames,
    avgDuration: avgDuration[0]?.avgDuration || 0
  };
};

const getGameById = async (gameId) => {
  return Game.findById(gameId)
    .populate('categories', 'name nameEn icon color')
    .populate('questionPack', 'name nameEn')
    .populate({
      path: 'questionsPlayed.question',
      select: 'shortId questionType questionContent difficulty'
    });
};

const getGameByShortId = async (shortId) => {
  return Game.findOne({ shortId })
    .populate('categories', 'name nameEn icon color')
    .populate('questionPack', 'name nameEn');
};

const deleteGame = async (gameId) => {
  return Game.findByIdAndDelete(gameId);
};

module.exports = {
  createGame,
  startGame,
  updateGame,
  addQuestionResult,
  updateTeamScore,
  useTeamHelper,
  completeGame,
  getGameHistory,
  getGameStats,
  getGameById,
  getGameByShortId,
  deleteGame
};
