const { sessionService, questionService, scoringService, gameService } = require('../services');
const { DEFAULT_QUESTION_TIME } = require('../utils/constants');

const questionTimers = new Map();

const setupEveryoneGameHandlers = (io, socket) => {
  socket.on('start-everyone-game', async ({ sessionId }) => {
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
      const game = await gameService.createGame('everyone', {
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

      await sendNextQuestion(io, sessionId);
    } catch (error) {
      console.error('Error starting everyone game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('submit-answer', async ({ sessionId, answer, optionId }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session || session.status !== 'question_active') {
        return;
      }

      const player = session.players.find(p => p.socketId === socket.id && p.isActive);
      if (!player) {
        return;
      }

      const alreadyAnswered = session.currentQuestion.answers.some(
        a => a.socketId === socket.id
      );
      if (alreadyAnswered) {
        return;
      }

      const question = session.currentQuestion.questionId;
      const startedAt = new Date(session.currentQuestion.startedAt).getTime();
      const answeredAt = Date.now();
      const responseTime = (answeredAt - startedAt) / 1000;

      // Check answer using question service
      const answerResult = questionService.checkAnswer(question, {
        text: answer,
        optionId,
        number: typeof answer === 'number' ? answer : undefined
      }, { answerTime: responseTime });

      // Calculate score with speed bonus
      const scoreResult = await scoringService.calculateScore({
        basePoints: question.points,
        isCorrect: answerResult.isCorrect,
        responseTimeSeconds: responseTime,
        gameType: 'everyone',
        difficulty: question.difficulty,
        isFirstCorrect: !session.currentQuestion.answers.some(a => a.correct)
      });

      await sessionService.recordAnswer(sessionId, socket.id, {
        answer: answer || optionId,
        optionId,
        correct: answerResult.isCorrect,
        responseTime,
        pointsAwarded: scoreResult.totalPoints
      });

      io.to(sessionId).emit('answer-received', {
        playerId: socket.id,
        answeredCount: session.currentQuestion.answers.length + 1,
        totalPlayers: sessionService.getActivePlayers(session).length
      });

      // Check if everyone has answered
      const updatedSession = await sessionService.getSession(sessionId);
      if (sessionService.hasEveryoneAnswered(updatedSession)) {
        clearQuestionTimer(sessionId);
        await endQuestion(io, sessionId);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  });

  socket.on('skip-question', async ({ sessionId }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session) return;
      if (session.hostSocketId !== socket.id) return;

      clearQuestionTimer(sessionId);
      await endQuestion(io, sessionId);
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  });

  socket.on('end-everyone-game', async ({ sessionId }) => {
    try {
      const session = await sessionService.getSession(sessionId);

      if (!session) return;
      if (session.hostSocketId !== socket.id) return;

      clearQuestionTimer(sessionId);
      await endGame(io, sessionId);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  });
};

const sendNextQuestion = async (io, sessionId) => {
  try {
    const session = await sessionService.getSession(sessionId);

    if (!session) return;

    const questionsAsked = session.questionsAsked.length;
    const categoryIds = session.settings.categories.map(c => c._id || c);

    if (questionsAsked >= session.settings.questionsCount) {
      return await endGame(io, sessionId);
    }

    const excludeIds = session.questionsAsked.map(q => q.questionId?.toString() || q.toString());

    const question = await questionService.getRandomQuestion(categoryIds, {
      excludeQuestionIds: excludeIds,
      gameType: 'everyone',
      hasMultipleChoice: true
    });

    if (!question) {
      return await endGame(io, sessionId);
    }

    await sessionService.setCurrentQuestion(sessionId, question, questionsAsked + 1);

    const preparedQuestion = questionService.prepareQuestionForClient(question, {
      includeAnswer: false,
      gameType: 'everyone'
    });

    const timeLimit = question.timeLimit || session.settings.questionTime || DEFAULT_QUESTION_TIME;

    io.to(sessionId).emit('new-question', {
      question: preparedQuestion,
      questionNumber: questionsAsked + 1,
      totalQuestions: session.settings.questionsCount,
      timeLimit
    });

    const timer = setTimeout(async () => {
      await endQuestion(io, sessionId);
    }, timeLimit * 1000);

    questionTimers.set(sessionId, timer);
  } catch (error) {
    console.error('Error sending next question:', error);
  }
};

const endQuestion = async (io, sessionId) => {
  try {
    const session = await sessionService.getSession(sessionId);

    if (!session) return;

    const question = session.currentQuestion.questionId;

    // Compile player results
    const playerResults = session.currentQuestion.answers.map(answer => {
      const player = session.players.find(p => p.socketId === answer.socketId);
      return {
        playerId: answer.socketId,
        playerName: player?.name,
        correct: answer.correct,
        pointsAwarded: answer.pointsAwarded,
        responseTime: answer.responseTime
      };
    });

    // Mark question as played
    const correctCount = playerResults.filter(r => r.correct).length;
    await questionService.markQuestionPlayed(question._id, {
      correct: correctCount > 0
    });

    // Store results
    await sessionService.addQuestionToAsked(sessionId, question._id, playerResults);

    await sessionService.updateSessionStatus(sessionId, 'showing_answer');

    const leaderboard = await sessionService.getLeaderboard(sessionId);

    const preparedAnswer = questionService.prepareQuestionForClient(question, {
      includeAnswer: true,
      gameType: 'everyone'
    });

    io.to(sessionId).emit('question-results', {
      correctAnswer: preparedAnswer.answer,
      answerType: preparedAnswer.answerType,
      correctOptionId: preparedAnswer.correctOptionId,
      answerDisplay: preparedAnswer.answerDisplay,
      playerResults,
      leaderboard,
      stats: {
        answeredCount: playerResults.length,
        correctCount,
        fastestCorrect: playerResults
          .filter(r => r.correct)
          .sort((a, b) => a.responseTime - b.responseTime)[0]
      }
    });

    const questionsAsked = session.questionsAsked.length + 1;
    const totalQuestions = session.settings.questionsCount;

    if (questionsAsked >= totalQuestions) {
      setTimeout(async () => {
        await endGame(io, sessionId);
      }, 5000);
    } else {
      setTimeout(async () => {
        await sessionService.updateSessionStatus(sessionId, 'playing');
        await sendNextQuestion(io, sessionId);
      }, session.settings.showLeaderboardAfterEach ? 5000 : 3000);
    }
  } catch (error) {
    console.error('Error ending question:', error);
  }
};

const endGame = async (io, sessionId) => {
  try {
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
    console.error('Error ending game:', error);
  }
};

const clearQuestionTimer = (sessionId) => {
  const timer = questionTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    questionTimers.delete(sessionId);
  }
};

module.exports = { setupEveryoneGameHandlers };
