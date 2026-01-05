const { gameService } = require('../services');
const { asyncHandler, createError } = require('../utils/helpers');
const { validateGameType } = require('../utils/validators');

const createGame = asyncHandler(async (req, res) => {
  const { gameType, categories, teams } = req.body;

  if (!validateGameType(gameType)) {
    throw createError('Invalid game type', 400);
  }

  if (!categories || categories.length === 0) {
    throw createError('At least one category is required', 400);
  }

  const game = await gameService.createGame(gameType, categories, teams);

  res.status(201).json({ game });
});

const updateGame = asyncHandler(async (req, res) => {
  const game = await gameService.updateGame(req.params.id, req.body);

  if (!game) {
    throw createError('Game not found', 404);
  }

  res.json({ game });
});

const completeGame = asyncHandler(async (req, res) => {
  const { teams, players, questionsPlayed, winner, duration } = req.body;

  const game = await gameService.completeGame(req.params.id, {
    teams,
    players,
    questionsPlayed,
    winner,
    duration
  });

  if (!game) {
    throw createError('Game not found', 404);
  }

  res.json({ game });
});

const getGameHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, gameType } = req.query;

  const result = await gameService.getGameHistory({
    page: parseInt(page),
    limit: parseInt(limit),
    gameType
  });

  res.json(result);
});

const getGameStats = asyncHandler(async (req, res) => {
  const stats = await gameService.getGameStats();
  res.json(stats);
});

const getGame = asyncHandler(async (req, res) => {
  const game = await gameService.getGameById(req.params.id);

  if (!game) {
    throw createError('Game not found', 404);
  }

  res.json({ game });
});

module.exports = {
  createGame,
  updateGame,
  completeGame,
  getGameHistory,
  getGameStats,
  getGame
};
