const { sessionService, questionService } = require('../services');
const { BUZZER_ANSWER_TIME, WRONG_ANSWER_PENALTY_RATIO } = require('../utils/constants');

const buzzingEnabled = new Map();
const currentBuzzer = new Map();
const buzzerTimers = new Map();

const setupBuzzerGameHandlers = (io, socket) => {
  socket.on('start-buzzer-game', async ({ sessionId }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session) {
        return socket.emit('error', { message: 'Session not found' });
      }

      if (session.hostSocketId !== socket.id) {
        return socket.emit('error', { message: 'Only host can start the game' });
      }

      if (session.players.filter(p => p.isActive).length < 1) {
        return socket.emit('error', { message: 'Need at least 1 player to start' });
      }

      await sessionService.updateSessionStatus(sessionId, 'playing');
      io.to(sessionId).emit('game-started', {});

      await sendBuzzerQuestion(io, sessionId);
    } catch (error) {
      console.error('Error starting buzzer game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('buzz', async ({ sessionId }) => {
    try {
      if (!buzzingEnabled.get(sessionId)) {
        return;
      }

      const session = await sessionService.getSession(sessionId);

      if (!session || session.status !== 'question_active') {
        return;
      }

      const player = session.players.find(p => p.socketId === socket.id && p.isActive);
      if (!player || player.lockedOut) {
        return;
      }

      buzzingEnabled.set(sessionId, false);
      currentBuzzer.set(sessionId, socket.id);

      const { position } = await sessionService.recordBuzz(sessionId, socket.id);

      io.to(sessionId).emit('player-buzzed', {
        playerId: socket.id,
        playerName: player.name,
        position
      });

      const timer = setTimeout(async () => {
        await handleBuzzerTimeout(io, sessionId, socket.id);
      }, BUZZER_ANSWER_TIME);

      buzzerTimers.set(sessionId, timer);
    } catch (error) {
      console.error('Error handling buzz:', error);
    }
  });

  socket.on('judge-decision', async ({ sessionId, correct }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session) return;
      if (session.hostSocketId !== socket.id) return;

      clearBuzzerTimer(sessionId);

      const buzzerId = currentBuzzer.get(sessionId);
      if (!buzzerId) return;

      await processJudgeDecision(io, sessionId, buzzerId, correct);
    } catch (error) {
      console.error('Error handling judge decision:', error);
    }
  });

  socket.on('skip-buzzer-question', async ({ sessionId }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session) return;
      if (session.hostSocketId !== socket.id) return;

      clearBuzzerTimer(sessionId);
      buzzingEnabled.set(sessionId, false);
      currentBuzzer.delete(sessionId);

      await showAnswerAndNext(io, sessionId);
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  });

  socket.on('end-buzzer-game', async ({ sessionId }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session) return;
      if (session.hostSocketId !== socket.id) return;

      clearBuzzerTimer(sessionId);
      await endBuzzerGame(io, sessionId);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  });
};

const sendBuzzerQuestion = async (io, sessionId) => {
  try {
    await sessionService.resetLockedOut(sessionId);

    const session = await sessionService.getSession(sessionId);

    if (!session) return;

    const questionsAsked = session.questionsAsked.map(q => q.toString());
    const categoryIds = session.settings.categories.map(c => c._id || c);

    if (questionsAsked.length >= session.settings.questionsCount) {
      return await endBuzzerGame(io, sessionId);
    }

    const question = await questionService.getRandomQuestion(categoryIds, questionsAsked);

    if (!question) {
      return await endBuzzerGame(io, sessionId);
    }

    await sessionService.addQuestionToAsked(sessionId, question._id);
    await sessionService.setCurrentQuestion(sessionId, question._id);

    const preparedQuestion = {
      id: question._id,
      type: question.questionType,
      content: question.questionContent,
      difficulty: question.difficulty,
      points: question.points
    };

    io.to(sessionId).emit('new-buzzer-question', {
      question: preparedQuestion,
      questionNumber: questionsAsked.length + 1,
      totalQuestions: session.settings.questionsCount
    });

    buzzingEnabled.set(sessionId, true);
    currentBuzzer.delete(sessionId);
  } catch (error) {
    console.error('Error sending buzzer question:', error);
  }
};

