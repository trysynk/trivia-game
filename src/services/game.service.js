const { Game, Question, Category } = require('../models');

const createGame = async (gameType, categories, teams = []) => {
  const game = await Game.create({
    gameType,
    categories,
    teams: teams.map(team => ({
      name: team.name,
      icon: team.icon,
      color: team.color,
      finalScore: 0
    })),
    questionsPlayed: []
  });

  return game;
};

const updateGame = async (gameId, updates) => {
  return await Game.findByIdAndUpdate(gameId, updates, { new: true });
};

const completeGame = async (gameId, data) => {
  const { teams, players, questionsPlayed, winner, duration } = data;

  const updates = {
    completedAt: new Date(),
    duration
  };

  if (questionsPlayed) {
    updates.questionsPlayed = questionsPlayed;
  }

  if (teams) {
    updates.teams = teams;
    updates.winner = winner;
  }

  if (players) {
    updates.players = players.map((player, index) => ({
      name: player.name,
      finalScore: player.score,
      rank: index + 1
    }));
  }

  return await Game.findByIdAndUpdate(gameId, updates, { new: true });
};

const getGameHistory = async (options = {}) => {
  const { page = 1, limit = 10, gameType } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (gameType) {
    query.gameType = gameType;
  }

  const [games, total] = await Promise.all([
    Game.find(query)
      .populate('categories', 'name nameEn icon color')
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
  const [totalGames, gamesByType, totalQuestions, totalCategories, recentGames] = await Promise.all([
    Game.countDocuments(),
    Game.aggregate([
      { $group: { _id: '$gameType', count: { $sum: 1 } } }
    ]),
    Question.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    Game.find()
      .populate('categories', 'name nameEn')
      .sort({ createdAt: -1 })
      .limit(5)
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
    recentGames
  };
};

const getGameById = async (gameId) => {
  return await Game.findById(gameId)
    .populate('categories', 'name nameEn icon color')
    .populate('questionsPlayed');
};

module.exports = {
  createGame,
  updateGame,
  completeGame,
  getGameHistory,
  getGameStats,
  getGameById
};
