const { Session } = require('../models');
const config = require('../config/env');
const { generateSessionId, formatLeaderboard } = require('../utils/helpers');

const createSession = async (gameType, settings = {}, hostSocketId) => {
  const sessionId = generateSessionId();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.sessionExpiryHours);

  const session = await Session.create({
    sessionId,
    gameType,
    hostSocketId,
    settings: {
      questionTime: settings.questionTime || 30,
      questionsCount: settings.questionsCount || 10,
      categories: settings.categories || []
    },
    expiresAt
  });

  return session;
};

const getSession = async (sessionId) => {
  return await Session.findOne({ sessionId })
    .populate('settings.categories')
    .populate('currentQuestion.questionId');
};

const addPlayer = async (sessionId, socketId, name, avatar = '') => {
  const session = await Session.findOne({ sessionId });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'waiting') {
    throw new Error('Game already started');
  }

  const existingPlayer = session.players.find(p => p.socketId === socketId);
  if (existingPlayer) {
    existingPlayer.name = name;
    existingPlayer.avatar = avatar;
    existingPlayer.isActive = true;
  } else {
    session.players.push({
      socketId,
      name,
      avatar,
      score: 0,
      isActive: true,
      lockedOut: false,
      joinedAt: new Date()
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
  }

  await session.save();
  return session;
};

const updateSessionStatus = async (sessionId, status) => {
  return await Session.findOneAndUpdate(
    { sessionId },
    { status },
    { new: true }
  );
};

const setCurrentQuestion = async (sessionId, questionId) => {
  return await Session.findOneAndUpdate(
    { sessionId },
    {
      'currentQuestion.questionId': questionId,
      'currentQuestion.startedAt': new Date(),
      'currentQuestion.answers': [],
      'currentQuestion.buzzes': [],
      status: 'question_active'
    },
    { new: true }
  ).populate('currentQuestion.questionId');
};

const addQuestionToAsked = async (sessionId, questionId) => {
  return await Session.findOneAndUpdate(
    { sessionId },
    { $addToSet: { questionsAsked: questionId } },
    { new: true }
  );
};

const recordAnswer = async (sessionId, socketId, answer, correct, pointsAwarded) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return null;

  session.currentQuestion.answers.push({
    socketId,
    answer,
    timestamp: new Date(),
    correct,
    pointsAwarded
  });

  if (correct && pointsAwarded > 0) {
    const player = session.players.find(p => p.socketId === socketId);
    if (player) {
      player.score += pointsAwarded;
    }
  }

  await session.save();
  return session;
};

const recordBuzz = async (sessionId, socketId) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return null;

  const position = session.currentQuestion.buzzes.length + 1;

  session.currentQuestion.buzzes.push({
    socketId,
    timestamp: new Date(),
    position
  });

  await session.save();
  return { session, position };
};

const lockOutPlayer = async (sessionId, socketId) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return null;

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    player.lockedOut = true;
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

  await session.save();
  return session;
};

const updatePlayerScore = async (sessionId, socketId, points) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return null;

  const player = session.players.find(p => p.socketId === socketId);
  if (player) {
    player.score += points;
  }

  await session.save();
  return session;
};

const getLeaderboard = async (sessionId) => {
  const session = await Session.findOne({ sessionId });

  if (!session) return [];

  return formatLeaderboard(session.players);
};

const endSession = async (sessionId) => {
  return await Session.findOneAndUpdate(
    { sessionId },
    { status: 'ended' },
    { new: true }
  );
};

const deleteSession = async (sessionId) => {
  return await Session.findOneAndDelete({ sessionId });
};

const getActivePlayers = (session) => {
  return session.players.filter(p => p.isActive);
};

const getAllLockedOut = (session) => {
  const activePlayers = getActivePlayers(session);
  return activePlayers.length > 0 && activePlayers.every(p => p.lockedOut);
};

module.exports = {
  createSession,
  getSession,
  addPlayer,
  removePlayer,
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
  getAllLockedOut
};
