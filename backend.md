PROJECT: Arabic Trivia Game - Backend API
STACK: Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, Multer

===========================================
PROJECT STRUCTURE
===========================================

/trivia-backend
├── src/
│ ├── index.js # Entry point
│ ├── app.js # Express app configuration
│ │
│ ├── config/
│ │ ├── index.js # Config aggregator
│ │ ├── database.js # MongoDB connection
│ │ ├── socket.js # Socket.io configuration
│ │ ├── storage.js # File storage configuration
│ │ └── constants.js # App-wide constants
│ │
│ ├── models/
│ │ ├── index.js # Model aggregator
│ │ ├── Admin.js # Admin users
│ │ ├── Category.js # Question categories
│ │ ├── Question.js # Questions (comprehensive)
│ │ ├── QuestionPack.js # Question collections
│ │ ├── Game.js # Game history
│ │ ├── Session.js # Active QR game sessions
│ │ ├── Media.js # Media file registry
│ │ ├── Tag.js # Question tags
│ │ ├── Settings.js # System settings
│ │ └── ActivityLog.js # Audit trail
│ │
│ ├── routes/
│ │ ├── index.js # Route aggregator
│ │ ├── auth.routes.js # Authentication
│ │ ├── admin.routes.js # Admin management
│ │ ├── category.routes.js # Categories CRUD
│ │ ├── question.routes.js # Questions CRUD
│ │ ├── questionPack.routes.js # Question packs
│ │ ├── game.routes.js # Game history
│ │ ├── session.routes.js # QR game sessions
│ │ ├── media.routes.js # Media management
│ │ ├── tag.routes.js # Tags management
│ │ ├── stats.routes.js # Statistics
│ │ ├── settings.routes.js # System settings
│ │ └── importExport.routes.js # Bulk operations
│ │
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ ├── admin.controller.js
│ │ ├── category.controller.js
│ │ ├── question.controller.js
│ │ ├── questionPack.controller.js
│ │ ├── game.controller.js
│ │ ├── session.controller.js
│ │ ├── media.controller.js
│ │ ├── tag.controller.js
│ │ ├── stats.controller.js
│ │ ├── settings.controller.js
│ │ └── importExport.controller.js
│ │
│ ├── services/
│ │ ├── auth.service.js # JWT, password hashing
│ │ ├── question.service.js # Question selection logic
│ │ ├── game.service.js # Game state management
│ │ ├── session.service.js # QR session management
│ │ ├── scoring.service.js # Points calculation
│ │ ├── media.service.js # File processing
│ │ ├── stats.service.js # Statistics aggregation
│ │ ├── import.service.js # Data import processing
│ │ ├── export.service.js # Data export processing
│ │ └── validation.service.js # Complex validations
│ │
│ ├── sockets/
│ │ ├── index.js # Socket.io setup & handlers
│ │ ├── handlers/
│ │ │ ├── connection.handler.js # Connection management
│ │ │ ├── session.handler.js # Session events
│ │ │ ├── everyone.handler.js # Everyone Answers game
│ │ │ └── buzzer.handler.js # Buzzer Mode game
│ │ └── utils/
│ │ ├── roomManager.js # Socket room management
│ │ └── eventEmitter.js # Custom event emitter
│ │
│ ├── middleware/
│ │ ├── auth.middleware.js # JWT verification
│ │ ├── admin.middleware.js # Admin role check
│ │ ├── validate.middleware.js # Request validation
│ │ ├── upload.middleware.js # File upload handling
│ │ ├── rateLimiter.middleware.js # Rate limiting
│ │ ├── error.middleware.js # Error handling
│ │ └── activityLog.middleware.js # Action logging
│ │
│ ├── validators/
│ │ ├── auth.validator.js
│ │ ├── category.validator.js
│ │ ├── question.validator.js
│ │ ├── questionPack.validator.js
│ │ ├── game.validator.js
│ │ ├── session.validator.js
│ │ └── common.validator.js
│ │
│ ├── utils/
│ │ ├── helpers.js # General utilities
│ │ ├── apiResponse.js # Standardized responses
│ │ ├── apiError.js # Custom error class
│ │ ├── logger.js # Logging utility
│ │ ├── fileUtils.js # File operations
│ │ ├── arabicUtils.js # Arabic text processing
│ │ └── idGenerator.js # Short ID generation
│ │
│ └── uploads/ # Uploaded files directory
│ ├── images/
│ ├── audio/
│ ├── video/
│ └── temp/
│
├── scripts/
│ ├── seed.js # Database seeding
│ ├── createAdmin.js # Create initial admin
│ └── migrate.js # Data migrations
│
├── tests/
│ ├── unit/
│ ├── integration/
│ └── fixtures/
│
├── .env
├── .env.example
├── package.json
└── README.md

===========================================
ENVIRONMENT VARIABLES (.env)
===========================================

# Server

PORT=5000
NODE_ENV=development

# Database

MONGODB_URI=mongodb://localhost:27017/trivia-game

# Authentication

JWT_SECRET=your-very-long-and-secure-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# File Upload

UPLOAD_PATH=./src/uploads
MAX_FILE_SIZE_MB=50
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/wav,audio/ogg,audio/mp4
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/quicktime

# CORS

CORS_ORIGIN=http://localhost:3000

# Session

SESSION_EXPIRY_HOURS=4
SESSION_CODE_LENGTH=6

# Rate Limiting

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging

LOG_LEVEL=debug

===========================================
MONGODB SCHEMAS (Comprehensive)
===========================================

//////////////////////////////////////////////
// ADMIN SCHEMA
//////////////////////////////////////////////

const AdminSchema = new mongoose.Schema({
// Basic Info
username: {
type: String,
required: [true, 'Username is required'],
unique: true,
trim: true,
minlength: [3, 'Username must be at least 3 characters'],
maxlength: [30, 'Username cannot exceed 30 characters'],
match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
},

email: {
type: String,
required: [true, 'Email is required'],
unique: true,
trim: true,
lowercase: true,
match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
},

password: {
type: String,
required: [true, 'Password is required'],
minlength: [6, 'Password must be at least 6 characters'],
select: false // Don't return password in queries
},

// Profile
displayName: {
type: String,
trim: true,
maxlength: 50
},

avatar: {
type: String // URL to avatar image
},

// Role & Permissions
role: {
type: String,
enum: ['super_admin', 'admin', 'editor'],
default: 'admin'
},

permissions: {
canManageAdmins: { type: Boolean, default: false },
canManageCategories: { type: Boolean, default: true },
canManageQuestions: { type: Boolean, default: true },
canManagePacks: { type: Boolean, default: true },
canViewStats: { type: Boolean, default: true },
canExportData: { type: Boolean, default: true },
canImportData: { type: Boolean, default: false },
canManageSettings: { type: Boolean, default: false }
},

// Security
passwordChangedAt: Date,
passwordResetToken: String,
passwordResetExpires: Date,

refreshTokens: [{
token: String,
createdAt: { type: Date, default: Date.now },
expiresAt: Date,
userAgent: String,
ipAddress: String
}],

// Status
isActive: {
type: Boolean,
default: true
},

lastLogin: Date,
loginAttempts: { type: Number, default: 0 },
lockUntil: Date

}, {
timestamps: true
});

// Indexes
AdminSchema.index({ email: 1 });
AdminSchema.index({ username: 1 });
AdminSchema.index({ role: 1 });

// Pre-save hook: Hash password
AdminSchema.pre('save', async function(next) {
if (!this.isModified('password')) return next();
this.password = await bcrypt.hash(this.password, 12);
this.passwordChangedAt = Date.now() - 1000;
next();
});

// Methods
AdminSchema.methods.comparePassword = async function(candidatePassword) {
return await bcrypt.compare(candidatePassword, this.password);
};

AdminSchema.methods.hasPermission = function(permission) {
if (this.role === 'super_admin') return true;
return this.permissions[permission] === true;
};

//////////////////////////////////////////////
// CATEGORY SCHEMA
//////////////////////////////////////////////