const handleBuzzerTimeout = async (io, sessionId, playerId) => {
  try {
    await processJudgeDecision(io, sessionId, playerId, false);
  } catch (error) {
    console.error('Error handling buzzer timeout:', error);
  }
};

const processJudgeDecision = async (io, sessionId, playerId, correct) => {
  try {
    const session = await sessionService.getSession(sessionId);

    if (!session) return;

    const question = session.currentQuestion.questionId;
    const player = session.players.find(p => p.socketId === playerId);

    if (correct) {
      const pointsAwarded = question.points;
      await sessionService.updatePlayerScore(sessionId, playerId, pointsAwarded);
      await questionService.markQuestionPlayed(question._id, true);

      const leaderboard = await sessionService.getLeaderboard(sessionId);

      const preparedAnswer = questionService.prepareQuestionForClient(question, true);

      io.to(sessionId).emit('buzzer-correct', {
        playerId,
        playerName: player?.name,
        pointsAwarded,
        correctAnswer: preparedAnswer.answer,
        answerType: preparedAnswer.answerType,
        leaderboard
      });

      currentBuzzer.delete(sessionId);

      const updatedSession = await sessionService.getSession(sessionId);
      const questionsAsked = updatedSession.questionsAsked.length;

      if (questionsAsked >= updatedSession.settings.questionsCount) {
        setTimeout(async () => {
          await endBuzzerGame(io, sessionId);
        }, 3000);
      } else {
        setTimeout(async () => {
          await sendBuzzerQuestion(io, sessionId);
        }, 3000);
      }
    } else {
      const pointsLost = Math.round(question.points * WRONG_ANSWER_PENALTY_RATIO);
      await sessionService.updatePlayerScore(sessionId, playerId, -pointsLost);
      await sessionService.lockOutPlayer(sessionId, playerId);

      io.to(sessionId).emit('buzzer-wrong', {
        playerId,
        playerName: player?.name,
        pointsLost
      });

      currentBuzzer.delete(sessionId);

      const updatedSession = await sessionService.getSession(sessionId);
      const allLockedOut = sessionService.getAllLockedOut(updatedSession);

      if (allLockedOut) {
        await showAnswerAndNext(io, sessionId);
      } else {
        buzzingEnabled.set(sessionId, true);
      }
    }
  } catch (error) {
    console.error('Error processing judge decision:', error);
  }
};

const showAnswerAndNext = async (io, sessionId) => {
  try {
    const session = await sessionService.getSession(sessionId);

    if (!session) return;

    const question = session.currentQuestion.questionId;
    await questionService.markQuestionPlayed(question._id, false);

    const preparedAnswer = questionService.prepareQuestionForClient(question, true);

    io.to(sessionId).emit('all-locked-out', {
      correctAnswer: preparedAnswer.answer,
      answerType: preparedAnswer.answerType
    });

    const questionsAsked = session.questionsAsked.length;

    if (questionsAsked >= session.settings.questionsCount) {
      setTimeout(async () => {
        await endBuzzerGame(io, sessionId);
      }, 3000);
    } else {
      setTimeout(async () => {
        await sendBuzzerQuestion(io, sessionId);
      }, 3000);
    }
  } catch (error) {
    console.error('Error showing answer:', error);
  }
};

const endBuzzerGame = async (io, sessionId) => {
  try {
    buzzingEnabled.delete(sessionId);
    currentBuzzer.delete(sessionId);
    clearBuzzerTimer(sessionId);

    await sessionService.updateSessionStatus(sessionId, 'ended');

    const leaderboard = await sessionService.getLeaderboard(sessionId);
    const session = await sessionService.getSession(sessionId);

    io.to(sessionId).emit('game-ended', {
      finalLeaderboard: leaderboard,
      winner: leaderboard[0] || null,
      stats: {
        totalQuestions: session.questionsAsked.length,
        totalPlayers: session.players.filter(p => p.isActive).length
      }
    });
  } catch (error) {
    console.error('Error ending buzzer game:', error);
  }
};

const clearBuzzerTimer = (sessionId) => {
  const timer = buzzerTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    buzzerTimers.delete(sessionId);
  }
};

module.exports = { setupBuzzerGameHandlers };
