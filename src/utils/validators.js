const { DIFFICULTIES, QUESTION_TYPES, ANSWER_TYPES, GAME_TYPES } = require('./constants');

const validateQuestion = (data) => {
  const errors = [];

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.difficulty || !DIFFICULTIES.includes(data.difficulty)) {
    errors.push('Valid difficulty is required (easy, medium, hard)');
  }

  if (!data.questionType || !QUESTION_TYPES.includes(data.questionType)) {
    errors.push('Valid question type is required');
  }

  if (!data.questionContent) {
    errors.push('Question content is required');
  } else {
    if (data.questionType === 'text' && !data.questionContent.text) {
      errors.push('Question text is required for text type questions');
    }
    if (['image', 'audio', 'video', 'blurred_image'].includes(data.questionType) && !data.questionContent.mediaUrl) {
      errors.push('Media URL is required for media type questions');
    }
    if (data.questionType === 'two_images' && (!data.questionContent.mediaUrl || !data.questionContent.mediaUrl2)) {
      errors.push('Two media URLs are required for two_images type');
    }
    if (data.questionType === 'emoji' && (!data.questionContent.emojis || data.questionContent.emojis.length === 0)) {
      errors.push('Emojis array is required for emoji type questions');
    }
  }

  if (!data.answerType || !ANSWER_TYPES.includes(data.answerType)) {
    errors.push('Valid answer type is required');
  }

  if (!data.answerContent) {
    errors.push('Answer content is required');
  } else {
    if (data.answerType === 'text' && !data.answerContent.text) {
      errors.push('Answer text is required for text type answers');
    }
    if (['image', 'audio', 'video'].includes(data.answerType) && !data.answerContent.mediaUrl) {
      errors.push('Media URL is required for media type answers');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateCategory = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Category name is required');
  }

  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.push('Invalid color format (use hex like #FF0000)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateGameType = (gameType) => {
  return GAME_TYPES.includes(gameType);
};

const validateSessionSettings = (settings) => {
  const errors = [];

  if (settings.questionTime && (settings.questionTime < 10 || settings.questionTime > 120)) {
    errors.push('Question time must be between 10 and 120 seconds');
  }

  if (settings.questionsCount && (settings.questionsCount < 1 || settings.questionsCount > 50)) {
    errors.push('Questions count must be between 1 and 50');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateQuestion,
  validateCategory,
  validateGameType,
  validateSessionSettings
};