const CategorySchema = new mongoose.Schema({
// Basic Info
name: {
type: String,
required: [true, 'Category name in Arabic is required'],
trim: true,
minlength: [2, 'Name must be at least 2 characters'],
maxlength: [50, 'Name cannot exceed 50 characters']
},

nameEn: {
type: String,
trim: true,
maxlength: [50, 'English name cannot exceed 50 characters']
},

description: {
type: String,
trim: true,
maxlength: [500, 'Description cannot exceed 500 characters']
},

descriptionEn: {
type: String,
trim: true,
maxlength: [500, 'English description cannot exceed 500 characters']
},

// Visual Identity
icon: {
type: String,
required: [true, 'Category icon is required']
// Can be: emoji, icon name (from library), or URL to custom icon
},

iconType: {
type: String,
enum: ['emoji', 'icon', 'image'],
default: 'emoji'
},

color: {
type: String,
required: [true, 'Category color is required'],
match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color']
},

coverImage: {
type: String // URL to cover image (optional)
},

// Organization
order: {
type: Number,
default: 0
},

parentCategory: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Category',
default: null // For sub-categories (future feature)
},

// Game Availability
gamesAvailable: {
mainGame: { type: Boolean, default: true },
everyoneAnswers: { type: Boolean, default: true },
buzzerMode: { type: Boolean, default: true }
},

// Settings
defaultTimeLimit: {
type: Number,
min: 10,
max: 300,
default: null // null means use game default
},

// Status
isActive: {
type: Boolean,
default: true
},

// Statistics (denormalized for performance)
stats: {
totalQuestions: { type: Number, default: 0 },
questionsEasy: { type: Number, default: 0 },
questionsMedium: { type: Number, default: 0 },
questionsHard: { type: Number, default: 0 },
timesPlayed: { type: Number, default: 0 },
averageSuccessRate: { type: Number, default: 0 }
},

// Metadata
createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
},

updatedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
}

}, {
timestamps: true
});

// Indexes
CategorySchema.index({ name: 1 }, { unique: true });
CategorySchema.index({ order: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ 'gamesAvailable.mainGame': 1 });
CategorySchema.index({ 'gamesAvailable.everyoneAnswers': 1 });
CategorySchema.index({ 'gamesAvailable.buzzerMode': 1 });

// Virtual for question count
CategorySchema.virtual('questions', {
ref: 'Question',
localField: '\_id',
foreignField: 'category'
});

//////////////////////////////////////////////
// QUESTION SCHEMA (Comprehensive)
//////////////////////////////////////////////

const QuestionSchema = new mongoose.Schema({
// Reference
shortId: {
type: String,
unique: true,
default: () => nanoid(8) // Short readable ID like "a1b2c3d4"
},

// Classification
category: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Category',
required: [true, 'Category is required'],
index: true
},

difficulty: {
type: String,
enum: {
values: ['easy', 'medium', 'hard'],
message: 'Difficulty must be easy, medium, or hard'
},
required: [true, 'Difficulty is required'],
index: true
},

points: {
type: Number,
required: true
// Auto-set by pre-save hook based on difficulty
},

// Tags for filtering and organization
tags: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'Tag'
}],

//////////////////////////////////////////////
// QUESTION CONTENT
//////////////////////////////////////////////

questionType: {
type: String,
enum: {
values: [
'text', // نص فقط - Text only
'image', // صورة - Single image
'audio', // صوت - Audio clip
'video', // فيديو - Video clip
'blurred_image', // صورة مموهة - Blurred image to guess
'two_images', // صورتين - Find differences or compare
'emoji', // إيموجي - Emoji puzzle
'sequence', // ترتيب - Order items correctly
'estimation', // تقدير - Guess a number
'complete', // أكمل - Complete the sentence/lyric/quote
'map', // خريطة - Geographic question
'before_after' // قبل وبعد - What changed
],
message: 'Invalid question type'
},
required: [true, 'Question type is required'],
index: true
},

questionContent: {
// Primary text (used by most types)
text: {
type: String,
trim: true,
maxlength: [1000, 'Question text cannot exceed 1000 characters']
},

    // For formatted text (bold, italic markers)
    formattedText: {
      type: String,
      trim: true
    },

    // Primary media
    mediaUrl: {
      type: String,
      trim: true
    },

    mediaType: {
      type: String,
      enum: ['image', 'audio', 'video', null]
    },

    // Secondary media (for two_images, before_after)
    mediaUrl2: {
      type: String,
      trim: true
    },

    // Media settings
    mediaSettings: {
      // For audio/video
      startTime: { type: Number, default: 0 },  // seconds
      endTime: { type: Number },                 // seconds (null = play to end)
      autoPlay: { type: Boolean, default: true },
      loop: { type: Boolean, default: false },
      showControls: { type: Boolean, default: false },

      // For images
      blurLevel: { type: Number, min: 1, max: 10, default: 5 },
      revealMode: {
        type: String,
        enum: ['instant', 'gradual'],
        default: 'instant'
      },
      revealDuration: { type: Number, default: 3 },  // seconds for gradual

      // For two_images
      displayMode: {
        type: String,
        enum: ['side_by_side', 'overlay_toggle', 'slider'],
        default: 'side_by_side'
      },
      differencesCount: { type: Number }
    },

    // For emoji type
    emojis: [{
      type: String,
      trim: true
    }],

    emojiHint: {
      type: String,  // Category hint like "فيلم", "مثل"
      trim: true
    },

    // For sequence type
    sequenceItems: [{
      id: { type: String, required: true },
      content: { type: String, required: true },
      contentType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
      },
      imageUrl: String,
      correctPosition: { type: Number, required: true }
    }],

    // For estimation type
    estimationSettings: {
      unit: String,           // "كيلومتر", "سنة", "شخص"
      unitPlural: String,     // "كيلومترات", "سنوات", "أشخاص"
      minValue: Number,       // For slider (optional)
      maxValue: Number,       // For slider (optional)
      showSlider: { type: Boolean, default: false }
    },

    // For complete type
    completeSettings: {
      fullText: String,       // Full sentence with blank
      blankMarker: { type: String, default: '___' },
      completeType: {
        type: String,
        enum: ['proverb', 'song', 'verse', 'quote', 'other'],
        default: 'other'
      },
      attribution: String     // Who said it, song name, etc.
    },

    // For map type
    mapSettings: {
      centerLat: Number,
      centerLng: Number,
      zoom: Number,
      markerLat: Number,
      markerLng: Number,
      hideLabels: { type: Boolean, default: true }
    },

    // Image labels (for two_images)
    image1Label: String,
    image2Label: String

},

//////////////////////////////////////////////
// ANSWER CONTENT
//////////////////////////////////////////////

answerType: {
type: String,
enum: {
values: ['text', 'image', 'audio', 'video', 'number', 'sequence', 'location'],
message: 'Invalid answer type'
},
required: [true, 'Answer type is required']
},

answerContent: {
// Primary answer text
text: {
type: String,
trim: true,
maxlength: [500, 'Answer text cannot exceed 500 characters']
},

    // Alternative accepted answers (for text matching)
    alternativeAnswers: [{
      type: String,
      trim: true
    }],

    // Answer matching settings
    matchSettings: {
      caseSensitive: { type: Boolean, default: false },
      ignoreSpaces: { type: Boolean, default: true },
      ignoreDiacritics: { type: Boolean, default: true },  // تشكيل
      partialMatch: { type: Boolean, default: false },
      partialMatchThreshold: { type: Number, default: 0.8 }  // 80% match
    },

    // Media answer
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ['image', 'audio', 'video', null]
    },

    // For number/estimation answers
    number: Number,
    numberRange: {
      exactMatch: { type: Boolean, default: false },
      percentageRange: Number,    // ±10% for example
      absoluteRange: Number,      // ±100 for example
      closestWins: { type: Boolean, default: false }  // For competitive
    },

    // For sequence answers (correct order stored in questionContent)
    sequenceExplanation: String,

    // For location/map answers
    location: {
      name: String,
      lat: Number,
      lng: Number,
      acceptableRadius: Number  // kilometers
    },

    // Additional info shown after reveal
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters']
    },

    funFact: {
      type: String,
      trim: true,
      maxlength: [500, 'Fun fact cannot exceed 500 characters']
    },

    source: {
      type: String,
      trim: true
    },

    sourceUrl: {
      type: String,
      trim: true
    }

},

// Answer display settings
answerDisplaySettings: {
revealDelay: { type: Number, default: 0 }, // seconds before showing
animation: {
type: String,
enum: ['fade', 'zoom', 'flip', 'slide', 'none'],
default: 'fade'
},
showExplanation: { type: Boolean, default: true },
showFunFact: { type: Boolean, default: true }
},

//////////////////////////////////////////////
// GAME COMPATIBILITY
//////////////////////////////////////////////

