const { Question, Category } = require('../models');
const { DIFFICULTIES, QUESTIONS_PER_DIFFICULTY } = require('../utils/constants');
const { shuffleArray } = require('../utils/helpers');

const getQuestionsForGame = async (categoryIds, options = {}) => {
  const {
    excludeQuestionIds = [],
    gameType = 'main',
    questionsPerDifficulty = QUESTIONS_PER_DIFFICULTY
  } = options;

  const result = {};

  // Determine which game availability field to check
  const gameField = gameType === 'everyone' ? 'gamesAvailable.everyoneAnswers.enabled' :
                    gameType === 'buzzer' ? 'gamesAvailable.buzzerMode.enabled' :
                    'gamesAvailable.mainGame';

  for (const categoryId of categoryIds) {
    result[categoryId] = {
      easy: [],
      medium: [],
      hard: []
    };

    for (const difficulty of DIFFICULTIES) {
      const query = {
        category: categoryId,
        difficulty: difficulty,
        status: 'active',
        _id: { $nin: excludeQuestionIds }
      };

      // Add game availability filter
      query[gameField] = true;

      let questions = await Question.find(query)
        .sort({ 'stats.timesPlayed': 1 })
        .limit(questionsPerDifficulty);

      // If not enough questions, include previously played ones
      if (questions.length < questionsPerDifficulty && excludeQuestionIds.length > 0) {
        const needed = questionsPerDifficulty - questions.length;
        const oldQuery = { ...query };
        delete oldQuery._id;
        oldQuery._id = { $in: excludeQuestionIds };

        const oldQuestions = await Question.find(oldQuery)
          .sort({ 'stats.timesPlayed': 1 })
          .limit(needed);

        questions = [...questions, ...oldQuestions];
      }

      result[categoryId][difficulty] = questions;
    }
  }

  return result;
};

const getRandomQuestion = async (categoryIds, options = {}) => {
  const {
    excludeQuestionIds = [],
    difficulty = null,
    gameType = 'main',
    hasMultipleChoice = null
  } = options;

  const gameField = gameType === 'everyone' ? 'gamesAvailable.everyoneAnswers.enabled' :
                    gameType === 'buzzer' ? 'gamesAvailable.buzzerMode.enabled' :
                    'gamesAvailable.mainGame';

  const query = {
    category: { $in: categoryIds },
    status: 'active',
    _id: { $nin: excludeQuestionIds }
  };

  query[gameField] = true;

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (hasMultipleChoice !== null) {
    query['multipleChoice.enabled'] = hasMultipleChoice;
  }

  let questions = await Question.find(query)
    .sort({ 'stats.timesPlayed': 1 })
    .limit(10);

  // Fallback to include excluded questions if none found
  if (questions.length === 0 && excludeQuestionIds.length > 0) {
    delete query._id;
    questions = await Question.find(query)
      .sort({ 'stats.timesPlayed': 1 })
      .limit(10);
  }

  if (questions.length === 0) {
    return null;
  }

  return shuffleArray(questions)[0];
};

const markQuestionPlayed = async (questionId, playResult) => {
  const { correct = false, answerTime = null, selectedOptionId = null } = playResult;

  const question = await Question.findById(questionId);
  if (!question) return null;

  // Use the model method for recording play
  await question.recordPlay(correct, answerTime);

  // Record option selection if multiple choice
  if (selectedOptionId && question.multipleChoice?.enabled) {
    await question.recordOptionSelection(selectedOptionId);
  }

  return question;
};

