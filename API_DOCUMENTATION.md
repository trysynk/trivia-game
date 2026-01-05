# Arabic Trivia Game API Documentation

**Base URL:** `https://trivia-backend-br1q.onrender.com`
**Version:** 2.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Categories](#categories)
3. [Questions](#questions)
4. [Tags](#tags)
5. [Question Packs](#question-packs)
6. [Sessions (QR Games)](#sessions-qr-games)
7. [Games](#games)
8. [Media](#media)
9. [Settings](#settings)
10. [Statistics](#statistics)
11. [Activity Logs](#activity-logs)
12. [Socket Events](#socket-events)

---

## Authentication

### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "admin@trivia.com",
  "password": "admin123"
}
```
**Response:**
```json
{
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "admin": {
    "_id": "...",
    "username": "admin",
    "email": "admin@trivia.com",
    "displayName": "المدير",
    "role": "super_admin",
    "permissions": {...}
  }
}
```

### Refresh Token
```
POST /api/auth/refresh-token
```
**Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

### Get Current Admin
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
```
**Body:**
```json
{
  "displayName": "New Name",
  "avatar": "url"
}
```

### Change Password
```
PUT /api/auth/change-password
Authorization: Bearer <token>
```
**Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Admin Management (Super Admin Only)
```
GET /api/auth/admins              # List all admins
POST /api/auth/admins             # Create admin
PUT /api/auth/admins/:id          # Update admin
DELETE /api/auth/admins/:id       # Delete admin
```

---

## Categories

### Get All Categories
```
GET /api/categories
```
**Query Parameters:**
- `active` - Filter by active status (true/false)
- `gameType` - Filter by game type (mainGame, everyoneAnswers, buzzerMode)

**Response:**
```json
{
  "categories": [
    {
      "_id": "...",
      "name": "الرياضة",
      "nameEn": "Sports",
      "description": "أسئلة عن كرة القدم...",
      "icon": "sports_soccer",
      "color": "#EF4444",
      "order": 1,
      "gamesAvailable": {
        "mainGame": true,
        "everyoneAnswers": true,
        "buzzerMode": true
      },
      "stats": {
        "totalQuestions": 5,
        "questionsEasy": 2,
        "questionsMedium": 2,
        "questionsHard": 1
      }
    }
  ]
}
```

### Get Single Category
```
GET /api/categories/:id
```

### Create Category (Auth Required)
```
POST /api/categories
Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "اسم الفئة",
  "nameEn": "Category Name",
  "description": "وصف الفئة",
  "icon": "icon_name",
  "color": "#3B82F6",
  "order": 1,
  "gamesAvailable": {
    "mainGame": true,
    "everyoneAnswers": true,
    "buzzerMode": true
  }
}
```

### Update Category (Auth Required)
```
PUT /api/categories/:id
Authorization: Bearer <token>
```

### Delete Category (Auth Required)
```
DELETE /api/categories/:id
Authorization: Bearer <token>
```

---

## Questions

### Get Questions
```
GET /api/questions
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Category ID
- `difficulty` - easy, medium, hard
- `status` - active, inactive, draft
- `search` - Search in question text
- `tags` - Comma-separated tag IDs
- `gameType` - mainGame, everyoneAnswers, buzzerMode
- `hasMultipleChoice` - true/false

**Response:**
```json
{
  "questions": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 36,
    "pages": 2
  }
}
```

### Get Single Question
```
GET /api/questions/:id
```

### Get Random Question
```
GET /api/questions/random
```
**Query Parameters:**
- `category` - Category ID (required)
- `difficulty` - easy, medium, hard
- `excludeIds` - Comma-separated question IDs to exclude
- `gameType` - mainGame, everyoneAnswers, buzzerMode

### Create Question (Auth Required)
```
POST /api/questions
Authorization: Bearer <token>
```
**Body:**
```json
{
  "category": "category_id",
  "difficulty": "medium",
  "questionType": "text",
  "questionContent": {
    "text": "نص السؤال؟"
  },
  "answerType": "text",
  "answerContent": {
    "text": "الإجابة"
  },
  "options": [
    { "text": "خيار 1", "isCorrect": false },
    { "text": "خيار 2", "isCorrect": true },
    { "text": "خيار 3", "isCorrect": false },
    { "text": "خيار 4", "isCorrect": false }
  ],
  "tags": ["tag_id_1", "tag_id_2"],
  "timeLimit": 30,
  "gamesAvailable": {
    "mainGame": { "enabled": true },
    "everyoneAnswers": { "enabled": true },
    "buzzerMode": { "enabled": true }
  }
}
```

### Update Question (Auth Required)
```
PUT /api/questions/:id
Authorization: Bearer <token>
```

### Delete Question (Auth Required)
```
DELETE /api/questions/:id
Authorization: Bearer <token>
```

### Bulk Operations (Auth Required)
```
POST /api/questions/bulk/delete
Authorization: Bearer <token>
Body: { "ids": ["id1", "id2"] }

POST /api/questions/bulk/update
Authorization: Bearer <token>
Body: { "ids": ["id1", "id2"], "update": { "status": "active" } }

POST /api/questions/bulk/category
Authorization: Bearer <token>
Body: { "ids": ["id1", "id2"], "categoryId": "new_category_id" }
```

### Import/Export (Auth Required)
```
POST /api/questions/import
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: file (JSON/CSV)

GET /api/questions/export?format=json&category=id
Authorization: Bearer <token>
```

---

## Tags

### Get All Tags
```
GET /api/tags
```
**Response:**
```json
{
  "tags": [
    {
      "_id": "...",
      "name": "شائع",
      "nameEn": "Popular",
      "color": "#EF4444",
      "questionCount": 15
    }
  ]
}
```

### Get Single Tag
```
GET /api/tags/:id
```

### Create Tag (Auth Required)
```
POST /api/tags
Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "اسم الوسم",
  "nameEn": "Tag Name",
  "color": "#3B82F6"
}
```

### Update Tag (Auth Required)
```
PUT /api/tags/:id
Authorization: Bearer <token>
```

### Delete Tag (Auth Required)
```
DELETE /api/tags/:id
Authorization: Bearer <token>
```

---

## Question Packs

### Get All Packs
```
GET /api/question-packs
```
**Query Parameters:**
- `active` - Filter by active status
- `public` - Filter by public status

**Response:**
```json
{
  "packs": [
    {
      "_id": "...",
      "name": "باقة المبتدئين",
      "nameEn": "Beginner Pack",
      "description": "أسئلة سهلة للمبتدئين",
      "icon": "school",
      "color": "#10B981",
      "questionCount": 20,
      "filterType": "smart",
      "smartFilter": {
        "categories": ["..."],
        "difficulties": ["easy"],
        "tags": ["..."],
        "maxQuestions": 20
      }
    }
  ]
}
```

### Get Single Pack
```
GET /api/question-packs/:id
```

### Get Pack Questions
```
GET /api/question-packs/:id/questions
```

### Create Pack (Auth Required)
```
POST /api/question-packs
Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "اسم الباقة",
  "nameEn": "Pack Name",
  "description": "وصف الباقة",
  "icon": "icon_name",
  "color": "#3B82F6",
  "filterType": "smart",
  "smartFilter": {
    "categories": ["category_id"],
    "difficulties": ["easy", "medium"],
    "tags": ["tag_id"],
    "maxQuestions": 30
  },
  "isPublic": true
}
```

### Update Pack (Auth Required)
```
PUT /api/question-packs/:id
Authorization: Bearer <token>
```

### Delete Pack (Auth Required)
```
DELETE /api/question-packs/:id
Authorization: Bearer <token>
```

### Manage Pack Questions (Auth Required)
```
POST /api/question-packs/:id/questions
Body: { "questionIds": ["id1", "id2"] }

DELETE /api/question-packs/:id/questions
Body: { "questionIds": ["id1", "id2"] }
```

### Duplicate Pack (Auth Required)
```
POST /api/question-packs/:id/duplicate
Authorization: Bearer <token>
```

---

## Sessions (QR Games)

### Create Session
```
POST /api/sessions
```
**Body:**
```json
{
  "gameType": "everyone",
  "settings": {
    "questionTime": 30,
    "questionsCount": 10,
    "categories": ["category_id_1", "category_id_2"],
    "difficulties": ["easy", "medium"],
    "speedBonusEnabled": true
  }
}
```
**Response:**
```json
{
  "session": {
    "_id": "...",
    "sessionId": "ABC123",
    "gameType": "everyone",
    "status": "waiting",
    "settings": {...}
  }
}
```

### Get Session
```
GET /api/sessions/:sessionId
```

### Join Session (via Socket - see Socket Events)

### End Session
```
DELETE /api/sessions/:sessionId
```

---

## Games

### Get Games History
```
GET /api/games
Authorization: Bearer <token>
```
**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `gameType` - main, everyone, buzzer
- `status` - in_progress, completed, abandoned

### Get Single Game
```
GET /api/games/:id
Authorization: Bearer <token>
```

### Get Game by Short ID
```
GET /api/games/short/:shortId
```

---

## Media

### Get All Media
```
GET /api/media
Authorization: Bearer <token>
```
**Query Parameters:**
- `type` - image, audio, video
- `page`, `limit`

### Get Single Media
```
GET /api/media/:id
Authorization: Bearer <token>
```

### Upload Media (Auth Required)
```
POST /api/media
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Body:**
- `file` - The media file

**Response:**
```json
{
  "media": {
    "_id": "...",
    "filename": "image_123.jpg",
    "originalName": "photo.jpg",
    "type": "image",
    "url": "https://res.cloudinary.com/...",
    "size": 102400,
    "dimensions": { "width": 800, "height": 600 }
  }
}
```

### Upload Multiple Media (Auth Required)
```
POST /api/media/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Body:**
- `files` - Multiple media files (max 10)

### Delete Media (Auth Required)
```
DELETE /api/media/:id
Authorization: Bearer <token>
```

### Bulk Delete Media (Auth Required)
```
POST /api/media/bulk/delete
Authorization: Bearer <token>
Body: { "ids": ["id1", "id2"] }
```

### Get Unused Media (Auth Required)
```
GET /api/media/unused
Authorization: Bearer <token>
```

### Cleanup Unused Media (Auth Required)
```
POST /api/media/cleanup
Authorization: Bearer <token>
```

---

## Settings

### Get Settings
```
GET /api/settings
Authorization: Bearer <token>
```
**Response:**
```json
{
  "settings": {
    "general": {
      "siteName": "لعبة التريفيا العربية",
      "siteNameEn": "Arabic Trivia Game",
      "defaultLanguage": "ar",
      "maintenanceMode": false
    },
    "game": {
      "defaultQuestionTime": 30,
      "defaultBuzzerTime": 10,
      "defaultQuestionsCount": 10,
      "maxPlayersPerSession": 50,
      "pointsEasy": 200,
      "pointsMedium": 400,
      "pointsHard": 600,
      "speedBonusEnabled": true,
      "speedBonusTiers": [
        { "maxTime": 3, "multiplier": 1.5 },
        { "maxTime": 5, "multiplier": 1.3 },
        { "maxTime": 10, "multiplier": 1.1 }
      ]
    },
    "scoring": {
      "wrongAnswerPenalty": 0,
      "streakBonus": true,
      "streakMultipliers": [...]
    }
  }
}
```

### Update Settings (Auth Required)
```
PUT /api/settings
Authorization: Bearer <token>
```
**Body:** (partial update supported)
```json
{
  "game": {
    "defaultQuestionTime": 45
  }
}
```

### Reset Settings (Auth Required)
```
POST /api/settings/reset
Authorization: Bearer <token>
```

---

## Statistics

### Get Dashboard Stats
```
GET /api/stats/dashboard
Authorization: Bearer <token>
```
**Response:**
```json
{
  "stats": {
    "questions": {
      "total": 36,
      "byDifficulty": { "easy": 12, "medium": 15, "hard": 9 },
      "byCategory": [...],
      "recentlyAdded": 5
    },
    "categories": {
      "total": 10,
      "active": 10
    },
    "games": {
      "total": 50,
      "today": 3,
      "thisWeek": 15
    },
    "admins": {
      "total": 2
    }
  }
}
```

### Get Question Stats
```
GET /api/stats/questions
Authorization: Bearer <token>
```

### Get Category Stats
```
GET /api/stats/categories
Authorization: Bearer <token>
```

### Get Game Stats
```
GET /api/stats/games
Authorization: Bearer <token>
```
**Query Parameters:**
- `period` - day, week, month, year

---

## Activity Logs

### Get Activity Logs (Auth Required)
```
GET /api/activity
Authorization: Bearer <token>
```
**Query Parameters:**
- `page`, `limit`
- `action` - Filter by action type
- `admin` - Filter by admin ID
- `from`, `to` - Date range

**Response:**
```json
{
  "logs": [
    {
      "_id": "...",
      "action": "question_created",
      "admin": { "_id": "...", "username": "admin" },
      "details": { "questionId": "..." },
      "ipAddress": "...",
      "createdAt": "2024-01-05T..."
    }
  ],
  "pagination": {...}
}
```

### Get My Activity
```
GET /api/activity/me
Authorization: Bearer <token>
```

### Get Recent Activity
```
GET /api/activity/recent
Authorization: Bearer <token>
```

---

## Socket Events

### Connection
```javascript
const socket = io('https://trivia-backend-br1q.onrender.com');
```

### Host Events (Create/Manage Game)

#### Create Session
```javascript
socket.emit('create-session', {
  gameType: 'everyone', // or 'buzzer'
  settings: {
    questionTime: 30,
    questionsCount: 10,
    categories: ['category_id'],
    speedBonusEnabled: true
  }
});

socket.on('session-created', ({ sessionId, session }) => {
  // Display QR code with sessionId
});
```

#### Start Game
```javascript
// For Everyone Answers mode
socket.emit('start-everyone-game', { sessionId: 'ABC123' });

// For Buzzer mode
socket.emit('start-buzzer-game', { sessionId: 'ABC123' });

socket.on('game-started', ({ playerCount, questionsCount }) => {});
```

#### Skip Question
```javascript
socket.emit('skip-question', { sessionId: 'ABC123' });
// or for buzzer
socket.emit('skip-buzzer-question', { sessionId: 'ABC123' });
```

#### End Game
```javascript
socket.emit('end-everyone-game', { sessionId: 'ABC123' });
// or
socket.emit('end-buzzer-game', { sessionId: 'ABC123' });
```

#### Judge Decision (Buzzer Mode)
```javascript
socket.emit('judge-decision', {
  sessionId: 'ABC123',
  correct: true // or false
});
```

### Player Events (Join/Play Game)

#### Join Session
```javascript
socket.emit('join-session', {
  sessionId: 'ABC123',
  playerName: 'اسم اللاعب',
  avatar: 'avatar_url' // optional
});

socket.on('joined-session', ({
  session,
  playerId,
  playerColor
}) => {});

socket.on('player-joined', ({
  player,
  playerCount
}) => {});
```

#### Rejoin Session (Reconnection)
```javascript
socket.emit('player-rejoin', {
  sessionId: 'ABC123',
  playerName: 'اسم اللاعب'
});

socket.on('rejoin-success', ({ session, player }) => {});
socket.on('rejoin-failed', ({ message }) => {});
```

#### Submit Answer (Everyone Mode)
```javascript
socket.emit('submit-answer', {
  sessionId: 'ABC123',
  answer: 'الإجابة', // for text answers
  optionId: 'option_id' // for multiple choice
});

socket.on('answer-received', ({
  playerId,
  answeredCount,
  totalPlayers
}) => {});
```

#### Buzz (Buzzer Mode)
```javascript
socket.emit('buzz', { sessionId: 'ABC123' });

socket.on('player-buzzed', ({
  playerId,
  playerName,
  playerColor,
  position
}) => {});
```

### Game Flow Events

#### New Question
```javascript
// Everyone mode
socket.on('new-question', ({
  question: {
    _id,
    questionType,
    questionContent,
    options, // shuffled for multiple choice
    timeLimit
  },
  questionNumber,
  totalQuestions,
  timeLimit
}) => {});

// Buzzer mode
socket.on('new-buzzer-question', ({
  question,
  questionNumber,
  totalQuestions
}) => {});
```

#### Question Results (Everyone Mode)
```javascript
socket.on('question-results', ({
  correctAnswer,
  answerType,
  correctOptionId,
  playerResults: [{
    playerId,
    playerName,
    correct,
    pointsAwarded,
    responseTime
  }],
  leaderboard,
  stats: {
    answeredCount,
    correctCount,
    fastestCorrect
  }
}) => {});
```

#### Buzzer Results
```javascript
socket.on('buzzer-correct', ({
  playerId,
  playerName,
  playerColor,
  pointsAwarded,
  speedBonus,
  correctAnswer,
  leaderboard
}) => {});

socket.on('buzzer-wrong', ({
  playerId,
  playerName,
  playerColor,
  pointsLost
}) => {});

socket.on('all-locked-out', ({
  correctAnswer,
  answerType
}) => {});
```

#### Game End
```javascript
socket.on('game-ended', ({
  finalLeaderboard: [{
    socketId,
    name,
    color,
    score,
    correctAnswers,
    wrongAnswers,
    rank
  }],
  winner: {
    name,
    score,
    color
  },
  stats: {
    totalQuestions,
    totalPlayers,
    averageScore,
    averageTime
  }
}) => {});
```

### Player Colors
Players are automatically assigned colors from this palette:
```javascript
const PLAYER_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
];
```

---

## Question Types

| Type | Description | questionContent |
|------|-------------|-----------------|
| `text` | Text question | `{ text: "..." }` |
| `image` | Image-based | `{ text: "...", imageUrl: "..." }` |
| `audio` | Audio clip | `{ text: "...", audioUrl: "..." }` |
| `video` | Video clip | `{ text: "...", videoUrl: "..." }` |
| `blurred_image` | Blurred image reveal | `{ text: "...", imageUrl: "...", blurLevel: 10 }` |
| `two_images` | Compare two images | `{ text: "...", imageUrl1: "...", imageUrl2: "..." }` |
| `emoji` | Emoji puzzle | `{ text: "...", emojis: "🎬🦁👑" }` |
| `sequence` | Order items | `{ text: "...", items: [...] }` |
| `estimation` | Guess number | `{ text: "...", unit: "km" }` |
| `complete` | Fill in blank | `{ text: "أكمل: ___ هي عاصمة السعودية" }` |
| `map` | Location-based | `{ text: "...", mapConfig: {...} }` |
| `before_after` | Before/After images | `{ text: "...", beforeImage: "...", afterImage: "..." }` |

---

## Answer Types

| Type | Description | answerContent |
|------|-------------|---------------|
| `text` | Text answer | `{ text: "الإجابة" }` |
| `number` | Numeric answer | `{ number: 42 }` |
| `multiple_choice` | Select option | Uses `options` array |
| `estimation` | Range answer | `{ number: 100, tolerance: 10 }` |
| `sequence` | Ordered list | `{ sequence: [1, 2, 3, 4] }` |
| `location` | Map coordinates | `{ latitude: 24.7, longitude: 46.7, radius: 50 }` |

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "details": [...] // validation errors if applicable
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

---

## Rate Limiting

- **API Routes:** 100 requests per 15 minutes per IP
- **Socket Events:** No explicit limit, but abuse prevention in place

---

## Health Check

```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-05T...",
  "version": "2.0.0"
}
```