gamesAvailable: {
mainGame: {
enabled: { type: Boolean, default: true },
timeOverride: { type: Number, min: 10, max: 300 }, // null = use default

      // Helper restrictions
      helpers: {
        callFriend: { type: Boolean, default: true },
        thePit: { type: Boolean, default: true },
        doubleAnswer: { type: Boolean, default: true },
        takeRest: { type: Boolean, default: true }
      }
    },

    everyoneAnswers: {
      enabled: { type: Boolean, default: false },  // Requires MC options
      timeOverride: { type: Number, min: 5, max: 120 },
      pointsMultiplier: { type: Number, default: 1, min: 0.5, max: 3 }
    },

    buzzerMode: {
      enabled: { type: Boolean, default: false },
      timeToAnswer: { type: Number, default: 10 },  // After buzzing
      wrongAnswerPenalty: { type: Number, default: 50 },  // Percentage of points
      useMultipleChoice: { type: Boolean, default: false }
    }

},

//////////////////////////////////////////////
// MULTIPLE CHOICE OPTIONS (for QR games)
//////////////////////////////////////////////

multipleChoice: {
enabled: { type: Boolean, default: false },

    options: [{
      id: {
        type: String,
        default: () => nanoid(4)
      },
      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Option text cannot exceed 200 characters']
      },
      imageUrl: String,  // For visual options
      isCorrect: {
        type: Boolean,
        default: false
      },
      isTrap: {
        type: Boolean,
        default: false  // Common wrong answer (for analytics)
      }
    }],

    // Settings
    shuffleOptions: { type: Boolean, default: true },
    maxSelections: { type: Number, default: 1 },  // For "select all that apply"
    showOptionLabels: { type: Boolean, default: true },  // A, B, C, D

    // For partial credit (multiple correct answers)
    partialCredit: { type: Boolean, default: false },
    partialCreditPercentage: { type: Number, default: 50 }

},

//////////////////////////////////////////////
// TIMING SETTINGS
//////////////////////////////////////////////

timing: {
defaultTime: { type: Number, default: 30 }, // seconds
warningTime: { type: Number, default: 10 }, // When to show warning
bonusTimeThreshold: { type: Number }, // Answer before X seconds for bonus
bonusPoints: { type: Number, default: 0 }
},

//////////////////////////////////////////////
// STATISTICS
//////////////////////////////////////////////

stats: {
timesPlayed: { type: Number, default: 0 },
timesCorrect: { type: Number, default: 0 },
timesWrong: { type: Number, default: 0 },
timesSkipped: { type: Number, default: 0 },
averageAnswerTime: { type: Number, default: 0 }, // seconds

    // Per game type stats
    mainGamePlays: { type: Number, default: 0 },
    everyoneAnswersPlays: { type: Number, default: 0 },
    buzzerPlays: { type: Number, default: 0 },

    // Multiple choice analytics
    optionSelections: [{
      optionId: String,
      timesSelected: { type: Number, default: 0 }
    }],

    lastPlayedAt: Date,
    lastPlayedInGame: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    }

},

//////////////////////////////////////////////
// STATUS & WORKFLOW
//////////////////////////////////////////////

status: {
type: String,
enum: {
values: ['draft', 'active', 'needs_review', 'archived'],
message: 'Invalid status'
},
default: 'draft',
index: true
},

reviewNotes: {
type: String,
trim: true
},

//////////////////////////////////////////////
// METADATA
//////////////////////////////////////////////

createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
},

updatedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
},

// For import tracking
importSource: {
type: String // File name or source identifier
},

importId: {
type: String // Original ID from import
}

}, {
timestamps: true
});

// Indexes
QuestionSchema.index({ category: 1, difficulty: 1 });
QuestionSchema.index({ category: 1, difficulty: 1, status: 1 });
QuestionSchema.index({ 'stats.timesPlayed': 1 });
QuestionSchema.index({ 'gamesAvailable.mainGame.enabled': 1 });
QuestionSchema.index({ 'gamesAvailable.everyoneAnswers.enabled': 1 });
QuestionSchema.index({ 'gamesAvailable.buzzerMode.enabled': 1 });
QuestionSchema.index({ 'multipleChoice.enabled': 1 });
QuestionSchema.index({ status: 1, category: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ shortId: 1 }, { unique: true });
QuestionSchema.index({ createdAt: -1 });

// Text index for search
QuestionSchema.index({
'questionContent.text': 'text',
'answerContent.text': 'text',
'questionContent.emojis': 'text'
}, {
weights: {
'questionContent.text': 10,
'answerContent.text': 5
},
default_language: 'arabic'
});

// Pre-save hooks
QuestionSchema.pre('save', function(next) {
// Set points based on difficulty
const pointsMap = { easy: 200, medium: 400, hard: 600 };
this.points = pointsMap[this.difficulty];

// Auto-enable everyoneAnswers if MC options exist
if (this.multipleChoice?.options?.length >= 4) {
const hasCorrect = this.multipleChoice.options.some(o => o.isCorrect);
if (hasCorrect) {
this.multipleChoice.enabled = true;
}
}

// Validate game compatibility
if (this.gamesAvailable.everyoneAnswers.enabled) {
if (!this.multipleChoice.enabled || this.multipleChoice.options.length < 4) {
this.gamesAvailable.everyoneAnswers.enabled = false;
}
}

next();
});

// Virtual for success rate
QuestionSchema.virtual('successRate').get(function() {
if (this.stats.timesPlayed === 0) return 0;
return Math.round((this.stats.timesCorrect / this.stats.timesPlayed) \* 100);
});

// Methods
QuestionSchema.methods.recordPlay = async function(correct, answerTime, gameType) {
this.stats.timesPlayed++;
if (correct) {
this.stats.timesCorrect++;
} else {
this.stats.timesWrong++;
}

// Update average answer time
const totalTime = this.stats.averageAnswerTime \* (this.stats.timesPlayed - 1) + answerTime;
this.stats.averageAnswerTime = totalTime / this.stats.timesPlayed;

// Update game type stats
if (gameType === 'main') this.stats.mainGamePlays++;
else if (gameType === 'everyone') this.stats.everyoneAnswersPlays++;
else if (gameType === 'buzzer') this.stats.buzzerPlays++;

this.stats.lastPlayedAt = new Date();

await this.save();
};

QuestionSchema.methods.recordOptionSelection = async function(optionId) {
const optionStat = this.stats.optionSelections.find(o => o.optionId === optionId);
if (optionStat) {
optionStat.timesSelected++;
} else {
this.stats.optionSelections.push({ optionId, timesSelected: 1 });
}
await this.save();
};

// Ensure virtuals are included in JSON
QuestionSchema.set('toJSON', { virtuals: true });
QuestionSchema.set('toObject', { virtuals: true });

//////////////////////////////////////////////
// QUESTION PACK SCHEMA
//////////////////////////////////////////////

const QuestionPackSchema = new mongoose.Schema({
// Basic Info
name: {
type: String,
required: [true, 'Pack name is required'],
trim: true,
maxlength: [100, 'Pack name cannot exceed 100 characters']
},

nameEn: {
type: String,
trim: true
},

description: {
type: String,
trim: true,
maxlength: [500, 'Description cannot exceed 500 characters']
},

// Visual
coverImage: String,
color: String,
icon: String,

// Questions
questions: [{
question: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Question',
required: true
},
order: { type: Number, default: 0 }
}],

// Settings
shuffleQuestions: { type: Boolean, default: true },

// Filters used to create this pack (for smart packs)
smartFilters: {
isSmartPack: { type: Boolean, default: false },
categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
difficulties: [String],
tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
minQuestions: Number,
maxQuestions: Number
},

// Game Restrictions
gamesAvailable: {
mainGame: { type: Boolean, default: true },
everyoneAnswers: { type: Boolean, default: true },
buzzerMode: { type: Boolean, default: true }
},

// Status
isActive: { type: Boolean, default: true },
isPublic: { type: Boolean, default: false }, // For sharing

// Stats
stats: {
timesUsed: { type: Number, default: 0 },
lastUsedAt: Date
},

// Metadata
createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
}

}, {
timestamps: true
});

// Virtual for question count
QuestionPackSchema.virtual('questionCount').get(function() {
return this.questions.length;
});

//////////////////////////////////////////////
// GAME SCHEMA (History)
//////////////////////////////////////////////

