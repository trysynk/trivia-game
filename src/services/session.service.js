const { Session, Settings } = require('../models');
const config = require('../config/env');
const { generateSessionId, formatLeaderboard, generatePlayerColor } = require('../utils/helpers');
const scoringService = require('./scoring.service');

const createSession = async (gameType, options = {}) => {
  const { settings = {}, hostSocketId, hostUser, questionPack } = options;

  const sessionId = generateSessionId();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.sessionExpiryHours);

  // Get default settings
  const systemSettings = await Settings.getSettings();
  const gameKey = gameType === 'everyone' ? 'everyoneAnswers' : 'buzzerMode';
  const defaults = systemSettings?.gameDefaults?.[gameKey] || {};

  const session = await Session.create({
    sessionId,
    gameType,
    hostSocketId,
    hostUser,
    questionPack,
    settings: {
      questionTime: settings.questionTime || defaults.questionTime || 30,
      questionsCount: settings.questionsCount || defaults.questionCount || 10,
      categories: settings.categories || [],
      showLeaderboardAfterEach: settings.showLeaderboardAfterEach ?? defaults.showLeaderboard ?? true,
      allowLateJoin: settings.allowLateJoin ?? true,
      maxPlayers: settings.maxPlayers || 50,
      buzzerLockoutTime: settings.buzzerLockoutTime || defaults.buzzerLockoutTime || 3
    },
    expiresAt
  });

  return session;
};

const getSession = async (sessionId) => {
  return Session.findOne({ sessionId })
    .populate('settings.categories', 'name nameEn icon color')
    .populate('questionPack', 'name nameEn')
    .populate('currentQuestion.questionId');
};

const addPlayer = async (sessionId, socketId, playerData) => {
  const { name, avatar = '' } = playerData;

  const session = await Session.findOne({ sessionId });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'waiting' && !session.settings.allowLateJoin) {
    throw new Error('Game already started and late join is disabled');
  }

  if (session.players.length >= session.settings.maxPlayers) {
    throw new Error('Session is full');
  }

  const existingIndex = session.players.findIndex(p => p.socketId === socketId);

  if (existingIndex >= 0) {
    session.players[existingIndex].name = name;
    session.players[existingIndex].avatar = avatar;
    session.players[existingIndex].isActive = true;
    session.players[existingIndex].lastActivityAt = new Date();
  } else {
    const usedColors = session.players.map(p => p.color);
    const color = generatePlayerColor(usedColors);

    session.players.push({
      socketId,
      name,
      avatar,
      color,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalAnswerTime: 0,
      isActive: true,
      lockedOut: false,
      joinedAt: new Date(),
      lastActivityAt: new Date()
    });
  }

  await session.save();
  return session;
};

const removePlayer = async (sessionId, socketId) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return null;

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    player.isActive = false;
    player.lastActivityAt = new Date();
  }

  await session.save();
  return session;
};

const reconnectPlayer = async (sessionId, socketId, newSocketId) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return null;

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    player.socketId = newSocketId;
    player.isActive = true;
    player.lastActivityAt = new Date();
  }

  await session.save();
  return session;
};

const updateSessionStatus = async (sessionId, status) => {
  const updates = { status };

  if (status === 'playing') {
    updates.startedAt = new Date();
  } else if (status === 'ended') {
    updates.endedAt = new Date();
  }

  return Session.findOneAndUpdate(
    { sessionId },
    updates,
    { new: true }
  );
};

const setCurrentQuestion = async (sessionId, question, questionNumber) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  const endsAt = new Date();
  endsAt.setSeconds(endsAt.getSeconds() + (question.timeLimit || session.settings.questionTime));

  session.currentQuestion = {
    questionId: question._id,
    questionNumber,
    startedAt: new Date(),
    endsAt,
    answers: [],
    buzzes: [],
    currentBuzzer: null,
    lockedOutPlayers: []
  };

  session.questions.push(question._id);
  session.status = 'question_active';

  await session.save();

  return Session.findOne({ sessionId })
    .populate('currentQuestion.questionId');
};

const addQuestionToAsked = async (sessionId, questionId, results = []) => {
  return Session.findOneAndUpdate(
    { sessionId },
    {
      $push: {
        questionsAsked: {
          questionId,
          askedAt: new Date(),
          results
        }
      }
    },
    { new: true }
  );
};

