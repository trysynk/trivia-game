const { sessionService, questionService } = require('../services');
const { calculateSpeedBonus, formatLeaderboard } = require('../utils/helpers');
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

      if (session.players.filter(p => p.isActive).length < 1) {
        return socket.emit('error', { message: 'Need at least 1 player to start' });
      }

      await sessionService.updateSessionStatus(sessionId, 'playing');
      io.to(sessionId).emit('game-started', {});

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
      const elapsedSeconds = (answeredAt - startedAt) / 1000;

      let correct = false;

      if (question.options && question.options.length > 0) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        correct = correctOption && correctOption._id.toString() === optionId;
      } else {
        const correctAnswer = question.answerContent.text?.toLowerCase().trim();
        correct = answer?.toLowerCase().trim() === correctAnswer;
      }

      const pointsAwarded = correct ? calculateSpeedBonus(elapsedSeconds, question.points) : 0;

      await sessionService.recordAnswer(sessionId, socket.id, answer || optionId, correct, pointsAwarded);

      io.to(sessionId).emit('answer-received', {
        playerId: socket.id,
        answeredCount: session.currentQuestion.answers.length + 1
      });

      const updatedSession = await sessionService.getSession(sessionId);
      const activePlayers = updatedSession.players.filter(p => p.isActive);
      const answeredPlayers = updatedSession.currentQuestion.answers.length;

      if (answeredPlayers >= activePlayers.length) {
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

    const questionsAsked = session.questionsAsked.map(q => q.toString());
    const categoryIds = session.settings.categories.map(c => c._id || c);

    if (questionsAsked.length >= session.settings.questionsCount) {
      return await endGame(io, sessionId);
    }

    const question = await questionService.getRandomQuestion(categoryIds, questionsAsked);

    if (!question) {
      return await endGame(io, sessionId);
    }

    await sessionService.addQuestionToAsked(sessionId, question._id);
    await sessionService.setCurrentQuestion(sessionId, question._id);

    const preparedQuestion = questionService.prepareQuestionForClient(question, false);

    io.to(sessionId).emit('new-question', {
      question: preparedQuestion,
      questionNumber: questionsAsked.length + 1,
      totalQuestions: session.settings.questionsCount,
      timeLimit: session.settings.questionTime || DEFAULT_QUESTION_TIME
    });

    const timeLimit = (session.settings.questionTime || DEFAULT_QUESTION_TIME) * 1000;
    const timer = setTimeout(async () => {
      await endQuestion(io, sessionId);
    }, timeLimit);

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

    const playerResults = session.currentQuestion.answers.map(answer => ({
      playerId: answer.socketId,
      correct: answer.correct,
      pointsAwarded: answer.pointsAwarded
    }));

    const correctCount = playerResults.filter(r => r.correct).length;
    await questionService.markQuestionPlayed(question._id, correctCount > 0);

    await sessionService.updateSessionStatus(sessionId, 'showing_results');

    const leaderboard = await sessionService.getLeaderboard(sessionId);

    const preparedAnswer = questionService.prepareQuestionForClient(question, true);

    io.to(sessionId).emit('question-results', {
      correctAnswer: preparedAnswer.answer,
      answerType: preparedAnswer.answerType,
      correctOptionId: preparedAnswer.correctOptionId,
      playerResults,
      leaderboard
    });

    const questionsAsked = session.questionsAsked.length;
    const totalQuestions = session.settings.questionsCount;

    if (questionsAsked >= totalQuestions) {
      setTimeout(async () => {
        await endGame(io, sessionId);
      }, 5000);
    } else {
      setTimeout(async () => {
        await sessionService.updateSessionStatus(sessionId, 'playing');
        await sendNextQuestion(io, sessionId);
      }, 5000);
    }
  } catch (error) {
    console.error('Error ending question:', error);
  }
};

const endGame = async (io, sessionId) => {
  try {
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