const GameSchema = new mongoose.Schema({
// Identification
shortId: {
type: String,
unique: true,
default: () => nanoid(10)
},

// Game Type
gameType: {
type: String,
enum: ['main', 'everyone', 'buzzer'],
required: true,
index: true
},

//////////////////////////////////////////////
// MAIN GAME DATA
//////////////////////////////////////////////

teams: [{
name: { type: String, required: true },
icon: String,
color: String,

    // Score tracking
    scores: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      points: Number,
      correct: Boolean,
      timestamp: Date
    }],

    finalScore: { type: Number, default: 0 },

    // Helpers used
    helpersUsed: {
      callFriend: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        usedAt: Date
      }],
      thePit: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        pointsDeducted: Number,
        usedAt: Date
      }],
      doubleAnswer: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        usedAt: Date
      }],
      takeRest: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        targetPlayer: String,
        usedAt: Date
      }]
    }

}],

// Winner (for main game)
winner: {
teamIndex: Number, // 0 or 1, null for tie
teamName: String,
finalScore: Number
},

//////////////////////////////////////////////
// QR GAME DATA (Everyone Answers / Buzzer)
//////////////////////////////////////////////

players: [{
odIdcketId: String, // Socket ID during game
name: String,
avatar: String,

    // Score tracking
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: String,
      correct: Boolean,
      points: Number,
      timeToAnswer: Number,  // milliseconds
      timestamp: Date
    }],

    // For buzzer mode
    buzzes: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      position: Number,  // 1st, 2nd, etc.
      timestamp: Date,
      answeredCorrectly: Boolean
    }],

    finalScore: { type: Number, default: 0 },
    rank: Number,

    // Stats
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    averageTime: Number

}],

//////////////////////////////////////////////
// SHARED GAME DATA
//////////////////////////////////////////////

// Categories used
categories: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'Category'
}],

// All questions played in order
questionsPlayed: [{
question: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Question'
},
order: Number,

    // Results
    answeredCorrectly: Boolean,
    answeredBy: String,  // Team name or player name
    timeToAnswer: Number,
    pointsAwarded: Number,

    // For main game
    helperUsed: String,
    bothTeamsWrong: Boolean,

    // For QR games
    playerResults: [{
      playerId: String,
      answer: String,
      correct: Boolean,
      points: Number,
      timeToAnswer: Number
    }],

    playedAt: Date

}],

// Question pack used (if any)
questionPack: {
type: mongoose.Schema.Types.ObjectId,
ref: 'QuestionPack'
},

// Game Settings
settings: {
timePerQuestion: Number,
questionsCount: Number,
pointsEasy: Number,
pointsMedium: Number,
pointsHard: Number
},

// Timing
startedAt: Date,
endedAt: Date,
duration: Number, // seconds

// Status
status: {
type: String,
enum: ['in_progress', 'completed', 'abandoned'],
default: 'in_progress'
},

// Metadata
createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
}

}, {
timestamps: true
});

// Indexes
GameSchema.index({ gameType: 1, createdAt: -1 });
GameSchema.index({ status: 1 });
GameSchema.index({ 'teams.name': 1 });
GameSchema.index({ categories: 1 });

// Calculate duration on complete
GameSchema.methods.complete = async function() {
this.status = 'completed';
this.endedAt = new Date();
this.duration = Math.round((this.endedAt - this.startedAt) / 1000);
await this.save();
};

//////////////////////////////////////////////
// SESSION SCHEMA (Active QR Games)
//////////////////////////////////////////////

const SessionSchema = new mongoose.Schema({
// Session Code (for QR)
sessionId: {
type: String,
unique: true,
required: true,
uppercase: true,
match: [/^[A-Z0-9]{6}$/, 'Session ID must be 6 alphanumeric characters']
},

// Game Type
gameType: {
type: String,
enum: ['everyone', 'buzzer'],
required: true
},

// Host
hostSocketId: String,

// Players
players: [{
socketId: {
type: String,
required: true
},
name: {
type: String,
required: true,
trim: true
},
avatar: String,
color: String,

    score: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lockedOut: { type: Boolean, default: false },  // For buzzer mode

    // Stats during session
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    totalAnswerTime: { type: Number, default: 0 },

    joinedAt: { type: Date, default: Date.now },
    lastActivityAt: Date

}],

// Current Question State
currentQuestion: {
questionId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Question'
},
questionNumber: Number,
startedAt: Date,
endsAt: Date,

    // Submitted answers (Everyone Answers)
    answers: [{
      socketId: String,
      playerName: String,
      answer: String,  // Option ID or text
      timestamp: Date,
      timeToAnswer: Number  // milliseconds from question start
    }],

    // Buzzes (Buzzer Mode)
    buzzes: [{
      socketId: String,
      playerName: String,
      timestamp: Date,
      position: Number,
      processed: { type: Boolean, default: false },
      correct: Boolean
    }],

    // Current buzzer holder
    currentBuzzer: {
      socketId: String,
      playerName: String,
      buzzedAt: Date,
      answerDeadline: Date
    },

    // Locked out players (wrong answers in buzzer)
    lockedOutPlayers: [String]  // Socket IDs

},

// Questions for this session
questions: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'Question'
}],

questionsAsked: [{
questionId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Question'
},
askedAt: Date,
results: mongoose.Schema.Types.Mixed // Store results for history
}],

// Session Settings
settings: {
questionTime: { type: Number, default: 30 },
buzzerAnswerTime: { type: Number, default: 10 },
questionsCount: { type: Number, default: 10 },
categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
difficulties: [String],
pointsEasy: { type: Number, default: 200 },
pointsMedium: { type: Number, default: 400 },
pointsHard: { type: Number, default: 600 },
speedBonusEnabled: { type: Boolean, default: true },
wrongAnswerPenalty: { type: Number, default: 0 } // Percentage
},

// Status
status: {
type: String,
enum: ['waiting', 'starting', 'question_active', 'showing_results', 'between_questions', 'ended'],
default: 'waiting'
},

// Timing
createdAt: { type: Date, default: Date.now },
startedAt: Date,
endedAt: Date,

// Auto-expire
expiresAt: {
type: Date,
default: () => new Date(Date.now() + 4 _ 60 _ 60 \* 1000) // 4 hours
}

}, {
timestamps: true
});

// TTL Index for auto-cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ status: 1 });
SessionSchema.index({ hostSocketId: 1 });

// Methods
SessionSchema.methods.addPlayer = function(socketId, name, avatar) {
// Check if player already exists
const existing = this.players.find(p => p.socketId === socketId);
if (existing) {
existing.isActive = true;
existing.lastActivityAt = new Date();
return existing;
}

const player = {
socketId,
name,
avatar,
score: 0,
joinedAt: new Date(),
lastActivityAt: new Date()
};
this.players.push(player);
return player;
};

SessionSchema.methods.removePlayer = function(socketId) {
const player = this.players.find(p => p.socketId === socketId);
if (player) {
player.isActive = false;
}
};

SessionSchema.methods.getActivePlayers = function() {
return this.players.filter(p => p.isActive);
};

SessionSchema.methods.getLeaderboard = function() {
return this.players
.filter(p => p.isActive)
.sort((a, b) => b.score - a.score)
.map((p, index) => ({
...p.toObject(),
rank: index + 1
}));
};

//////////////////////////////////////////////
// TAG SCHEMA
//////////////////////////////////////////////

const TagSchema = new mongoose.Schema({
name: {
type: String,
required: true,
unique: true,
trim: true,
maxlength: 50
},

nameEn: {
type: String,
trim: true
},

color: String,

// Stats
questionCount: { type: Number, default: 0 },

createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
}

}, {
timestamps: true
});

TagSchema.index({ name: 1 }, { unique: true });

//////////////////////////////////////////////
// MEDIA SCHEMA
//////////////////////////////////////////////

const MediaSchema = new mongoose.Schema({
// File Info
filename: {
type: String,
required: true
},

originalName: {
type: String,
required: true
},

mimeType: {
type: String,
required: true
},

type: {
type: String,
enum: ['image', 'audio', 'video'],
required: true,
index: true
},

// Storage
url: {
type: String,
required: true
},

path: {
type: String,
required: true
},

size: {
type: Number,
required: true
},

// Image-specific
dimensions: {
width: Number,
height: Number
},

// Audio/Video-specific
duration: Number, // seconds

// Thumbnail (for video)
thumbnailUrl: String,

// Usage tracking
usedInQuestions: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'Question'
}],

usageCount: { type: Number, default: 0 },

// Metadata
uploadedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
},

tags: [String]

}, {
timestamps: true
});

MediaSchema.index({ type: 1 });
MediaSchema.index({ filename: 1 });

//////////////////////////////////////////////
// SETTINGS SCHEMA (Singleton)
//////////////////////////////////////////////

