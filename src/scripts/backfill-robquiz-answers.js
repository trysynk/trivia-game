require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const config = require('../config/env');
const { Question, Category } = require('../models');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

function extractAnswer(apiQ) {
  if (!apiQ) return { text: '', alternatives: [] };

  const answers = Array.isArray(apiQ.answers) ? apiQ.answers : [];
  const arOptions = Array.isArray(apiQ.ar_options) ? apiQ.ar_options : null;

  // Pattern 1: ar_options exists -> answers are indices
  if (arOptions && arOptions.length > 0) {
    const idx = parseInt(answers[0]);
    if (!isNaN(idx) && arOptions[idx] !== undefined) {
      return { text: String(arOptions[idx]), alternatives: [] };
    }
    return { text: '', alternatives: [] };
  }

  // Pattern 2: no ar_options -> answers contains the actual text(s) + synonyms
  if (answers.length > 0) {
    return {
      text: String(answers[0]),
      alternatives: answers.slice(1).map(String)
    };
  }

  return { text: '', alternatives: [] };
}

const CATEGORIES = [
  { name: 'مسلسل باب الحارة', slug: 'اسئلة-مسلسل-باب-الحارة-مع-خيارات' },
  { name: 'أعلام مرسومه', slug: 'أعلام-مرسومة-بشكل-سيء-1' },
  { name: 'أسئله عن سوريا', slug: '15-سؤال-عن-سوريا' },
  { name: 'اسئلة معلومات عامة', slug: 'اسئلة-معلومات-عامة-مع-الأجوبة-50-سؤال' },
  { name: 'اسم العضو في الجسم', slug: 'احزر-اسم-العضو-في-الجسم' },
  { name: 'اللون المختلف', slug: 'تحتاج-الى-نظارات-ان-لم-تستطع-معرفة-اللون-المختلف' },
  { name: 'احزر جنسية هؤلاء الأشخاص من خلال وجوههم', slug: 'احزر-جنسية-هؤلاء-الأشخاص-من-خلال-وجوههم' }
];

async function backfill() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB\n');

  let updated = 0, activated = 0, skipped = 0;

  for (const cat of CATEGORIES) {
    const category = await Category.findOne({ name: cat.name });
    if (!category) { console.log(`SKIP "${cat.name}" - not found`); continue; }

    const apiUrl = `https://robquiz.com/api/survey/${encodeURIComponent(cat.slug)}?lang=ar`;
    console.log(`\n=== ${cat.name} ===`);

    let data;
    try { data = await fetchJSON(apiUrl); }
    catch (e) { console.log(`  ERROR: ${e.message}`); continue; }

    const apiQuestions = (data.survey_details || []).map(d => d.question).filter(Boolean);
    const dbQuestions = await Question.find({ category: category._id }).sort({ createdAt: 1 });
    console.log(`  API: ${apiQuestions.length} | DB: ${dbQuestions.length}`);

    if (apiQuestions.length !== dbQuestions.length) {
      console.log(`  WARN: counts differ — using positional matching anyway`);
    }

    // Match by INDEX (position), since questions can have identical text
    for (let i = 0; i < dbQuestions.length; i++) {
      const dbQ = dbQuestions[i];
      const apiQ = apiQuestions[i];

      const { text: answerText, alternatives } = extractAnswer(apiQ);

      if (!answerText) {
        console.log(`  SKIP Q${i+1}: no answer extractable`);
        skipped++;
        continue;
      }

      dbQ.answerContent.text = answerText;
      if (alternatives.length > 0) {
        dbQ.answerContent.alternativeAnswers = alternatives;
      }
      dbQ.status = 'active';
      dbQ.isActive = true;
      await dbQ.save();
      updated++;
      activated++;
      const altStr = alternatives.length > 0 ? ` [+${alternatives.length} alt]` : '';
      console.log(`  OK Q${i+1}: ${answerText.substring(0, 50)}${altStr}`);
    }

    await category.updateStats();
  }

  console.log(`\n========================================`);
  console.log(`Updated: ${updated} | Activated: ${activated} | Skipped: ${skipped}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

backfill().catch(e => { console.error(e); process.exit(1); });
