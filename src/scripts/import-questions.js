require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { Question, Category, Tag, Admin } = require('../models');

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function toBool(val) {
  if (typeof val === 'boolean') return val;
  return val === 'TRUE' || val === 'true';
}

function buildQuestionData(row, categoryId, questionTags, adminId) {
  const difficulty = row.difficulty || 'medium';
  const pointsMap = { easy: 200, medium: 400, hard: 600 };
  const timeLimit = parseInt(row.timeLimit) || 30;
  const questionType = row.questionType || 'text';

  const data = {
    category: categoryId,
    difficulty,
    points: pointsMap[difficulty] || 400,
    questionType,
    answerType: row.answerType || 'text',
    status: 'active',
    isActive: true,
    tags: questionTags,
    timing: { defaultTime: timeLimit, warningTime: 10 },
    gamesAvailable: {
      mainGame: {
        enabled: toBool(row.mainGame),
        helpers: { callFriend: true, thePit: true, doubleAnswer: true, takeRest: true }
      },
      everyoneAnswers: { enabled: toBool(row.everyoneAnswers) },
      buzzerMode: { enabled: toBool(row.buzzerMode) }
    },
    createdBy: adminId
  };

  // === QUESTION CONTENT by type ===
  switch (questionType) {
    case 'emoji':
      data.questionContent = {
        text: row.emojiHint || row.questionText || '',
        emojis: [...new Intl.Segmenter().segment(row.emojis || '')].map(s => s.segment),
        emojiHint: row.emojiHint || ''
      };
      break;

    case 'complete':
      data.questionContent = {
        text: row.questionText || '',
        completeSettings: {
          fullText: row.fullText || '',
          blankMarker: row.blankMarker || '___',
          completeType: row.completeType || 'other',
          attribution: row.attribution || ''
        }
      };
      break;

    case 'estimation':
      data.answerType = 'number';
      data.questionContent = {
        text: row.questionText || '',
        estimationSettings: {
          unit: row.unit || '',
          unitPlural: row.unitPlural || '',
          minValue: parseFloat(row.minValue) || 0,
          maxValue: parseFloat(row.maxValue) || 1000,
          showSlider: toBool(row.showSlider)
        }
      };
      data.answerContent = {
        number: parseFloat(row.answerNumber),
        numberRange: {
          exactMatch: false,
          percentageRange: parseFloat(row.percentageRange) || undefined,
          absoluteRange: parseFloat(row.absoluteRange) || undefined,
          closestWins: toBool(row.closestWins)
        },
        explanation: row.explanation || ''
      };
      break;

    case 'blurred_image':
      data.questionContent = {
        text: row.questionText || '',
        mediaUrl: row.mediaUrl || '',
        mediaType: 'image',
        mediaSettings: {
          blurLevel: parseInt(row.blurLevel) || 5,
          revealMode: row.revealMode || 'instant',
          revealDuration: parseInt(row.revealDuration) || 3
        }
      };
      break;

    case 'two_images':
      data.questionContent = {
        text: row.questionText || '',
        mediaUrl: row.mediaUrl || row.mediaUrl1 || '',
        mediaUrl2: row.mediaUrl2 || '',
        mediaType: 'image',
        image1Label: row.image1Label || '',
        image2Label: row.image2Label || '',
        mediaSettings: {
          displayMode: row.displayMode || 'side_by_side'
        }
      };
      break;

    case 'sequence':
      data.answerType = 'sequence';
      const items = Array.isArray(row.items) ? row.items : [row.item1, row.item2, row.item3, row.item4].filter(Boolean);
      data.questionContent = {
        text: row.questionText || '',
        sequenceItems: items.map((content, idx) => ({
          id: `item_${idx + 1}`,
          content,
          contentType: 'text',
          correctPosition: idx + 1
        }))
      };
      data.answerContent = {
        sequenceExplanation: row.sequenceExplanation || '',
        explanation: row.explanation || ''
      };
      break;

    case 'map':
      data.answerType = 'location';
      data.questionContent = {
        text: row.questionText || '',
        mapSettings: {
          centerLat: parseFloat(row.centerLat) || 25,
          centerLng: parseFloat(row.centerLng) || 45,
          zoom: parseInt(row.zoom) || 5,
          markerLat: parseFloat(row.markerLat) || undefined,
          markerLng: parseFloat(row.markerLng) || undefined,
          hideLabels: row.hideLabels !== 'FALSE'
        }
      };
      data.answerContent = {
        text: row.answerText || '',
        alternativeAnswers: row.alternativeAnswers ? row.alternativeAnswers.split('|').map(a => a.trim()) : [],
        location: {
          name: row.answerText || '',
          lat: parseFloat(row.answerLat) || 0,
          lng: parseFloat(row.answerLng) || 0,
          acceptableRadius: parseInt(row.acceptableRadius) || 50
        },
        explanation: row.explanation || ''
      };
      break;

    default:
      // text, image, audio, video, before_after
      data.questionContent = {
        text: row.questionText || '',
        mediaUrl: row.mediaUrl || undefined,
        mediaType: row.mediaUrl ? (row.mediaType || 'image') : undefined
      };
      break;
  }

  // Multiple choice (can be added to ANY type)
  if (row.option1 || (Array.isArray(row.options) && row.options.length >= 2)) {
    const correctIdx = parseInt(row.correctOption) - 1;
    const optionTexts = Array.isArray(row.options) ? row.options : [row.option1, row.option2, row.option3, row.option4].filter(Boolean);
    const options = optionTexts.map((text, idx) => ({
      text,
      isCorrect: idx === correctIdx,
      isTrap: false
    }));

    data.multipleChoice = {
      enabled: true,
      options,
      shuffleOptions: true,
      maxSelections: 1,
      showOptionLabels: true
    };
    data.gamesAvailable.everyoneAnswers.enabled = row.everyoneAnswers === 'TRUE';
  }

  // Default answerContent (if not set by special types)
  if (!data.answerContent) {
    data.answerContent = {
      text: row.answerText || '',
      alternativeAnswers: row.alternativeAnswers ? row.alternativeAnswers.split('|').map(a => a.trim()) : [],
      explanation: row.explanation || '',
      funFact: row.funFact || ''
    };
  }

  return data;
}