const SettingsSchema = new mongoose.Schema({
// App Identity
appName: { type: String, default: 'تريفيا ماستر' },
appNameEn: { type: String, default: 'Trivia Master' },
logoUrl: String,
faviconUrl: String,

// Game Defaults
gameDefaults: {
mainGame: {
timePerQuestion: { type: Number, default: 30 },
questionsPerCategory: { type: Number, default: 6 },
pointsEasy: { type: Number, default: 200 },
pointsMedium: { type: Number, default: 400 },
pointsHard: { type: Number, default: 600 }
},
everyoneAnswers: {
timePerQuestion: { type: Number, default: 30 },
defaultQuestionsCount: { type: Number, default: 10 },
speedBonusEnabled: { type: Boolean, default: true },
speedBonusTiers: {
tier1: { withinSeconds: 5, percentage: 100 },
tier2: { withinSeconds: 15, percentage: 75 },
tier3: { withinSeconds: 25, percentage: 50 },
tier4: { withinSeconds: 30, percentage: 25 }
}
},
buzzerMode: {
timeToAnswerAfterBuzz: { type: Number, default: 10 },
wrongAnswerPenalty: { type: Number, default: 50 },
defaultQuestionsCount: { type: Number, default: 15 }
}
},

// Sound Settings
sounds: {
enabled: { type: Boolean, default: true },
volume: { type: Number, default: 0.7 }
},

// Session Settings
sessionSettings: {
maxPlayersPerSession: { type: Number, default: 20 },
sessionExpiryHours: { type: Number, default: 4 }
},

// UI Settings
uiSettings: {
defaultLanguage: { type: String, default: 'ar' },
showTimerWarningAt: { type: Number, default: 10 }
},

// Backup Settings
backup: {
autoBackupEnabled: { type: Boolean, default: false },
backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
lastBackupAt: Date
},

updatedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
}

}, {
timestamps: true
});

// Ensure only one settings document
SettingsSchema.statics.getSettings = async function() {
let settings = await this.findOne();
if (!settings) {
settings = await this.create({});
}
return settings;
};

//////////////////////////////////////////////
// ACTIVITY LOG SCHEMA
//////////////////////////////////////////////

const ActivityLogSchema = new mongoose.Schema({
// Who
admin: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Admin'
},
adminUsername: String,

// What
action: {
type: String,
enum: [
// Auth
'login', 'logout', 'password_change',
// Categories
'category_create', 'category_update', 'category_delete',
// Questions
'question_create', 'question_update', 'question_delete', 'question_bulk_update',
// Packs
'pack_create', 'pack_update', 'pack_delete',
// Games
'game_start', 'game_complete',
// Media
'media_upload', 'media_delete',
// Import/Export
'data_import', 'data_export',
// Settings
'settings_update',
// Admin
'admin_create', 'admin_update', 'admin_delete'
],
required: true,
index: true
},

// On What
targetType: {
type: String,
enum: ['category', 'question', 'pack', 'game', 'media', 'admin', 'settings', 'system']
},

targetId: mongoose.Schema.Types.ObjectId,
targetName: String, // For display purposes

// Details
details: mongoose.Schema.Types.Mixed,

// Changes (for updates)
changes: {
before: mongoose.Schema.Types.Mixed,
after: mongoose.Schema.Types.Mixed
},

// Context
ipAddress: String,
userAgent: String

}, {
timestamps: true
});

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ admin: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ targetType: 1, targetId: 1 });

===========================================
API ENDPOINTS (Complete)
===========================================

Base URL: /api/v1

//////////////////////////////////////////////
// AUTHENTICATION
//////////////////////////////////////////////

POST /auth/login
Body: { username, password }
Response: { token, refreshToken, admin: { id, username, displayName, role, permissions } }

POST /auth/logout
Headers: Authorization: Bearer <token>
Response: { message: 'Logged out successfully' }

POST /auth/refresh
Body: { refreshToken }
Response: { token, refreshToken }

GET /auth/me
Headers: Authorization: Bearer <token>
Response: { admin: { id, username, displayName, email, role, permissions, lastLogin } }

PUT /auth/password
Headers: Authorization: Bearer <token>
Body: { currentPassword, newPassword }
Response: { message: 'Password updated' }

//////////////////////////////////////////////
// ADMIN MANAGEMENT
//////////////////////////////////////////////

GET /admins
Query: ?page=1&limit=10&role=admin&search=
Response: { admins: [...], total, page, pages }
Permission: canManageAdmins

GET /admins/:id
Response: { admin: {...} }
Permission: canManageAdmins

POST /admins
Body: { username, email, password, displayName, role, permissions }
Response: { admin: {...} }
Permission: canManageAdmins

PUT /admins/:id
Body: { displayName?, email?, role?, permissions?, isActive? }
Response: { admin: {...} }
Permission: canManageAdmins

DELETE /admins/:id
Response: { message: 'Admin deleted' }
Permission: canManageAdmins (cannot delete self or super_admin)

//////////////////////////////////////////////
// CATEGORIES
//////////////////////////////////////////////

GET /categories
Query: ?active=true&game=mainGame&withStats=true&search=
Response: { categories: [...] }

GET /categories/:id
Query: ?withQuestionCounts=true
Response: { category: {...} }

POST /categories
Body: { name, nameEn?, description?, descriptionEn?, icon, iconType, color, gamesAvailable, defaultTimeLimit? }
Response: { category: {...} }
Permission: canManageCategories

PUT /categories/:id
Body: { ...fieldsToUpdate }
Response: { category: {...} }
Permission: canManageCategories

DELETE /categories/:id
Query: ?moveQuestionsTo=<categoryId> (optional, otherwise questions become uncategorized)
Response: { message: 'Category deleted', questionsAffected: N }
Permission: canManageCategories

PUT /categories/reorder
Body: { orderedIds: ['id1', 'id2', ...] }
Response: { categories: [...] }
Permission: canManageCategories

GET /categories/:id/questions
Query: ?difficulty=easy&status=active&page=1&limit=20
Response: { questions: [...], total, page, pages }

POST /categories/:id/update-stats
(Recalculates category statistics)
Response: { category: {...} }
Permission: canManageCategories

//////////////////////////////////////////////
// QUESTIONS
//////////////////////////////////////////////

GET /questions
Query: {
category: ObjectId or comma-separated IDs,
difficulty: easy|medium|hard or comma-separated,
questionType: text|image|audio|... or comma-separated,
status: draft|active|needs_review|archived,
game: mainGame|everyoneAnswers|buzzerMode,
hasMultipleChoice: true|false,
hasMedia: true|false,
tags: comma-separated tag IDs,
search: text search,
minTimesPlayed: number,
maxTimesPlayed: number,
minSuccessRate: number,
maxSuccessRate: number,
createdAfter: date,
createdBefore: date,
sortBy: createdAt|timesPlayed|successRate|difficulty,
sortOrder: asc|desc,
page: number,
limit: number (max 100)
}
Response: { questions: [...], total, page, pages, filters: {...} }

GET /questions/:id
Query: ?withCategory=true&withTags=true
Response: { question: {...} }

GET /questions/shortId/:shortId
Response: { question: {...} }

POST /questions
Body: (Full question object as per schema)
Response: { question: {...} }
Permission: canManageQuestions

PUT /questions/:id
Body: { ...fieldsToUpdate }
Response: { question: {...} }
Permission: canManageQuestions

DELETE /questions/:id
Response: { message: 'Question deleted' }
Permission: canManageQuestions

POST /questions/:id/duplicate
Body: { category?: newCategoryId }
Response: { question: {...} } (new duplicated question)
Permission: canManageQuestions

POST /questions/bulk
Body: { questions: [...] } (array of question objects)
Response: { created: N, failed: N, errors: [...] }
Permission: canManageQuestions

PUT /questions/bulk
Body: { ids: [...], updates: { status?, category?, difficulty?, ... } }
Response: { updated: N }
Permission: canManageQuestions

DELETE /questions/bulk
Body: { ids: [...] }
Response: { deleted: N }
Permission: canManageQuestions

// Question Statistics
POST /questions/:id/record-play
Body: { correct: boolean, answerTime: number, gameType: string, optionSelected?: string }
Response: { question: {...} }

GET /questions/:id/stats
Response: {
timesPlayed, timesCorrect, successRate,
averageAnswerTime, optionDistribution: {...},
playsByGameType: {...}, recentPlays: [...]
}

