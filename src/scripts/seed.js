require('dotenv').config();
const mongoose = require('mongoose');
const { Admin, Category, Question, Tag, Settings, QuestionPack } = require('../models');
const config = require('../config/env');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Question.deleteMany({});
    await Category.deleteMany({});
    await Tag.deleteMany({});
    await QuestionPack.deleteMany({});

    // Create/Update Admin
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    let admin;
    if (!existingAdmin) {
      admin = await Admin.create({
        username: 'admin',
        email: 'admin@trivia.com',
        password: 'admin123',
        displayName: 'المدير',
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
      console.log('Admin user created (username: admin, password: admin123)');
    } else {
      admin = existingAdmin;
      console.log('Admin user already exists');
    }

    // Create Settings
    await Settings.findOneAndUpdate(
      {},
      {
        general: {
          siteName: 'لعبة التريفيا العربية',
          siteNameEn: 'Arabic Trivia Game',
          defaultLanguage: 'ar',
          maintenanceMode: false
        },
        game: {
          defaultQuestionTime: 30,
          defaultBuzzerTime: 10,
          defaultQuestionsCount: 10,
          maxPlayersPerSession: 50,
          sessionTimeout: 4,
          pointsEasy: 200,
          pointsMedium: 400,
          pointsHard: 600,
          speedBonusEnabled: true,
          speedBonusTiers: [
            { maxTime: 3, multiplier: 1.5 },
            { maxTime: 5, multiplier: 1.3 },
            { maxTime: 10, multiplier: 1.1 }
          ]
        },
        scoring: {
          wrongAnswerPenalty: 0,
          streakBonus: true,
          streakMultipliers: [
            { streak: 3, multiplier: 1.1 },
            { streak: 5, multiplier: 1.25 },
            { streak: 10, multiplier: 1.5 }
          ]
        }
      },
      { upsert: true, new: true }
    );
    console.log('Settings created/updated');

    // Create Tags
    const tags = await Tag.insertMany([
      { name: 'شائع', nameEn: 'Popular', color: '#EF4444', createdBy: admin._id },
      { name: 'جديد', nameEn: 'New', color: '#10B981', createdBy: admin._id },
      { name: 'صعب', nameEn: 'Difficult', color: '#F59E0B', createdBy: admin._id },
      { name: 'للمبتدئين', nameEn: 'Beginner', color: '#3B82F6', createdBy: admin._id },
      { name: 'ثقافة عامة', nameEn: 'General Knowledge', color: '#8B5CF6', createdBy: admin._id },
      { name: 'سعودي', nameEn: 'Saudi', color: '#059669', createdBy: admin._id },
      { name: 'عربي', nameEn: 'Arabic', color: '#DC2626', createdBy: admin._id },
      { name: 'عالمي', nameEn: 'International', color: '#7C3AED', createdBy: admin._id }
    ]);
    console.log(`Created ${tags.length} tags`);

    // Create Categories
    const categories = await Category.insertMany([
      {
        name: 'الرياضة',
        nameEn: 'Sports',
        description: 'أسئلة عن كرة القدم وألعاب القوى والرياضات المختلفة',
        icon: 'sports_soccer',
        color: '#EF4444',
        order: 1,
        createdBy: admin._id
      },
      {
        name: 'التاريخ',
        nameEn: 'History',
        description: 'أسئلة عن التاريخ العربي والإسلامي والعالمي',
        icon: 'history_edu',
        color: '#F59E0B',
        order: 2,
        createdBy: admin._id
      },
      {
        name: 'الجغرافيا',
        nameEn: 'Geography',
        description: 'أسئلة عن الدول والعواصم والمعالم الجغرافية',
        icon: 'public',
        color: '#10B981',
        order: 3,
        createdBy: admin._id
      },
      {
        name: 'العلوم',
        nameEn: 'Science',
        description: 'أسئلة علمية في الفيزياء والكيمياء والأحياء',
        icon: 'science',
        color: '#3B82F6',
        order: 4,
        createdBy: admin._id
      },
      {
        name: 'الفن والثقافة',
        nameEn: 'Art & Culture',
        description: 'أسئلة عن الفنون والآداب والثقافة',
        icon: 'palette',
        color: '#8B5CF6',
        order: 5,
        createdBy: admin._id
      },
      {
        name: 'الترفيه',
        nameEn: 'Entertainment',
        description: 'أسئلة عن الأفلام والموسيقى والمشاهير',
        icon: 'movie',
        color: '#EC4899',
        order: 6,
        createdBy: admin._id
      },
      {
        name: 'الدين الإسلامي',
        nameEn: 'Islamic Studies',
        description: 'أسئلة عن القرآن الكريم والسنة النبوية',
        icon: 'mosque',
        color: '#059669',
        order: 7,
        createdBy: admin._id
      },
      {
        name: 'اللغة العربية',
        nameEn: 'Arabic Language',
        description: 'أسئلة عن النحو والصرف والبلاغة',
        icon: 'translate',
        color: '#0891B2',
        order: 8,
        createdBy: admin._id
      },
      {
        name: 'التكنولوجيا',
        nameEn: 'Technology',
        description: 'أسئلة عن الحاسوب والإنترنت والتقنية',
        icon: 'computer',
        color: '#6366F1',
        order: 9,
        createdBy: admin._id
      },
      {
        name: 'الطعام والمطبخ',
        nameEn: 'Food & Cuisine',
        description: 'أسئلة عن الأطعمة والمأكولات العربية والعالمية',
        icon: 'restaurant',
        color: '#EA580C',
        order: 10,
        createdBy: admin._id
      }
    ]);
    console.log(`Created ${categories.length} categories`);

    // Sample Questions - Sports
    const sportsQuestions = [
      {
        category: categories[0]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'كم عدد لاعبي فريق كرة القدم في الملعب؟' },
        answerType: 'text',
        answerContent: { text: '11' },
        options: [
          { text: '9', isCorrect: false },
          { text: '10', isCorrect: false },
          { text: '11', isCorrect: true },
          { text: '12', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[0]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'في أي عام فازت السعودية بكأس آسيا لأول مرة؟' },
        answerType: 'text',
        answerContent: { text: '1984' },
        options: [
          { text: '1980', isCorrect: false },
          { text: '1984', isCorrect: true },
          { text: '1988', isCorrect: false },
          { text: '1992', isCorrect: false }
        ],
        tags: [tags[5]._id],
        createdBy: admin._id
      },
      {
        category: categories[0]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'من هو أول لاعب عربي يفوز بجائزة الكرة الذهبية الأفريقية؟' },
        answerType: 'text',
        answerContent: { text: 'محمود الخطيب' },
        options: [
          { text: 'محمود الخطيب', isCorrect: true },
          { text: 'ماجد عبدالله', isCorrect: false },
          { text: 'حسن شحاتة', isCorrect: false },
          { text: 'سامي الجابر', isCorrect: false }
        ],
        tags: [tags[2]._id, tags[6]._id],
        createdBy: admin._id
      },
      {
        category: categories[0]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هو لون البطاقة التي يُطرد بها اللاعب؟' },
        answerType: 'text',
        answerContent: { text: 'الأحمر' },
        options: [
          { text: 'الأصفر', isCorrect: false },
          { text: 'الأحمر', isCorrect: true },
          { text: 'الأخضر', isCorrect: false },
          { text: 'الأزرق', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[0]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'كم مرة فاز المنتخب البرازيلي بكأس العالم؟' },
        answerType: 'text',
        answerContent: { text: '5' },
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: false },
          { text: '5', isCorrect: true },
          { text: '6', isCorrect: false }
        ],
        tags: [tags[7]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - History
    const historyQuestions = [
      {
        category: categories[1]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'من هو مؤسس الدولة السعودية الأولى؟' },
        answerType: 'text',
        answerContent: { text: 'الإمام محمد بن سعود' },
        options: [
          { text: 'الملك عبدالعزيز', isCorrect: false },
          { text: 'الإمام محمد بن سعود', isCorrect: true },
          { text: 'الملك فيصل', isCorrect: false },
          { text: 'الملك سعود', isCorrect: false }
        ],
        tags: [tags[5]._id],
        createdBy: admin._id
      },
      {
        category: categories[1]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'في أي عام تم توحيد المملكة العربية السعودية؟' },
        answerType: 'text',
        answerContent: { text: '1932' },
        options: [
          { text: '1920', isCorrect: false },
          { text: '1925', isCorrect: false },
          { text: '1932', isCorrect: true },
          { text: '1945', isCorrect: false }
        ],
        tags: [tags[5]._id, tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[1]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'من هو القائد المسلم الذي فتح الأندلس؟' },
        answerType: 'text',
        answerContent: { text: 'طارق بن زياد' },
        options: [
          { text: 'خالد بن الوليد', isCorrect: false },
          { text: 'طارق بن زياد', isCorrect: true },
          { text: 'صلاح الدين الأيوبي', isCorrect: false },
          { text: 'عمرو بن العاص', isCorrect: false }
        ],
        tags: [tags[6]._id],
        createdBy: admin._id
      },
      {
        category: categories[1]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما اسم المعركة التي انتصر فيها المسلمون على قريش في السنة الثانية للهجرة؟' },
        answerType: 'text',
        answerContent: { text: 'غزوة بدر' },
        options: [
          { text: 'غزوة أحد', isCorrect: false },
          { text: 'غزوة بدر', isCorrect: true },
          { text: 'غزوة الخندق', isCorrect: false },
          { text: 'غزوة حنين', isCorrect: false }
        ],
        tags: [tags[6]._id, tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[1]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'من هو آخر خليفة عباسي؟' },
        answerType: 'text',
        answerContent: { text: 'المستعصم بالله' },
        options: [
          { text: 'المعتصم بالله', isCorrect: false },
          { text: 'المستعصم بالله', isCorrect: true },
          { text: 'هارون الرشيد', isCorrect: false },
          { text: 'المأمون', isCorrect: false }
        ],
        tags: [tags[2]._id, tags[6]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Geography
    const geographyQuestions = [
      {
        category: categories[2]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هي عاصمة المملكة العربية السعودية؟' },
        answerType: 'text',
        answerContent: { text: 'الرياض' },
        options: [
          { text: 'جدة', isCorrect: false },
          { text: 'مكة المكرمة', isCorrect: false },
          { text: 'الرياض', isCorrect: true },
          { text: 'الدمام', isCorrect: false }
        ],
        tags: [tags[5]._id, tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[2]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هي أكبر دولة عربية من حيث المساحة؟' },
        answerType: 'text',
        answerContent: { text: 'الجزائر' },
        options: [
          { text: 'السعودية', isCorrect: false },
          { text: 'الجزائر', isCorrect: true },
          { text: 'مصر', isCorrect: false },
          { text: 'السودان', isCorrect: false }
        ],
        tags: [tags[6]._id],
        createdBy: admin._id
      },
      {
        category: categories[2]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'ما هو أطول نهر في العالم العربي؟' },
        answerType: 'text',
        answerContent: { text: 'نهر النيل' },
        options: [
          { text: 'نهر دجلة', isCorrect: false },
          { text: 'نهر الفرات', isCorrect: false },
          { text: 'نهر النيل', isCorrect: true },
          { text: 'نهر الأردن', isCorrect: false }
        ],
        tags: [tags[6]._id, tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[2]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'ما هي أعلى قمة جبلية في المملكة العربية السعودية؟' },
        answerType: 'text',
        answerContent: { text: 'جبل السودة' },
        options: [
          { text: 'جبل طويق', isCorrect: false },
          { text: 'جبل السودة', isCorrect: true },
          { text: 'جبل أحد', isCorrect: false },
          { text: 'جبل الطور', isCorrect: false }
        ],
        tags: [tags[5]._id, tags[2]._id],
        createdBy: admin._id
      },
      {
        category: categories[2]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'ما هي عاصمة اليابان؟' },
        answerType: 'text',
        answerContent: { text: 'طوكيو' },
        options: [
          { text: 'أوساكا', isCorrect: false },
          { text: 'كيوتو', isCorrect: false },
          { text: 'طوكيو', isCorrect: true },
          { text: 'هيروشيما', isCorrect: false }
        ],
        tags: [tags[7]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Science
    const scienceQuestions = [
      {
        category: categories[3]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هو الرمز الكيميائي للماء؟' },
        answerType: 'text',
        answerContent: { text: 'H2O' },
        options: [
          { text: 'H2O', isCorrect: true },
          { text: 'CO2', isCorrect: false },
          { text: 'O2', isCorrect: false },
          { text: 'NaCl', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[3]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'ما هو العضو المسؤول عن ضخ الدم في جسم الإنسان؟' },
        answerType: 'text',
        answerContent: { text: 'القلب' },
        options: [
          { text: 'الكبد', isCorrect: false },
          { text: 'القلب', isCorrect: true },
          { text: 'الرئتين', isCorrect: false },
          { text: 'الكلى', isCorrect: false }
        ],
        tags: [tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[3]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'ما هي سرعة الضوء تقريباً بالكيلومتر في الثانية؟' },
        answerType: 'text',
        answerContent: { text: '300,000' },
        options: [
          { text: '150,000', isCorrect: false },
          { text: '200,000', isCorrect: false },
          { text: '300,000', isCorrect: true },
          { text: '400,000', isCorrect: false }
        ],
        tags: [tags[2]._id],
        createdBy: admin._id
      },
      {
        category: categories[3]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هو أقرب كوكب للشمس؟' },
        answerType: 'text',
        answerContent: { text: 'عطارد' },
        options: [
          { text: 'الزهرة', isCorrect: false },
          { text: 'عطارد', isCorrect: true },
          { text: 'المريخ', isCorrect: false },
          { text: 'الأرض', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[3]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'كم عدد العظام في جسم الإنسان البالغ؟' },
        answerType: 'text',
        answerContent: { text: '206' },
        options: [
          { text: '186', isCorrect: false },
          { text: '206', isCorrect: true },
          { text: '226', isCorrect: false },
          { text: '246', isCorrect: false }
        ],
        tags: [tags[4]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Art & Culture
    const artQuestions = [
      {
        category: categories[4]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'من هو الفنان الذي رسم لوحة الموناليزا؟' },
        answerType: 'text',
        answerContent: { text: 'ليوناردو دافنشي' },
        options: [
          { text: 'بابلو بيكاسو', isCorrect: false },
          { text: 'فينسنت فان غوخ', isCorrect: false },
          { text: 'ليوناردو دافنشي', isCorrect: true },
          { text: 'مايكل أنجلو', isCorrect: false }
        ],
        tags: [tags[7]._id, tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[4]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'من هو مؤلف كتاب "ألف ليلة وليلة"؟' },
        answerType: 'text',
        answerContent: { text: 'مجهول - تراث شعبي' },
        options: [
          { text: 'الجاحظ', isCorrect: false },
          { text: 'ابن المقفع', isCorrect: false },
          { text: 'مجهول - تراث شعبي', isCorrect: true },
          { text: 'المتنبي', isCorrect: false }
        ],
        tags: [tags[6]._id],
        createdBy: admin._id
      },
      {
        category: categories[4]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'من هو الشاعر العربي الملقب بـ "أمير الشعراء"؟' },
        answerType: 'text',
        answerContent: { text: 'أحمد شوقي' },
        options: [
          { text: 'حافظ إبراهيم', isCorrect: false },
          { text: 'أحمد شوقي', isCorrect: true },
          { text: 'نزار قباني', isCorrect: false },
          { text: 'محمود درويش', isCorrect: false }
        ],
        tags: [tags[6]._id, tags[2]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Entertainment
    const entertainmentQuestions = [
      {
        category: categories[5]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هو اسم الأسد في فيلم "الأسد الملك"؟' },
        answerType: 'text',
        answerContent: { text: 'سيمبا' },
        options: [
          { text: 'موفاسا', isCorrect: false },
          { text: 'سيمبا', isCorrect: true },
          { text: 'سكار', isCorrect: false },
          { text: 'نالا', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[7]._id],
        createdBy: admin._id
      },
      {
        category: categories[5]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'من هو مغني أغنية "3 دقات"؟' },
        answerType: 'text',
        answerContent: { text: 'أبو ويسرا' },
        options: [
          { text: 'عمرو دياب', isCorrect: false },
          { text: 'تامر حسني', isCorrect: false },
          { text: 'أبو ويسرا', isCorrect: true },
          { text: 'محمد حماقي', isCorrect: false }
        ],
        tags: [tags[6]._id, tags[0]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Islamic Studies
    const islamicQuestions = [
      {
        category: categories[6]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'كم عدد سور القرآن الكريم؟' },
        answerType: 'text',
        answerContent: { text: '114' },
        options: [
          { text: '100', isCorrect: false },
          { text: '114', isCorrect: true },
          { text: '120', isCorrect: false },
          { text: '130', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[6]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هي أطول سورة في القرآن الكريم؟' },
        answerType: 'text',
        answerContent: { text: 'سورة البقرة' },
        options: [
          { text: 'سورة آل عمران', isCorrect: false },
          { text: 'سورة البقرة', isCorrect: true },
          { text: 'سورة النساء', isCorrect: false },
          { text: 'سورة المائدة', isCorrect: false }
        ],
        tags: [tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[6]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'من هو أول من أسلم من الرجال؟' },
        answerType: 'text',
        answerContent: { text: 'أبو بكر الصديق' },
        options: [
          { text: 'عمر بن الخطاب', isCorrect: false },
          { text: 'أبو بكر الصديق', isCorrect: true },
          { text: 'علي بن أبي طالب', isCorrect: false },
          { text: 'عثمان بن عفان', isCorrect: false }
        ],
        tags: [tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[6]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'كم سنة استغرق نزول القرآن الكريم كاملاً؟' },
        answerType: 'text',
        answerContent: { text: '23 سنة' },
        options: [
          { text: '20 سنة', isCorrect: false },
          { text: '23 سنة', isCorrect: true },
          { text: '25 سنة', isCorrect: false },
          { text: '30 سنة', isCorrect: false }
        ],
        tags: [tags[2]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Arabic Language
    const arabicQuestions = [
      {
        category: categories[7]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هو جمع كلمة "كتاب"؟' },
        answerType: 'text',
        answerContent: { text: 'كتب' },
        options: [
          { text: 'كتب', isCorrect: true },
          { text: 'كتابات', isCorrect: false },
          { text: 'كتابين', isCorrect: false },
          { text: 'مكتبات', isCorrect: false }
        ],
        tags: [tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[7]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'ما هو إعراب كلمة "الطالب" في جملة: "جاء الطالبُ"؟' },
        answerType: 'text',
        answerContent: { text: 'فاعل مرفوع' },
        options: [
          { text: 'مبتدأ مرفوع', isCorrect: false },
          { text: 'فاعل مرفوع', isCorrect: true },
          { text: 'خبر مرفوع', isCorrect: false },
          { text: 'مفعول به منصوب', isCorrect: false }
        ],
        tags: [tags[4]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Technology
    const techQuestions = [
      {
        category: categories[8]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هو اختصار "HTML"؟' },
        answerType: 'text',
        answerContent: { text: 'HyperText Markup Language' },
        options: [
          { text: 'HyperText Markup Language', isCorrect: true },
          { text: 'High Tech Modern Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'Hyper Transfer Markup Language', isCorrect: false }
        ],
        tags: [tags[1]._id],
        createdBy: admin._id
      },
      {
        category: categories[8]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'من هو مؤسس شركة أبل؟' },
        answerType: 'text',
        answerContent: { text: 'ستيف جوبز' },
        options: [
          { text: 'بيل غيتس', isCorrect: false },
          { text: 'ستيف جوبز', isCorrect: true },
          { text: 'مارك زوكربيرغ', isCorrect: false },
          { text: 'إيلون ماسك', isCorrect: false }
        ],
        tags: [tags[7]._id, tags[0]._id],
        createdBy: admin._id
      },
      {
        category: categories[8]._id,
        difficulty: 'hard',
        points: 600,
        questionType: 'text',
        questionContent: { text: 'في أي عام تم إطلاق أول iPhone؟' },
        answerType: 'text',
        answerContent: { text: '2007' },
        options: [
          { text: '2005', isCorrect: false },
          { text: '2006', isCorrect: false },
          { text: '2007', isCorrect: true },
          { text: '2008', isCorrect: false }
        ],
        tags: [tags[7]._id],
        createdBy: admin._id
      }
    ];

    // Sample Questions - Food
    const foodQuestions = [
      {
        category: categories[9]._id,
        difficulty: 'easy',
        points: 200,
        questionType: 'text',
        questionContent: { text: 'ما هي المادة الأساسية في صنع الخبز؟' },
        answerType: 'text',
        answerContent: { text: 'الدقيق' },
        options: [
          { text: 'الأرز', isCorrect: false },
          { text: 'الدقيق', isCorrect: true },
          { text: 'السكر', isCorrect: false },
          { text: 'الملح', isCorrect: false }
        ],
        tags: [tags[0]._id, tags[3]._id],
        createdBy: admin._id
      },
      {
        category: categories[9]._id,
        difficulty: 'medium',
        points: 400,
        questionType: 'text',
        questionContent: { text: 'ما هو الطبق الوطني السعودي؟' },
        answerType: 'text',
        answerContent: { text: 'الكبسة' },
        options: [
          { text: 'المندي', isCorrect: false },
          { text: 'الكبسة', isCorrect: true },
          { text: 'المظبي', isCorrect: false },
          { text: 'الجريش', isCorrect: false }
        ],
        tags: [tags[5]._id, tags[0]._id],
        createdBy: admin._id
      }
    ];

    // Insert all questions
    const allQuestions = [
      ...sportsQuestions,
      ...historyQuestions,
      ...geographyQuestions,
      ...scienceQuestions,
      ...artQuestions,
      ...entertainmentQuestions,
      ...islamicQuestions,
      ...arabicQuestions,
      ...techQuestions,
      ...foodQuestions
    ];

    const insertedQuestions = await Question.insertMany(allQuestions);
    console.log(`Created ${insertedQuestions.length} questions`);

    // Ensure all questions are active
    await Question.updateMany({}, { $set: { status: 'active' } });
    console.log('Set all questions to active status');

    // Update category question counts
    for (const category of categories) {
      const count = await Question.countDocuments({ category: category._id });
      await Category.findByIdAndUpdate(category._id, { questionCount: count });
    }
    console.log('Updated category question counts');

    // Update tag question counts
    for (const tag of tags) {
      const count = await Question.countDocuments({ tags: tag._id });
      await Tag.findByIdAndUpdate(tag._id, { questionCount: count });
    }
    console.log('Updated tag question counts');

    // Create Question Packs
    const questionPacks = await QuestionPack.insertMany([
      {
        name: 'باقة المبتدئين',
        nameEn: 'Beginner Pack',
        description: 'أسئلة سهلة للمبتدئين في عالم التريفيا',
        icon: 'school',
        color: '#10B981',
        filterType: 'smart',
        smartFilter: {
          categories: [categories[0]._id, categories[2]._id, categories[3]._id],
          difficulties: ['easy'],
          tags: [tags[3]._id],
          maxQuestions: 20
        },
        isPublic: true,
        createdBy: admin._id
      },
      {
        name: 'تحدي السعودية',
        nameEn: 'Saudi Challenge',
        description: 'أسئلة متنوعة عن المملكة العربية السعودية',
        icon: 'flag',
        color: '#059669',
        filterType: 'smart',
        smartFilter: {
          tags: [tags[5]._id],
          maxQuestions: 30
        },
        isPublic: true,
        createdBy: admin._id
      },
      {
        name: 'الثقافة العربية',
        nameEn: 'Arabic Culture',
        description: 'رحلة في التراث والثقافة العربية',
        icon: 'auto_stories',
        color: '#DC2626',
        filterType: 'smart',
        smartFilter: {
          categories: [categories[1]._id, categories[4]._id, categories[6]._id, categories[7]._id],
          tags: [tags[6]._id],
          maxQuestions: 40
        },
        isPublic: true,
        createdBy: admin._id
      },
      {
        name: 'تحدي الخبراء',
        nameEn: 'Expert Challenge',
        description: 'للمحترفين فقط - أسئلة صعبة ومتقدمة',
        icon: 'psychology',
        color: '#F59E0B',
        filterType: 'smart',
        smartFilter: {
          difficulties: ['hard'],
          tags: [tags[2]._id],
          maxQuestions: 25
        },
        isPublic: true,
        createdBy: admin._id
      },
      {
        name: 'عالم الرياضة',
        nameEn: 'Sports World',
        description: 'كل ما يتعلق بالرياضة والبطولات',
        icon: 'sports',
        color: '#EF4444',
        filterType: 'smart',
        smartFilter: {
          categories: [categories[0]._id],
          maxQuestions: 50
        },
        isPublic: true,
        createdBy: admin._id
      }
    ]);
    console.log(`Created ${questionPacks.length} question packs`);

    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log(`\nSummary:`);
    console.log(`- Admin: admin@trivia.com / admin123`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Tags: ${tags.length}`);
    console.log(`- Questions: ${insertedQuestions.length}`);
    console.log(`- Question Packs: ${questionPacks.length}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
