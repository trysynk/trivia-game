require('dotenv').config();
const mongoose = require('mongoose');
const { Admin, Category, Question } = require('../models');
const config = require('../config/env');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      await Admin.create({
        username: 'admin',
        password: 'admin123'
      });
      console.log('Admin user created (username: admin, password: admin123)');
    } else {
      console.log('Admin user already exists');
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const categories = await Category.insertMany([
        { name: 'الرياضة', nameEn: 'Sports', icon: 'sports', color: '#EF4444', order: 1 },
        { name: 'التاريخ', nameEn: 'History', icon: 'history', color: '#F59E0B', order: 2 },
        { name: 'الجغرافيا', nameEn: 'Geography', icon: 'globe', color: '#10B981', order: 3 },
        { name: 'العلوم', nameEn: 'Science', icon: 'science', color: '#3B82F6', order: 4 },
        { name: 'الفن والثقافة', nameEn: 'Art & Culture', icon: 'art', color: '#8B5CF6', order: 5 },
        { name: 'الترفيه', nameEn: 'Entertainment', icon: 'entertainment', color: '#EC4899', order: 6 }
      ]);
      console.log(`Created ${categories.length} categories`);

      const sampleQuestions = [
        {
          category: categories[0]._id,
          difficulty: 'easy',
          questionType: 'text',
          questionContent: { text: 'كم عدد لاعبي فريق كرة القدم في الملعب؟' },
          answerType: 'text',
          answerContent: { text: '11' },
          options: [
            { text: '9', isCorrect: false },
            { text: '10', isCorrect: false },
            { text: '11', isCorrect: true },
            { text: '12', isCorrect: false }
          ]
        },
        {
          category: categories[0]._id,
          difficulty: 'medium',
          questionType: 'text',
          questionContent: { text: 'في أي عام فازت السعودية بكأس آسيا لأول مرة؟' },
          answerType: 'text',
          answerContent: { text: '1984' },
          options: [
            { text: '1980', isCorrect: false },
            { text: '1984', isCorrect: true },
            { text: '1988', isCorrect: false },
            { text: '1992', isCorrect: false }
          ]
        },
        {
          category: categories[1]._id,
          difficulty: 'easy',
          questionType: 'text',
          questionContent: { text: 'من هو مؤسس الدولة السعودية الأولى؟' },
          answerType: 'text',
          answerContent: { text: 'الإمام محمد بن سعود' },
          options: [
            { text: 'الملك عبدالعزيز', isCorrect: false },
            { text: 'الإمام محمد بن سعود', isCorrect: true },
            { text: 'الملك فيصل', isCorrect: false },
            { text: 'الملك سعود', isCorrect: false }
          ]
        },
        {
          category: categories[2]._id,
          difficulty: 'easy',
          questionType: 'text',
          questionContent: { text: 'ما هي عاصمة المملكة العربية السعودية؟' },
          answerType: 'text',
          answerContent: { text: 'الرياض' },
          options: [
            { text: 'جدة', isCorrect: false },
            { text: 'مكة المكرمة', isCorrect: false },
            { text: 'الرياض', isCorrect: true },
            { text: 'الدمام', isCorrect: false }
          ]
        },
        {
          category: categories[3]._id,
          difficulty: 'medium',
          questionType: 'text',
          questionContent: { text: 'ما هو الرمز الكيميائي للماء؟' },
          answerType: 'text',
          answerContent: { text: 'H2O' },
          options: [
            { text: 'H2O', isCorrect: true },
            { text: 'CO2', isCorrect: false },
            { text: 'O2', isCorrect: false },
            { text: 'NaCl', isCorrect: false }
          ]
        },
        {
          category: categories[4]._id,
          difficulty: 'hard',
          questionType: 'text',
          questionContent: { text: 'من هو الفنان الذي رسم لوحة الموناليزا؟' },
          answerType: 'text',
          answerContent: { text: 'ليوناردو دافنشي' },
          options: [
            { text: 'بابلو بيكاسو', isCorrect: false },
            { text: 'فينسنت فان غوخ', isCorrect: false },
            { text: 'ليوناردو دافنشي', isCorrect: true },
            { text: 'مايكل أنجلو', isCorrect: false }
          ]
        }
      ];

      await Question.insertMany(sampleQuestions);
      console.log(`Created ${sampleQuestions.length} sample questions`);
    } else {
      console.log('Categories already exist, skipping seed');
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