// Question Selection for Games
POST /questions/for-game
Body: {
categories: [categoryIds],
questionsPerCategory: { easy: 2, medium: 2, hard: 2 },
excludeQuestionIds: [...],
gameType: 'main' | 'everyone' | 'buzzer',
preferUnplayed: boolean (default true)
}
Response: {
questions: {
[categoryId]: {
easy: [...],
medium: [...],
hard: [...]
}
},
totalSelected: N,
fromExcluded: N (questions that had to be reused)
}

// Validation
POST /questions/validate
Body: (question object)
Response: { valid: boolean, errors: [...], warnings: [...] }

//////////////////////////////////////////////
// QUESTION PACKS
//////////////////////////////////////////////

GET /packs
Query: ?active=true&game=mainGame&search=&page=1&limit=20
Response: { packs: [...], total, page, pages }

GET /packs/:id
Query: ?withQuestions=true
Response: { pack: {...} }

POST /packs
Body: { name, description?, coverImage?, questions: [{ question: id, order }], settings, gamesAvailable }
Response: { pack: {...} }
Permission: canManagePacks

PUT /packs/:id
Body: { ...fieldsToUpdate }
Response: { pack: {...} }
Permission: canManagePacks

DELETE /packs/:id
Response: { message: 'Pack deleted' }
Permission: canManagePacks

POST /packs/:id/duplicate
Response: { pack: {...} }
Permission: canManagePacks

POST /packs/:id/add-questions
Body: { questionIds: [...] }
Response: { pack: {...} }
Permission: canManagePacks

DELETE /packs/:id/questions/:questionId
Response: { pack: {...} }
Permission: canManagePacks

PUT /packs/:id/reorder-questions
Body: { orderedQuestionIds: [...] }
Response: { pack: {...} }
Permission: canManagePacks

// Smart Pack Generation
POST /packs/generate
Body: {
name, categories: [...], difficulties: [...],
tags: [...], count: number, shuffled: boolean
}
Response: { pack: {...} }
Permission: canManagePacks

//////////////////////////////////////////////
// TAGS
//////////////////////////////////////////////

GET /tags
Query: ?search=&sortBy=name|questionCount&page=1&limit=50
Response: { tags: [...], total }

GET /tags/:id
Response: { tag: {...} }

POST /tags
Body: { name, nameEn?, color? }
Response: { tag: {...} }
Permission: canManageQuestions

PUT /tags/:id
Body: { name?, nameEn?, color? }
Response: { tag: {...} }
Permission: canManageQuestions

DELETE /tags/:id
(Removes tag from all questions)
Response: { message: 'Tag deleted', questionsAffected: N }
Permission: canManageQuestions

POST /tags/merge
Body: { sourceTagIds: [...], targetTagId }
Response: { tag: {...}, questionsUpdated: N }
Permission: canManageQuestions

//////////////////////////////////////////////
// MEDIA
//////////////////////////////////////////////

GET /media
Query: ?type=image|audio|video&search=&unused=true&page=1&limit=50
Response: { media: [...], total, page, pages }

GET /media/:id
Response: { media: {...} }

POST /media/upload
FormData: { file, type: image|audio|video, tags?: [] }
Response: { media: {...} }
Permission: canManageQuestions

POST /media/upload-multiple
FormData: { files[], type }
Response: { media: [...], failed: [...] }
Permission: canManageQuestions

DELETE /media/:id
Query: ?force=true (delete even if used in questions)
Response: { message: 'Media deleted' }
Permission: canManageQuestions

DELETE /media/unused
(Delete all media not used in any question)
Response: { deleted: N, freedSpace: 'X MB' }
Permission: canManageQuestions

GET /media/:id/usage
Response: { questions: [...] } (questions using this media)

//////////////////////////////////////////////
// GAMES (History)
//////////////////////////////////////////////

GET /games
Query: {
gameType: main|everyone|buzzer,
status: in_progress|completed|abandoned,
dateFrom, dateTo,
category,
search: (team/player names),
page, limit
}
Response: { games: [...], total, page, pages }

GET /games/:id
Query: ?withQuestions=true&withFullDetails=true
Response: { game: {...} }

POST /games
Body: { gameType, teams?: [...], categories, settings, questionPack? }
Response: { game: {...} }

PUT /games/:id
Body: { teams?, players?, questionsPlayed?, ... }
Response: { game: {...} }

POST /games/:id/complete
Body: { winner?, duration?, finalScores }
Response: { game: {...} }

POST /games/:id/abandon
Response: { game: {...} }

DELETE /games/:id
Response: { message: 'Game deleted' }
Permission: canManageSettings

//////////////////////////////////////////////
// SESSIONS (Active QR Games)
//////////////////////////////////////////////

POST /sessions
Body: { gameType: 'everyone'|'buzzer', settings }
Response: { session: {...}, sessionId, qrUrl }

GET /sessions/:sessionId
Response: { session: {...} }

GET /sessions/:sessionId/leaderboard
Response: { leaderboard: [...] }

PUT /sessions/:sessionId/settings
Body: { settings }
Response: { session: {...} }

DELETE /sessions/:sessionId
Response: { message: 'Session ended' }

GET /sessions/active
Response: { sessions: [...] }

//////////////////////////////////////////////
// STATISTICS
//////////////////////////////////////////////

GET /stats/dashboard
Response: {
overview: {
totalQuestions, totalCategories, totalGames,
totalPacks, activeQuestions
},
questionsByDifficulty: { easy, medium, hard },
questionsByCategory: [...],
questionsByType: {...},
gamesByType: { main, everyone, buzzer },
recentGames: [...],
topCategories: [...],
contentWarnings: {
categoriesWithFewQuestions: [...],
questionsNeedingReview: N,
questionsMissingMC: N,
unusedMedia: N
}
}
Permission: canViewStats

GET /stats/questions
Query: ?dateFrom&dateTo&category&difficulty
Response: {
totalPlayed, correctRate, averageTime,
byDifficulty: {...}, byCategory: {...},
hardestQuestions: [...], easiestQuestions: [...],
mostPlayed: [...], leastPlayed: [...]
}
Permission: canViewStats

GET /stats/games
Query: ?dateFrom&dateTo&gameType
Response: {
totalGames, averageDuration, averageScore,
byType: {...}, byDay: [...], peakHours: [...]
}
Permission: canViewStats

GET /stats/trends
Query: ?period=week|month|year
Response: {
gamesOverTime: [...],
questionsAddedOverTime: [...],
successRateOverTime: [...]
}
Permission: canViewStats

//////////////////////////////////////////////
// IMPORT/EXPORT
//////////////////////////////////////////////

GET /import-export/templates/:type
Params: type = questions|categories|full
Response: (File download - Excel/CSV template)
Permission: canExportData

POST /import-export/import/preview
FormData: { file, type: questions|categories }
Response: {
preview: [...first 10 rows],
totalRows: N,
validRows: N,
errors: [...],
warnings: [...]
}
Permission: canImportData

POST /import-export/import/execute
Body: { importId, options: { skipErrors, updateExisting } }
Response: {
created: N, updated: N, skipped: N,
errors: [...]
}
Permission: canImportData

POST /import-export/export
Body: {
type: 'questions'|'categories'|'full'|'games',
format: 'json'|'csv'|'excel',
filters: { categories?, difficulties?, status? },
includeMedia: boolean
}
Response: (File download or { downloadUrl })
Permission: canExportData

POST /import-export/backup
Response: { downloadUrl, filename, size }
Permission: canManageSettings

POST /import-export/restore
FormData: { backupFile }
Response: { restored: { questions, categories, ... } }
Permission: canManageSettings

//////////////////////////////////////////////
// SETTINGS
//////////////////////////////////////////////

GET /settings
Response: { settings: {...} }

PUT /settings
Body: { ...settingsToUpdate }
Response: { settings: {...} }
Permission: canManageSettings

POST /settings/reset
Body: { section?: 'gameDefaults'|'sounds'|'all' }
Response: { settings: {...} }
Permission: canManageSettings

//////////////////////////////////////////////
// ACTIVITY LOG
//////////////////////////////////////////////

GET /activity
Query: {
admin,
action,
targetType,
targetId,
dateFrom, dateTo,
page, limit
}
Response: { activities: [...], total, page, pages }
Permission: canManageSettings

===========================================
SOCKET.IO EVENTS (Complete)
===========================================

//////////////////////////////////////////////
// CONNECTION & SESSION MANAGEMENT
//////////////////////////////////////////////

// Server → Client
'connect' // Connection established
'disconnect' // Connection lost
'error' // Error occurred
'reconnect' // Reconnection successful

