require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
const cloudinary = require('../config/cloudinary');
const config = require('../config/env');
const { Category, Question, Admin } = require('../models');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

async function uploadImage(imagePathOrUrl) {
  const result = await cloudinary.uploader.upload(imagePathOrUrl, {
    folder: 'categories',
    resource_type: 'image'
  });
  return result.secure_url;
}

function normalizeUrl(input) {
  // Accept page URL (/quiz/, /puzzle/) or API URL (/api/survey/)
  if (input.includes('/api/survey/')) return input;
  const slug = input.split(/\/(quiz|puzzle)\//)[2]?.split('?')[0];
  if (!slug) throw new Error('Cannot extract slug from URL');
  return `https://robquiz.com/api/survey/${slug}?lang=ar`;
}

function detectMediaType(url) {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'jfif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  return 'image'; // fallback for unknown types
}

async function uploadMedia(url, mediaType) {
  const resourceType = mediaType === 'image' ? 'image' : 'video'; // Cloudinary uses 'video' for both audio and video
  const result = await cloudinary.uploader.upload(url, {
    folder: 'questions',
    resource_type: resourceType
  });
  return result.secure_url;
}

// Handles both robquiz API patterns:
// Pattern A: ar_options exists -> answers contains indices like ["3"]
// Pattern B: no ar_options    -> answers contains text(s) like ["البرازيل","Brazil"]
function extractAnswer(apiQ) {
  if (!apiQ) return { text: '', alternatives: [] };
  const answers = Array.isArray(apiQ.answers) ? apiQ.answers : [];
  const arOptions = Array.isArray(apiQ.ar_options) ? apiQ.ar_options : null;

  if (arOptions && arOptions.length > 0) {
    const idx = parseInt(answers[0]);
    if (!isNaN(idx) && arOptions[idx] !== undefined) {
      return { text: String(arOptions[idx]), alternatives: [] };
    }
    return { text: '', alternatives: [] };
  }

  if (answers.length > 0) {
    // Prefer Arabic answer (heuristic: pick first one that contains Arabic chars)
    const arabicRe = /[\u0600-\u06FF]/;
    const arabicAns = answers.find(a => arabicRe.test(String(a)));
    const primary = arabicAns || answers[0];
    const alternatives = answers.filter(a => a !== primary).map(String);
    return { text: String(primary), alternatives };
  }

  return { text: '', alternatives: [] };
}

async function importFromRobquiz({ name, nameEn, description, icon, color, imagePath, url }) {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const admin = await Admin.findOne({ role: 'super_admin' });
  if (!admin) throw new Error('No admin found. Run seed.js first.');

  const apiUrl = normalizeUrl(url);
  console.log(`Fetching from: ${apiUrl}`);
  const data = await fetchJSON(apiUrl);

  let category = await Category.findOne({ name });
  if (category) {
    console.log(`Category "${name}" already exists, using existing one`);
  } else {
    let imageSource = imagePath;
    if (!imageSource && data.survey?.[0]?.image) {
      imageSource = `https://robquiz.com/storage/${data.survey[0].image}`;
      console.log(`Auto-detected image from API: ${imageSource}`);
    }
    if (!imageSource) throw new Error('No image provided and none found in API response');

    console.log(`Uploading image: ${imageSource}`);
    const coverImage = await uploadImage(imageSource);
    console.log(`Image uploaded: ${coverImage}`);

    category = await Category.create({
      name,
      nameEn: nameEn || '',
      description: data.survey?.[0]?.meta_description || description || '',
      icon: icon || 'category',
      iconType: 'icon',
      color: color || '#8B5CF6',
      coverImage,
      createdBy: admin._id
    });
    console.log(`Category created: ${category._id}`);
  }
  const surveyDetails = data.survey?.[0]?.survey_details || data.survey_details || [];

  if (!surveyDetails.length) {
    console.log('No questions found in response');
    console.log('Response keys:', Object.keys(data));
    if (data.survey?.[0]) console.log('Survey keys:', Object.keys(data.survey[0]));
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${surveyDetails.length} questions, importing without answers...`);

  const difficultyCycle = ['easy', 'medium', 'hard'];
  const pointsMap = { easy: 200, medium: 400, hard: 600 };

  let imported = 0;
  const importedRows = [];
  for (let idx = 0; idx < surveyDetails.length; idx++) {
    const q = surveyDetails[idx];
    try {
      const inner = q.question || q;
      const questionText = inner.content || inner.text;
      if (!questionText || typeof questionText !== 'string') {
        console.log('  SKIP: no question text');
        continue;
      }

      const difficulty = difficultyCycle[idx % 3];
      const points = pointsMap[difficulty];

      const questionContent = { text: questionText };
      let questionType = 'text';

      if (inner.image) {
        const mediaUrl = `https://robquiz.com/storage/${inner.image}`;
        const mediaType = detectMediaType(mediaUrl);
        try {
          const uploaded = await uploadMedia(mediaUrl, mediaType);
          questionContent.mediaUrl = uploaded;
          questionContent.mediaType = mediaType;
          questionType = mediaType; // 'image', 'audio', or 'video'
          console.log(`    ${mediaType} uploaded`);
        } catch (e) {
          console.log(`    ${mediaType} upload failed: ${e.message}`);
        }
      }

      if (inner.second_image) {
        const mediaUrl2 = `https://robquiz.com/storage/${inner.second_image}`;
        const mediaType2 = detectMediaType(mediaUrl2);
        try {
          const uploaded = await uploadMedia(mediaUrl2, mediaType2);
          questionContent.mediaUrl2 = uploaded;
          if (questionType === 'image' && mediaType2 === 'image') {
            questionType = 'two_images';
          }
          console.log(`    second ${mediaType2} uploaded`);
        } catch (e) {
          console.log(`    second ${mediaType2} upload failed: ${e.message}`);
        }
      }

      // Extract correct answer (handle both robquiz patterns)
      const { text: answerText, alternatives } = extractAnswer(inner);

      await Question.create({
        category: category._id,
        difficulty,
        points,
        questionType,
        answerType: 'text',
        status: 'active',
        isActive: true,
        timing: { defaultTime: 30, warningTime: 10 },
        questionContent,
        answerContent: { text: answerText, alternativeAnswers: alternatives },
        gamesAvailable: {
          mainGame: {
            enabled: true,
            helpers: { callFriend: true, thePit: true, doubleAnswer: true, takeRest: true }
          },
          everyoneAnswers: { enabled: false },
          buzzerMode: { enabled: false }
        },
        createdBy: admin._id
      });
      imported++;
      importedRows.push({ idx: imported, q: questionText, a: answerText, alt: alternatives.length });
      console.log(`  OK [${questionType}/${difficulty}]: ${questionText.substring(0, 60)}...`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }

  await category.updateStats();

  // Q&A verification table
  console.log(`\n=== Q&A TABLE: ${category.name} ===`);
  const missing = importedRows.filter(r => !r.a);
  console.log('| #  | Question                                                     | Answer                            | Alt |');
  console.log('|----|--------------------------------------------------------------|-----------------------------------|-----|');
  for (const r of importedRows) {
    const q = (r.q || '').substring(0, 60).padEnd(60, ' ');
    const a = (r.a || '⚠️ MISSING').substring(0, 33).padEnd(33, ' ');
    const alt = String(r.alt).padStart(3, ' ');
    console.log(`| ${String(r.idx).padStart(2)} | ${q} | ${a} | ${alt} |`);
  }

  console.log(`\n========================================`);
  console.log(`Imported ${imported}/${surveyDetails.length} questions  |  Missing answers: ${missing.length}`);
  console.log(`Category: ${category.name} (${category._id})`);
  console.log(`Status: ACTIVE`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node import-from-robquiz.js "<categoryName>" "<robquizUrl>" [imagePathOrUrl] [icon] [color]');
  console.log('Examples:');
  console.log('  Auto image from API:');
  console.log('    node src/scripts/import-from-robquiz.js "اختبر حدسك" "https://www.robquiz.com/quiz/اختبر-حدسك"');
  console.log('  Custom local image:');
  console.log('    node src/scripts/import-from-robquiz.js "مسلسل باب الحارة" "https://..." "src/images/babalhara.jpg"');
  console.log('  Custom URL image:');
  console.log('    node src/scripts/import-from-robquiz.js "اختبر حدسك" "https://..." "https://example.com/img.jpg"');
  process.exit(1);
}

const [name, url, imagePath, icon, color] = args;

const resolvedImage = imagePath
  ? (imagePath.startsWith('http') ? imagePath : path.resolve(imagePath))
  : null;

importFromRobquiz({
  name,
  imagePath: resolvedImage,
  url,
  icon: icon || 'movie',
  color: color || '#8B5CF6'
}).catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
