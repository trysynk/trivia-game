const { Question } = require('../models');
const { DIFFICULTIES, QUESTIONS_PER_DIFFICULTY } = require('../utils/constants');
const { shuffleArray } = require('../utils/helpers');

const getQuestionsForGame = async (categoryIds, excludeQuestionIds = []) => {
  const result = {};

  for (const categoryId of categoryIds) {
    result[categoryId] = {
      easy: [],
      medium: [],
      hard: []
    };

    for (const difficulty of DIFFICULTIES) {
      let questions = await Question.find({
        category: categoryId,
        difficulty: difficulty,
        isActive: true,
        _id: { $nin: excludeQuestionIds }
      })
        .sort({ timesPlayed: 1 })
        .limit(QUESTIONS_PER_DIFFICULTY);

      if (questions.length < QUESTIONS_PER_DIFFICULTY) {
        const needed = QUESTIONS_PER_DIFFICULTY - questions.length;
        const oldQuestions = await Question.find({
          category: categoryId,
          difficulty: difficulty,
          isActive: true,
          _id: { $in: excludeQuestionIds }
        })
          .sort({ timesPlayed: 1 })
          .limit(needed);

        questions = [...questions, ...oldQuestions];
      }

      result[categoryId][difficulty] = questions;
    }
  }

  return result;
};

const getRandomQuestion = async (categoryIds, excludeQuestionIds = [], difficulty = null) => {
  const query = {
    category: { $in: categoryIds },
    isActive: true,
    _id: { $nin: excludeQuestionIds }
  };

  if (difficulty) {
    query.difficulty = difficulty;
  }

  let questions = await Question.find(query)
    .sort({ timesPlayed: 1 })
    .limit(10);

  if (questions.length === 0 && excludeQuestionIds.length > 0) {
    delete query._id;
    questions = await Question.find(query)
      .sort({ timesPlayed: 1 })
      .limit(10);
  }

  if (questions.length === 0) {
    return null;
  }

  const shuffled = shuffleArray(questions);
  return shuffled[0];
};

const markQuestionPlayed = async (questionId, correct = false) => {
  const update = {
    $inc: { timesPlayed: 1 }
  };

  if (correct) {
    update.$inc.timesCorrect = 1;
  }

  return await Question.findByIdAndUpdate(questionId, update, { new: true });
};

const prepareQuestionForClient = (question, includeAnswer = false) => {
  const prepared = {
    id: question._id,
    type: question.questionType,
    content: question.questionContent,
    difficulty: question.difficulty,
    points: question.points
  };

  if (question.options && question.options.length > 0) {
    prepared.options = shuffleArray(question.options.map(opt => ({
      text: opt.text,
      id: opt._id
    })));
  }

  if (includeAnswer) {
    prepared.answer = question.answerContent;
    prepared.answerType = question.answerType;
    if (question.options && question.options.length > 0) {
      prepared.correctOptionId = question.options.find(opt => opt.isCorrect)?._id;
    }
  }

  return prepared;
};

module.exports = {
  getQuestionsForGame,
  getRandomQuestion,
  markQuestionPlayed,
  prepareQuestionForClient
};