// Client → Server
'create-session' {
gameType: 'everyone' | 'buzzer',
settings: { questionTime, questionsCount, categories, ... }
}

// Server → Client (host only)
'session-created' {
sessionId: 'ABC123',
qrUrl: '/qr-game/everyone/controller?session=ABC123',
session: { ...full session object }
}

// Client → Server (players)
'join-session' {
sessionId: 'ABC123',
playerName: 'أحمد',
avatar: 'avatar-1'
}

// Server → All in room
'player-joined' {
player: { socketId, name, avatar, score },
players: [...all active players],
playerCount: N
}

// Server → All in room
'player-left' {
playerId: socketId,
playerName: 'أحمد',
players: [...remaining players],
playerCount: N
}

// Client → Server (player reconnecting)
'rejoin-session' {
sessionId: 'ABC123',
previousSocketId: 'old-socket-id',
playerName: 'أحمد'
}

// Server → Client (rejoining player)
'rejoin-success' {
player: {...},
currentState: 'waiting' | 'question_active' | 'showing_results',
currentQuestion?: {...},
timeRemaining?: N
}

//////////////////////////////////////////////
// EVERYONE ANSWERS MODE
//////////////////////////////////////////////

// Client → Server (host)
'start-everyone-game' {
sessionId: 'ABC123'
}

// Server → All in room
'game-starting' {
countdown: 3,
totalQuestions: 10
}

// Server → All in room
'everyone-question' {
questionNumber: 1,
totalQuestions: 10,
question: {
id,
type: 'text' | 'image' | 'audio' | ...,
content: {
text: 'ما هي عاصمة الكويت؟',
mediaUrl?: '...',
// Other content based on type
},
options: [
{ id: 'a', text: 'الكويت', imageUrl?: '...' },
{ id: 'b', text: 'الرياض' },
{ id: 'c', text: 'دبي' },
{ id: 'd', text: 'مسقط' }
],
difficulty: 'easy',
points: 200
},
timeLimit: 30,
startsAt: timestamp,
endsAt: timestamp
}

// Client → Server (players)
'everyone-answer' {
sessionId: 'ABC123',
answer: 'a', // Option ID
timestamp: Date.now()
}

// Server → All in room (progress update)
'answer-received' {
answeredCount: 5,
totalPlayers: 8,
playerId: socketId // Who just answered (for animation)
}

// Server → Individual player
'answer-confirmed' {
received: true,
timeToAnswer: 5230 // ms
}

// Server → All in room (when time up or all answered)
'everyone-results' {
correctAnswer: {
optionId: 'a',
text: 'الكويت',
explanation?: '...'
},
playerResults: [
{
playerId: socketId,
playerName: 'أحمد',
answer: 'a',
correct: true,
timeToAnswer: 5230,
basePoints: 200,
speedBonus: 50,
totalPoints: 250,
newScore: 450
},
// ... other players
],
leaderboard: [
{ playerId, playerName, score, rank, change: +2 },
// ...
],
optionDistribution: {
'a': 5, // 5 players chose A
'b': 2,
'c': 1,
'd': 0
}
}

// Server → All in room (between questions)
'next-question-countdown' {
countdown: 5,
nextQuestionNumber: 2
}

//////////////////////////////////////////////
// BUZZER MODE
//////////////////////////////////////////////

// Client → Server (host)
'start-buzzer-game' {
sessionId: 'ABC123'
}

// Server → All in room
'buzzer-question' {
questionNumber: 1,
totalQuestions: 15,
question: {
id,
type,
content: {
text: 'أكمل المثل: اللي ما يعرف...',
mediaUrl?: '...'
},
difficulty: 'medium',
points: 400,
// NO options sent - open ended
hasMultipleChoice: false // Or true if MC mode
},
timeLimit: null, // No time limit until someone buzzes
buzzingEnabled: true
}

// If MC mode enabled
'buzzer-question-mc' {
// Same as above but with options
question: {
// ...
options: [...],
hasMultipleChoice: true
}
}

// Client → Server (players)
'buzz' {
sessionId: 'ABC123',
timestamp: Date.now()
}

// Server → All in room
'player-buzzed' {
playerId: socketId,
playerName: 'سارة',
buzzPosition: 1,
timeToAnswer: 10, // seconds to answer
answerDeadline: timestamp
}

// Server → Other players
'buzzing-disabled' {
reason: 'player_buzzed',
buzzedBy: 'سارة'
}

// Client → Server (buzzed player, if MC mode)
'buzzer-answer' {
sessionId: 'ABC123',
answer: 'b' // Option ID
}

// Client → Server (host, if judge mode)
'judge-decision' {
sessionId: 'ABC123',
correct: true | false
}

// Server → All in room (correct answer)
'buzzer-correct' {
playerId: socketId,
playerName: 'سارة',
pointsAwarded: 400,
newScore: 800,
correctAnswer: {
text: 'الصقر ما يصيد ذباب',
explanation?: '...'
},
leaderboard: [...]
}

// Server → All in room (wrong answer)
'buzzer-wrong' {
playerId: socketId,
playerName: 'سارة',
pointsLost: 200, // Penalty
newScore: 400,
lockedOut: true,
buzzingReEnabled: true,
lockedOutPlayers: [socketId, ...]
}

// Server → All in room (answer timeout)
'buzzer-timeout' {
playerId: socketId,
playerName: 'سارة',
pointsLost: 200,
buzzingReEnabled: true
}

// Server → All in room (all locked out)
'buzzer-all-locked' {
correctAnswer: {...},
leaderboard: [...]
}

// Server → Individual player
'you-are-locked' {
reason: 'wrong_answer' | 'timeout',
canBuzzNextQuestion: true
}

//////////////////////////////////////////////
// GAME END
//////////////////////////////////////////////

// Server → All in room
'game-ending' {
reason: 'all_questions_complete' | 'host_ended' | 'timeout',
finalQuestion: true
}

// Server → All in room
'game-ended' {
finalLeaderboard: [
{ rank: 1, playerId, playerName, score, correctCount, averageTime },
// ...
],
winner: {
playerId, playerName, score
},
podium: {
first: {...},
second: {...},
third: {...}
},
gameStats: {
totalQuestions,
averageCorrectRate,
fastestAnswer: { playerName, time },
mostImproved: { playerName, rankChange }
},
gameId: '...' // Saved game record ID
}

//////////////////////////////////////////////
// HOST CONTROLS
//////////////////////////////////////////////

// Client → Server (host)
'pause-game' { sessionId }
'resume-game' { sessionId }
'skip-question' { sessionId }
'end-game' { sessionId }
'kick-player' { sessionId, playerId }
'extend-time' { sessionId, additionalSeconds: 10 }

// Server → All in room
'game-paused' { by: 'host' }
'game-resumed' {}
'question-skipped' { correctAnswer: {...} }
'player-kicked' { playerId, playerName }
'time-extended' { newEndTime: timestamp, additionalSeconds: 10 }

//////////////////////////////////////////////
// ERROR EVENTS
//////////////////////////////////////////////

// Server → Client
'session-error' {
code: 'SESSION_NOT_FOUND' | 'SESSION_FULL' | 'GAME_ALREADY_STARTED' | ...,
message: 'الجلسة غير موجودة'
}

'game-error' {
code: 'NOT_ENOUGH_PLAYERS' | 'NO_QUESTIONS' | ...,
message: '...'
}

===========================================
SERVICES (Business Logic)
===========================================

//////////////////////////////////////////////
// QUESTION SELECTION SERVICE
//////////////////////////////////////////////

