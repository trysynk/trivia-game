module.exports = {
  DIFFICULTIES: ['easy', 'medium', 'hard'],

  POINTS_MAP: {
    easy: 200,
    medium: 400,
    hard: 600
  },

  QUESTION_TYPES: ['text', 'image', 'audio', 'video', 'blurred_image', 'two_images', 'emoji', 'sequence', 'estimation', 'complete', 'map', 'before_after'],

  ANSWER_TYPES: ['text', 'image', 'audio', 'video', 'number', 'sequence', 'location'],

  GAME_TYPES: ['main', 'everyone', 'buzzer'],

  SESSION_STATUSES: ['waiting', 'playing', 'question_active', 'showing_answer', 'showing_results', 'paused', 'ended'],

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

  QUESTIONS_PER_DIFFICULTY: 2,

  PLAYER_COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    '#FF7F50', '#9370DB', '#20B2AA', '#FFB347'
  ],

  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],

  ADMIN_ROLES: ['super_admin', 'admin', 'editor'],

  QUESTION_STATUSES: ['draft', 'active', 'needs_review', 'archived'],

  ACTIVITY_ACTIONS: [
    'login', 'logout', 'login_failed',
    'question_create', 'question_update', 'question_delete', 'question_bulk_update',
    'category_create', 'category_update', 'category_delete',
    'settings_update', 'media_upload', 'media_delete',
    'import', 'export', 'bulk_action'
  ]
};
