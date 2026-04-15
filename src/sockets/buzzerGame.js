const { sessionService, questionService, scoringService, gameService } = require('../services');
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

      const activePlayers = sessionService.getActivePlayers(session);
      if (activePlayers.length < 1) {
        return socket.emit('error', { message: 'Need at least 1 player to start' });
      }

      // Create game record
      const game = await gameService.createGame('buzzer', {
        categories: session.settings.categories.map(c => c._id || c),
        questionPack: session.questionPack,
        settings: session.settings,
        owner: session.hostUser
      });

      session.game = game._id;
      await session.save();

      await sessionService.updateSessionStatus(sessionId, 'playing');
      io.to(sessionId).emit('game-started', {
        playerCount: activePlayers.length,
        questionsCount: session.settings.questionsCount
      });

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

      const { position, lockedOut } = await sessionService.recordBuzz(sessionId, socket.id);

      if (lockedOut) {
        buzzingEnabled.set(sessionId, true);
        return;
      }

      io.to(sessionId).emit('player-buzzed', {
        playerId: socket.id,
        playerName: player.name,
        playerColor: player.color,
        position
      });

      const answerTime = session.settings.buzzerLockoutTime || 3;
      const timer = setTimeout(async () => {
        await handleBuzzerTimeout(io, sessionId, socket.id);
      }, answerTime * 1000);

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

    const questionsAsked = session.questionsAsked.length;
    const categoryIds = session.settings.categories.map(c => c._id || c);

    if (questionsAsked >= session.settings.questionsCount) {
      return await endBuzzerGame(io, sessionId);
    }

    const excludeIds = session.questionsAsked.map(q => q.questionId?.toString() || q.toString());

    const question = await questionService.getRandomQuestion(categoryIds, {
      excludeQuestionIds: excludeIds,
      gameType: 'buzzer'
    });

    if (!question) {
      return await endBuzzerGame(io, sessionId);
    }

    await sessionService.setCurrentQuestion(sessionId, question, questionsAsked + 1);

    const preparedQuestion = questionService.prepareQuestionForClient(question, {
      includeAnswer: false,
      gameType: 'buzzer'
    });

    io.to(sessionId).emit('new-buzzer-question', {
      question: preparedQuestion,
      questionNumber: questionsAsked + 1,
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
      // Calculate score with speed bonus
      const buzz = session.currentQuestion.buzzes.find(b => b.socketId === playerId);
      const responseTime = buzz ? (new Date(buzz.timestamp) - new Date(session.currentQuestion.startedAt)) / 1000 : 0;

      const scoreResult = await scoringService.calculateScore({
        basePoints: question.points,
        isCorrect: true,
        responseTimeSeconds: responseTime,
        gameType: 'buzzer',
        difficulty: question.difficulty,
        buzzerPosition: buzz?.position
      });

      await sessionService.recordAnswer(sessionId, playerId, {
        answer: 'buzzer_correct',
        correct: true,
        responseTime,
        pointsAwarded: scoreResult.totalPoints
      });

      await questionService.markQuestionPlayed(question._id, { correct: true });

      const leaderboard = await sessionService.getLeaderboard(sessionId);

      const preparedAnswer = questionService.prepareQuestionForClient(question, {
        includeAnswer: true,
        gameType: 'buzzer'
      });

      io.to(sessionId).emit('buzzer-correct', {
        playerId,
        playerName: player?.name,
        playerColor: player?.color,
        pointsAwarded: scoreResult.totalPoints,
        speedBonus: scoreResult.speedBonus,
        correctAnswer: preparedAnswer.answer,
        answerType: preparedAnswer.answerType,
        leaderboard
      });

      currentBuzzer.delete(sessionId);

      // Store results
      await sessionService.addQuestionToAsked(sessionId, question._id, [{
        playerId,
        playerName: player?.name,
        correct: true,
        pointsAwarded: scoreResult.totalPoints
      }]);

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

      await sessionService.recordAnswer(sessionId, playerId, {
        answer: 'buzzer_wrong',
        correct: false,
        pointsAwarded: -pointsLost
      });

      await sessionService.lockOutPlayer(sessionId, playerId);

      io.to(sessionId).emit('buzzer-wrong', {
        playerId,
        playerName: player?.name,
        playerColor: player?.color,
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
    await questionService.markQuestionPlayed(question._id, { correct: false });

    const preparedAnswer = questionService.prepareQuestionForClient(question, {
      includeAnswer: true,
      gameType: 'buzzer'
    });

    // Store results
    await sessionService.addQuestionToAsked(sessionId, question._id, []);

    io.to(sessionId).emit('all-locked-out', {
      correctAnswer: preparedAnswer.answer,
      answerType: preparedAnswer.answerType
    });

    const questionsAsked = session.questionsAsked.length + 1;

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

    const { session, rankings } = await sessionService.endSession(sessionId);

    // Complete game record
    if (session.game) {
      await gameService.completeGame(session.game, {
        players: session.players.filter(p => p.isActive).map(p => ({
          name: p.name,
          score: p.score,
          correctAnswers: p.correctAnswers,
          wrongAnswers: p.wrongAnswers,
          totalAnswerTime: p.totalAnswerTime
        }))
      });
    }

    const stats = await sessionService.getSessionStats(sessionId);

    io.to(sessionId).emit('game-ended', {
      finalLeaderboard: rankings,
      winner: rankings[0] || null,
      stats: {
        ...stats,
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