const recordAnswer = async (sessionId, socketId, answerData) => {
  const { answer, correct, responseTime, pointsAwarded, optionId } = answerData;

  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  session.currentQuestion.answers.push({
    socketId,
    answer,
    optionId,
    timestamp: new Date(),
    responseTime,
    correct,
    pointsAwarded
  });

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    if (correct) {
      player.correctAnswers = (player.correctAnswers || 0) + 1;
      player.score += pointsAwarded;
    } else {
      player.wrongAnswers = (player.wrongAnswers || 0) + 1;
    }

    if (responseTime) {
      player.totalAnswerTime = (player.totalAnswerTime || 0) + responseTime;
    }

    player.lastActivityAt = new Date();
  }

  await session.save();
  return session;
};

const recordBuzz = async (sessionId, socketId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  if (session.currentQuestion.lockedOutPlayers.includes(socketId)) {
    return { session, position: -1, lockedOut: true };
  }

  const position = session.currentQuestion.buzzes.length + 1;

  session.currentQuestion.buzzes.push({
    socketId,
    timestamp: new Date(),
    position
  });

  if (position === 1) {
    session.currentQuestion.currentBuzzer = socketId;
  }

  await session.save();
  return { session, position, lockedOut: false };
};

const lockOutPlayer = async (sessionId, socketId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  if (!session.currentQuestion.lockedOutPlayers.includes(socketId)) {
    session.currentQuestion.lockedOutPlayers.push(socketId);
  }

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    player.lockedOut = true;
  }

  if (session.currentQuestion.currentBuzzer === socketId) {
    session.currentQuestion.currentBuzzer = null;
  }

  await session.save();
  return session;
};

const resetLockedOut = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  session.players.forEach(player => {
    player.lockedOut = false;
  });

  if (session.currentQuestion) {
    session.currentQuestion.lockedOutPlayers = [];
    session.currentQuestion.currentBuzzer = null;
  }

  await session.save();
  return session;
};

const updatePlayerScore = async (sessionId, socketId, points) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    player.score += points;
    player.lastActivityAt = new Date();
  }

  await session.save();
  return session;
};

const getLeaderboard = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return [];

  return scoringService.getRankings(session.players);
};

const endSession = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  session.status = 'ended';
  session.endedAt = new Date();

  const rankings = scoringService.getRankings(session.players);

  await session.save();

  return { session, rankings };
};

const deleteSession = async (sessionId) => {
  return Session.findOneAndDelete({ sessionId });
};

const getActivePlayers = (session) => {
  return session.players.filter(p => p.isActive);
};

const getAllLockedOut = (session) => {
  const activePlayers = getActivePlayers(session);
  return activePlayers.length > 0 && activePlayers.every(p => p.lockedOut);
};

const hasEveryoneAnswered = (session) => {
  const activePlayers = getActivePlayers(session);
  const answeredSockets = new Set(session.currentQuestion.answers.map(a => a.socketId));

  return activePlayers.every(p => answeredSockets.has(p.socketId));
};

const getSessionStats = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) return null;

  const activePlayers = getActivePlayers(session);
  const totalAnswers = session.questionsAsked.reduce((sum, q) => sum + q.results.length, 0);
  const correctAnswers = session.questionsAsked.reduce((sum, q) =>
    sum + q.results.filter(r => r.correct).length, 0);

  return {
    playerCount: activePlayers.length,
    questionsAsked: session.questionsAsked.length,
    totalAnswers,
    correctAnswers,
    accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
    duration: session.startedAt
      ? Math.round((new Date() - session.startedAt) / 1000)
      : 0
  };
};

const cleanupExpiredSessions = async () => {
  const result = await Session.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  return result.deletedCount;
};

module.exports = {
  createSession,
  getSession,
  addPlayer,
  removePlayer,
  reconnectPlayer,
  updateSessionStatus,
  setCurrentQuestion,
  addQuestionToAsked,
  recordAnswer,
  recordBuzz,
  lockOutPlayer,
  resetLockedOut,
  updatePlayerScore,
  getLeaderboard,
  endSession,
  deleteSession,
  getActivePlayers,
  getAllLockedOut,
  hasEveryoneAnswered,
  getSessionStats,
  cleanupExpiredSessions
};
