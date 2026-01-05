const { customAlphabet } = require('nanoid');
const { SPEED_BONUS, PLAYER_COLORS } = require('./constants');

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
      color: player.color,
      score: player.score,
      correctAnswers: player.correctAnswers || 0,
      wrongAnswers: player.wrongAnswers || 0
    }));
};

const generatePlayerColor = (usedColors = []) => {
  const availableColors = PLAYER_COLORS.filter(c => !usedColors.includes(c));
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateSessionId,
  calculateSpeedBonus,
  shuffleArray,
  formatLeaderboard,
  generatePlayerColor,
  asyncHandler,
  createError,
  sanitizeFilename,
  formatBytes,
  generateRandomCode,
  sleep
};