const prepareQuestionForClient = (question, options = {}) => {
  const { includeAnswer = false, gameType = 'everyone' } = options;

  const prepared = {
    id: question._id,
    shortId: question.shortId,
    type: question.questionType,
    content: {
      text: question.questionContent.text,
      textEn: question.questionContent.textEn
    },
    difficulty: question.difficulty,
    points: question.points,
    timeLimit: question.timeLimit
  };

  // Add media if present
  if (question.questionContent.mediaUrl) {
    prepared.content.mediaUrl = question.questionContent.mediaUrl;
    prepared.content.mediaSettings = question.questionContent.mediaSettings;
  }

  // Add emojis for emoji type
  if (question.questionType === 'emoji' && question.questionContent.emojis) {
    prepared.content.emojis = question.questionContent.emojis;
  }

  // Add sequence items
  if (question.questionType === 'sequence' && question.questionContent.sequenceItems) {
    prepared.content.sequenceItems = shuffleArray([...question.questionContent.sequenceItems]);
  }

  // Add estimation settings
  if (question.questionType === 'estimation' && question.questionContent.estimationSettings) {
    prepared.content.estimationSettings = {
      unit: question.questionContent.estimationSettings.unit,
      minValue: question.questionContent.estimationSettings.minValue,
      maxValue: question.questionContent.estimationSettings.maxValue
    };
  }

  // Add complete settings
  if (question.questionType === 'complete' && question.questionContent.completeSettings) {
    prepared.content.completeSettings = {
      sentence: question.questionContent.completeSettings.sentence,
      blankPosition: question.questionContent.completeSettings.blankPosition
    };
  }

  // Add map settings
  if (question.questionType === 'map' && question.questionContent.mapSettings) {
    prepared.content.mapSettings = {
      mapType: question.questionContent.mapSettings.mapType,
      region: question.questionContent.mapSettings.region
    };
  }

  // Add multiple choice options for QR games
  if (question.multipleChoice?.enabled) {
    const gameField = gameType === 'everyone' ? 'everyoneAnswers' : 'buzzerMode';
    const shouldShow = question.gamesAvailable?.[gameField]?.showMultipleChoice !== false;

    if (shouldShow) {
      prepared.options = shuffleArray(question.multipleChoice.options.map(opt => ({
        id: opt._id,
        text: opt.text,
        textEn: opt.textEn,
        imageUrl: opt.imageUrl
      })));
      prepared.hasMultipleChoice = true;
    }
  }

  // Include answer data if requested
  if (includeAnswer) {
    prepared.answer = {
      text: question.answerContent.text,
      textEn: question.answerContent.textEn
    };
    prepared.answerType = question.answerType;
    prepared.answerDisplay = question.answerDisplaySettings;

    // Add media answer
    if (question.answerContent.mediaUrl) {
      prepared.answer.mediaUrl = question.answerContent.mediaUrl;
    }

    // Add correct option ID for multiple choice
    if (question.multipleChoice?.enabled) {
      const correctOption = question.multipleChoice.options.find(opt => opt.isCorrect);
      if (correctOption) {
        prepared.correctOptionId = correctOption._id;
      }
    }

    // Add sequence answer
    if (question.questionType === 'sequence') {
      prepared.answer.correctSequence = question.questionContent.sequenceItems
        .sort((a, b) => a.order - b.order)
        .map(item => item.item);
    }

    // Add estimation correct answer
    if (question.questionType === 'estimation') {
      prepared.answer.correctValue = question.questionContent.estimationSettings?.correctAnswer;
      prepared.answer.tolerance = question.questionContent.estimationSettings?.tolerance;
    }

    // Add map answer
    if (question.questionType === 'map') {
      prepared.answer.location = question.answerContent.location;
      prepared.answer.locationRadius = question.questionContent.mapSettings?.locationRadius;
    }
  }

  return prepared;
};

