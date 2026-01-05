const { customAlphabet } = require('nanoid');
const { SPEED_BONUS } = require('./constants');

const generateSessionId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const calculateSpeedBonus = (elapsedSeconds, basePoints) => {
  if (elapsedSeconds <= SPEED_BONUS.FULL.maxSeconds) {
    return Math.round(basePoints * SPEED_BONUS.FULL.multiplier);
  }
  if (elapsedSeconds <= SPEED_BONUS.HIGH.maxSeconds) {
    return Math.round(basePoints * SPEED_BONUS.HIGH.multiplier);
  }
  if (elapsedSeconds <= SPEED_BONUS.MEDIUM.maxSeconds) {
    return Math.round(basePoints * SPEED_BONUS.MEDIUM.multiplier);
  }
  return Math.round(basePoints * SPEED_BONUS.LOW.multiplier);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const formatLeaderboard = (players) => {
  return players
    .filter(p => p.isActive)
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      rank: index + 1,
      socketId: player.socketId,
      name: player.name,
      avatar: player.avatar,
      score: player.score
    }));
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

module.exports = {
  generateSessionId,
  calculateSpeedBonus,
  shuffleArray,
  formatLeaderboard,
  asyncHandler,
  createError
};
