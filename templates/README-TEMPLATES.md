# Question Import Templates

## Available Question Types
| Type | Description | Answer Type |
|------|-------------|-------------|
| `text` | Text-only question | `text` |
| `image` | Question with an image | `text` |
| `audio` | Question with audio clip | `text` |
| `video` | Question with video clip | `text` |
| `blurred_image` | Blurred image that reveals | `text` |
| `two_images` | Two images (spot difference/compare) | `text` |
| `emoji` | Guess from emojis | `text` |
| `sequence` | Order items correctly | `sequence` |
| `estimation` | Guess a number | `number` |
| `complete` | Complete the phrase/proverb | `text` |
| `map` | Location-based question | `location` |
| `before_after` | What came before/after | `text` |

## Difficulties & Points
| Difficulty | Points |
|-----------|--------|
| `easy` | 200 |
| `medium` | 400 |
| `hard` | 600 |

## Game Modes
- **mainGame**: Traditional team vs team (2 teams)
- **everyoneAnswers**: All players answer individually (needs multiple choice)
- **buzzerMode**: First to buzz in wins

## CSV Files
1. `questions-text.csv` - Text, image, audio, video, before_after questions
2. `questions-emoji.csv` - Emoji guess questions
3. `questions-complete.csv` - Complete the proverb/song/verse
4. `questions-estimation.csv` - Number estimation questions
5. `questions-multiplechoice.csv` - Multiple choice (needed for everyoneAnswers mode)

## How to Import
Run: `node src/scripts/import-questions.js templates/questions-text.csv`

## Notes
- Category names must match existing categories exactly
- For multiple choice: mark correct answer with `TRUE` in isCorrect column
- Media URLs (images/audio/video) should be uploaded to Cloudinary first
- Tags are optional, separate multiple with `|`