const checkAnswer = (question, playerAnswer, options = {}) => {
  const { answerTime = null } = options;

  let isCorrect = false;
  let partialScore = null;

  // Multiple choice check
  if (question.multipleChoice?.enabled && playerAnswer.optionId) {
    const correctOption = question.multipleChoice.options.find(opt => opt.isCorrect);
    isCorrect = correctOption && correctOption._id.toString() === playerAnswer.optionId;
  }
  // Text answer check
  else if (question.answerType === 'text' && playerAnswer.text) {
    const correctAnswers = [
      question.answerContent.text?.toLowerCase().trim(),
      ...(question.answerContent.alternativeAnswers || []).map(a => a.toLowerCase().trim())
    ].filter(Boolean);

    const playerText = playerAnswer.text.toLowerCase().trim();
    isCorrect = correctAnswers.includes(playerText);
  }
  // Number answer check
  else if (question.answerType === 'number' && playerAnswer.number !== undefined) {
    if (question.answerContent.numberRange) {
      const { min, max } = question.answerContent.numberRange;
      isCorrect = playerAnswer.number >= min && playerAnswer.number <= max;
    } else {
      isCorrect = playerAnswer.number === question.answerContent.number;
    }
  }
  // Estimation type with tolerance
  else if (question.questionType === 'estimation' && playerAnswer.number !== undefined) {
    const settings = question.questionContent.estimationSettings;
    if (settings) {
      const diff = Math.abs(playerAnswer.number - settings.correctAnswer);
      const toleranceValue = settings.toleranceType === 'percentage'
        ? settings.correctAnswer * (settings.tolerance / 100)
        : settings.tolerance;

      isCorrect = diff <= toleranceValue;

      // Calculate partial score based on closeness
      if (!isCorrect && settings.partialScoring) {
        const maxDiff = Math.abs(settings.maxValue - settings.minValue);
        const accuracy = 1 - (diff / maxDiff);
        partialScore = Math.max(0, accuracy);
      }
    }
  }
  // Sequence answer check
  else if (question.answerType === 'sequence' && Array.isArray(playerAnswer.sequence)) {
    const correctSequence = question.questionContent.sequenceItems
      .sort((a, b) => a.order - b.order)
      .map(item => item.item);

    isCorrect = playerAnswer.sequence.length === correctSequence.length &&
      playerAnswer.sequence.every((item, index) => item === correctSequence[index]);
  }
  // Location/map answer check
  else if (question.answerType === 'location' && playerAnswer.location) {
    const correctLocation = question.answerContent.location;
    const radius = question.questionContent.mapSettings?.locationRadius || 50;

    if (correctLocation) {
      const distance = calculateDistance(
        playerAnswer.location.lat,
        playerAnswer.location.lng,
        correctLocation.lat,
        correctLocation.lng
      );
      isCorrect = distance <= radius;
    }
  }

  return {
    isCorrect,
    partialScore,
    answerTime
  };
};

// Haversine formula for distance calculation (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getQuestionsByFilters = async (filters = {}, pagination = {}) => {
  const {
    category,
    difficulty,
    questionType,
    status,  // No default - show all questions unless filtered
    game,
    hasMultipleChoice,
    search,
    tags
  } = filters;

  const { page = 1, limit = 20 } = pagination;

  const query = {};

  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (questionType) query.questionType = questionType;
  if (status) query.status = status;

  if (game) {
    const gameField = game === 'everyoneAnswers' ? 'gamesAvailable.everyoneAnswers.enabled' :
                      game === 'buzzerMode' ? 'gamesAvailable.buzzerMode.enabled' :
                      'gamesAvailable.mainGame';
    query[gameField] = true;
  }

  if (hasMultipleChoice !== undefined) {
    query['multipleChoice.enabled'] = hasMultipleChoice;
  }

  if (search) {
    query.$or = [
      { 'questionContent.text': { $regex: search, $options: 'i' } },
      { 'answerContent.text': { $regex: search, $options: 'i' } },
      { shortId: { $regex: search, $options: 'i' } }
    ];
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('category', 'name nameEn icon color')
      .populate('tags', 'name nameEn color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query)
  ]);

  return {
    questions,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

const updateCategoryStats = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (category) {
    await category.updateStats();
  }
};

module.exports = {
  getQuestionsForGame,
  getRandomQuestion,
  markQuestionPlayed,
  prepareQuestionForClient,
  checkAnswer,
  getQuestionsByFilters,
  updateCategoryStats,
  calculateDistance
};
