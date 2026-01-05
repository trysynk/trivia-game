module.exports = {
  DIFFICULTIES: ['easy', 'medium', 'hard'],

  POINTS_MAP: {
    easy: 200,
    medium: 400,
    hard: 600
  },

  QUESTION_TYPES: ['text', 'image', 'audio', 'video', 'blurred_image', 'two_images', 'emoji'],

  ANSWER_TYPES: ['text', 'image', 'audio', 'video'],

  GAME_TYPES: ['main', 'everyone', 'buzzer'],

  SESSION_STATUSES: ['waiting', 'playing', 'question_active', 'showing_results', 'ended'],

  DEFAULT_QUESTION_TIME: 30,
  DEFAULT_QUESTIONS_COUNT: 10,

  SPEED_BONUS: {
    FULL: { maxSeconds: 5, multiplier: 1.0 },
    HIGH: { maxSeconds: 15, multiplier: 0.75 },
    MEDIUM: { maxSeconds: 25, multiplier: 0.5 },
    LOW: { maxSeconds: 30, multiplier: 0.25 }
  },

  BUZZER_ANSWER_TIME: 10000,
  WRONG_ANSWER_PENALTY_RATIO: 0.5,

  QUESTIONS_PER_DIFFICULTY: 2
};