class QuestionService {

/\*\*

- Get questions for a game
- Prioritizes unplayed questions, falls back to least played
  \*/
  async getQuestionsForGame({
  categoryIds,
  questionsPerDifficulty = { easy: 2, medium: 2, hard: 2 },
  excludeQuestionIds = [],
  gameType = 'main',
  preferUnplayed = true
  }) {
  const result = {};
  let totalFromExcluded = 0;

  for (const categoryId of categoryIds) {
  result[categoryId] = { easy: [], medium: [], hard: [] };

      for (const [difficulty, count] of Object.entries(questionsPerDifficulty)) {
        // Build query
        const baseQuery = {
          category: categoryId,
          difficulty,
          status: 'active'
        };

        // Add game compatibility filter
        if (gameType === 'everyone') {
          baseQuery['gamesAvailable.everyoneAnswers.enabled'] = true;
          baseQuery['multipleChoice.enabled'] = true;
        } else if (gameType === 'buzzer') {
          baseQuery['gamesAvailable.buzzerMode.enabled'] = true;
        } else {
          baseQuery['gamesAvailable.mainGame.enabled'] = true;
        }

        // First try: Questions not in exclude list, sorted by times played
        let questions = await Question.find({
          ...baseQuery,
          _id: { $nin: excludeQuestionIds }
        })
        .sort(preferUnplayed ? { 'stats.timesPlayed': 1 } : { _id: 1 })
        .limit(count)
        .populate('category', 'name icon color');

        // If not enough, get from excluded list (reusing old questions)
        if (questions.length < count) {
          const needed = count - questions.length;
          const additionalQuestions = await Question.find({
            ...baseQuery,
            _id: { $in: excludeQuestionIds }
          })
          .sort({ 'stats.timesPlayed': 1 })
          .limit(needed)
          .populate('category', 'name icon color');

          totalFromExcluded += additionalQuestions.length;
          questions = [...questions, ...additionalQuestions];
        }

        result[categoryId][difficulty] = questions;
      }

  }

  return {
  questions: result,
  totalSelected: Object.values(result).reduce((sum, cat) =>
  sum + cat.easy.length + cat.medium.length + cat.hard.length, 0),
  fromExcluded: totalFromExcluded
  };

}

/\*\*

- Validate question for specific game type
  \*/
  validateForGameType(question, gameType) {
  const errors = [];
  const warnings = [];

  if (gameType === 'everyone') {
  if (!question.multipleChoice?.enabled) {
  errors.push('Multiple choice options required for Everyone Answers');
  }
  if (question.multipleChoice?.options?.length < 4) {
  errors.push('At least 4 options required');
  }
  if (!question.multipleChoice?.options?.some(o => o.isCorrect)) {
  errors.push('At least one correct answer required');
  }

      // Type restrictions
      if (['sequence', 'estimation'].includes(question.questionType)) {
        errors.push(`Question type "${question.questionType}" not supported in Everyone Answers`);
      }

  }

  if (gameType === 'buzzer') {
  if (['sequence'].includes(question.questionType)) {
  warnings.push('Sequence questions work best with judge mode');
  }
  }

  return { valid: errors.length === 0, errors, warnings };

}
}

//////////////////////////////////////////////
// SCORING SERVICE
//////////////////////////////////////////////

class ScoringService {

constructor(settings) {
this.settings = settings;
}

/\*\*

- Calculate points for Everyone Answers mode
  \*/
  calculateEveryoneAnswersPoints({
  basePoints,
  timeToAnswer,
  totalTime,
  correct,
  multiplier = 1
  }) {
  if (!correct) return 0;

  const tiers = this.settings.speedBonusTiers;
  let percentage = 25; // Default minimum

  if (timeToAnswer <= tiers.tier1.withinSeconds _ 1000) {
  percentage = tiers.tier1.percentage;
  } else if (timeToAnswer <= tiers.tier2.withinSeconds _ 1000) {
  percentage = tiers.tier2.percentage;
  } else if (timeToAnswer <= tiers.tier3.withinSeconds \* 1000) {
  percentage = tiers.tier3.percentage;
  } else {
  percentage = tiers.tier4.percentage;
  }

  const points = Math.round(basePoints _ (percentage / 100) _ multiplier);

  return {
  basePoints,
  percentage,
  speedBonus: points - basePoints,
  totalPoints: points
  };

}

/\*\*

- Calculate penalty for wrong buzzer answer
  _/
  calculateBuzzerPenalty({ basePoints, penaltyPercentage = 50 }) {
  return Math.round(basePoints _ (penaltyPercentage / 100));
  }

/\*\*

- Check estimation answer
  \*/
  checkEstimationAnswer({
  playerAnswer,
  correctAnswer,
  settings
  }) {
  const diff = Math.abs(playerAnswer - correctAnswer);

  if (settings.exactMatch) {
  return { correct: diff === 0, diff };
  }

  let threshold;
  if (settings.percentageRange) {
  threshold = correctAnswer _ (settings.percentageRange / 100);
  } else if (settings.absoluteRange) {
  threshold = settings.absoluteRange;
  } else {
  threshold = correctAnswer _ 0.1; // Default 10%
  }

  return {
  correct: diff <= threshold,
  diff,
  threshold,
  percentageOff: Math.round((diff / correctAnswer) \* 100)
  };

}
}

//////////////////////////////////////////////
// SESSION SERVICE
//////////////////////////////////////////////

class SessionService {

/\*\*

- Generate unique session code
  \*/
  async generateSessionCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code;
  let attempts = 0;

  do {
  code = '';
  for (let i = 0; i < length; i++) {
  code += chars.charAt(Math.floor(Math.random() \* chars.length));
  }
  attempts++;
  } while (await Session.exists({ sessionId: code }) && attempts < 10);

  if (attempts >= 10) {
  throw new Error('Could not generate unique session code');
  }

  return code;

}

/\*\*

- Clean up expired sessions
  \*/
  async cleanupExpiredSessions() {
  const result = await Session.deleteMany({
  expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
  }

/\*\*

- Get session with player stats
  \*/
  async getSessionWithStats(sessionId) {
  const session = await Session.findOne({ sessionId })
  .populate('questions')
  .populate('settings.categories');

  if (!session) return null;

  return {
  ...session.toObject(),
  playerCount: session.getActivePlayers().length,
  leaderboard: session.getLeaderboard(),
  questionsRemaining: session.questions.length - session.questionsAsked.length
  };

}
}

===========================================
PACKAGES REQUIRED
===========================================

{
"dependencies": {
"express": "^4.18.2",
"mongoose": "^8.0.0",
"socket.io": "^4.7.2",
"jsonwebtoken": "^9.0.2",
"bcryptjs": "^2.4.3",
"multer": "^1.4.5-lts.1",
"cors": "^2.8.5",
"dotenv": "^16.3.1",
"helmet": "^7.1.0",
"express-rate-limit": "^7.1.5",
"express-validator": "^7.0.1",
"nanoid": "^5.0.4",
"winston": "^3.11.0",
"morgan": "^1.10.0",
"sharp": "^0.33.0",
"fluent-ffmpeg": "^2.1.2",
"archiver": "^6.0.1",
"exceljs": "^4.4.0",
"csv-parse": "^5.5.2",
"csv-stringify": "^6.4.4"
},
"devDependencies": {
"nodemon": "^3.0.2",
"jest": "^29.7.0",
"supertest": "^6.3.3"
}
}

===========================================
INITIAL SETUP SCRIPTS
===========================================

// scripts/createAdmin.js
// Run: node scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function createAdmin() {
await mongoose.connect(process.env.MONGODB_URI);

const hashedPassword = await bcrypt.hash('admin123', 12);

await Admin.create({
username: 'admin',
email: 'admin@trivia.com',
password: hashedPassword,
displayName: 'مدير النظام',
role: 'super_admin',
permissions: {
canManageAdmins: true,
canManageCategories: true,
canManageQuestions: true,
canManagePacks: true,
canViewStats: true,
canExportData: true,
canImportData: true,
canManageSettings: true
}
});

console.log('Admin created successfully');
process.exit(0);
}

createAdmin();

// scripts/seed.js
// Run: node scripts/seed.js

// Creates sample categories and questions for testing

===========================================
ERROR CODES
===========================================

// Authentication
AUTH_001: 'Invalid credentials'
AUTH_002: 'Token expired'
AUTH_003: 'Token invalid'
AUTH_004: 'Account locked'
AUTH_005: 'Insufficient permissions'

// Categories
CAT_001: 'Category not found'
CAT_002: 'Category name already exists'
CAT_003: 'Cannot delete category with questions'

// Questions
QST_001: 'Question not found'
QST_002: 'Invalid question type'
QST_003: 'Missing required content for question type'
QST_004: 'Invalid multiple choice options'
QST_005: 'Question not compatible with game type'

// Sessions
SES_001: 'Session not found'
SES_002: 'Session expired'
SES_003: 'Session full'
SES_004: 'Game already started'
SES_005: 'Not enough players'

// Games
GAM_001: 'Game not found'
GAM_002: 'Game already completed'
GAM_003: 'Invalid game state'

// Media
MED_001: 'File too large'
MED_002: 'Invalid file type'
MED_003: 'Upload failed'
MED_004: 'Media not found'
MED_005: 'Media in use, cannot delete'

// Import/Export
IMP_001: 'Invalid file format'
IMP_002: 'Import validation failed'
IMP_003: 'Export failed'