async function importQuestions(filePath) {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const admin = await Admin.findOne({ role: 'super_admin' });
    if (!admin) {
      console.error('No admin found. Run seed.js first.');
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const isJSON = filePath.endsWith('.json');
    const rows = isJSON ? JSON.parse(content) : parseCSV(content);
    const fileName = path.basename(filePath);

    console.log(`\nImporting ${rows.length} questions from ${fileName}...\n`);

    const categories = await Category.find({});
    const tags = await Tag.find({});
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.name] = c._id; });
    const tagMap = {};
    tags.forEach(t => { tagMap[t.name] = t._id; });

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const categoryId = categoryMap[row.category];
        if (!categoryId) {
          console.log(`  SKIP: Category "${row.category}" not found`);
          skipped++;
          continue;
        }

        const questionTags = [];
        if (row.tags) {
          row.tags.split('|').forEach(t => {
            if (tagMap[t.trim()]) questionTags.push(tagMap[t.trim()]);
          });
        }

        const questionData = buildQuestionData(row, categoryId, questionTags, admin._id);
        await Question.create(questionData);
        imported++;
        const label = row.questionText || row.emojis || row.emojiHint || '(no text)';
        console.log(`  OK [${row.questionType}]: ${label}`);
      } catch (err) {
        console.log(`  ERROR: ${err.message}`);
        skipped++;
      }
    }

    console.log('\nUpdating category stats...');
    for (const cat of categories) {
      await cat.updateStats();
    }

    console.log(`\n========================================`);
    console.log(`Import complete!`);
    console.log(`  Imported: ${imported}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node src/scripts/import-questions.js <csv-file>');
  console.log('Example: node src/scripts/import-questions.js templates/questions-all.csv');
  process.exit(1);
}

importQuestions(path.resolve(filePath));
