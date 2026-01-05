const { statsService } = require('../services');
const { asyncHandler } = require('../utils/helpers');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await statsService.getDashboardStats();
  res.json(stats);
});

const getQuestionStats = asyncHandler(async (req, res) => {
  const { category, dateFrom, dateTo } = req.query;

  const stats = await statsService.getQuestionStats({
    category,
    dateFrom,
    dateTo
  });

  res.json(stats);
});

const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getCategoryStats();
  res.json({ categories: stats });
});

const getGameStats = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, gameType } = req.query;

  const stats = await statsService.getGameStats({
    dateFrom,
    dateTo,
    gameType
  });

  res.json(stats);
});

const getActivityStats = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const stats = await statsService.getActivityStats(parseInt(days));

  res.json(stats);
});

const getSystemHealth = asyncHandler(async (req, res) => {
  const health = await statsService.getSystemHealth();
  res.json(health);
});

module.exports = {
  getDashboard,
  getQuestionStats,
  getCategoryStats,
  getGameStats,
  getActivityStats,
  getSystemHealth
};
