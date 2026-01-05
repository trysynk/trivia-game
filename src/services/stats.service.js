const { Game, Question, Category, Session, Admin, QuestionPack, Tag, ActivityLog } = require('../models');

const getDashboardStats = async () => {
  const [
    totalGames,
    totalQuestions,
    totalCategories,
    activeCategories,
    totalSessions,
    recentGames,
    questionsByDifficulty,
    questionsByStatus,
    gamesByType,
    questionsByType
  ] = await Promise.all([
    Game.countDocuments(),
    Question.countDocuments(),
    Category.countDocuments(),
    Category.countDocuments({ isActive: true }),
    Session.countDocuments(),
    Game.find()
      .populate('categories', 'name nameEn icon color')
      .sort({ createdAt: -1 })
      .limit(5),
    Question.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]),
    Question.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Game.aggregate([
      { $group: { _id: '$gameType', count: { $sum: 1 } } }
    ]),
    Question.aggregate([
      { $group: { _id: '$questionType', count: { $sum: 1 } } }
    ])
  ]);

  // Format aggregation results
  const formatAggregation = (data, keys) => {
    const result = {};
    keys.forEach(key => { result[key] = 0; });
    data.forEach(item => {
      if (item._id) result[item._id] = item.count;
    });
    return result;
  };

  return {
    totals: {
      games: totalGames,
      questions: totalQuestions,
      categories: totalCategories,
      activeCategories,
      sessions: totalSessions
    },
    questions: {
      byDifficulty: formatAggregation(questionsByDifficulty, ['easy', 'medium', 'hard']),
      byStatus: formatAggregation(questionsByStatus, ['draft', 'active', 'needs_review', 'archived']),
      byType: questionsByType.reduce((acc, item) => {
        if (item._id) acc[item._id] = item.count;
        return acc;
      }, {})
    },
    games: {
      byType: formatAggregation(gamesByType, ['main', 'everyone', 'buzzer'])
    },
    recentGames
  };
};

const getQuestionStats = async (filters = {}) => {
  const matchStage = {};

  if (filters.category) {
    matchStage.category = filters.category;
  }

  if (filters.dateFrom || filters.dateTo) {
    matchStage.createdAt = {};
    if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
  }

  const stats = await Question.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        avgTimesPlayed: { $avg: '$stats.timesPlayed' },
        avgSuccessRate: { $avg: '$stats.successRate' },
        totalTimesPlayed: { $sum: '$stats.timesPlayed' },
        byDifficulty: {
          $push: {
            difficulty: '$difficulty',
            timesPlayed: '$stats.timesPlayed',
            successRate: '$stats.successRate'
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalQuestions: 0,
    avgTimesPlayed: 0,
    avgSuccessRate: 0,
    totalTimesPlayed: 0
  };
};

const getCategoryStats = async () => {
  const categories = await Category.find()
    .select('name nameEn icon color stats isActive')
    .sort({ 'stats.totalQuestions': -1 });

  const totalQuestions = await Question.countDocuments({ status: 'active' });

  return categories.map(cat => ({
    _id: cat._id,
    name: cat.name,
    nameEn: cat.nameEn,
    icon: cat.icon,
    color: cat.color,
    isActive: cat.isActive,
    stats: cat.stats,
    percentage: totalQuestions > 0
      ? Math.round((cat.stats.totalQuestions / totalQuestions) * 100)
      : 0
  }));
};

const getGameStats = async (options = {}) => {
  const { dateFrom, dateTo, gameType } = options;

  const matchStage = {};

  if (gameType) {
    matchStage.gameType = gameType;
  }

  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }

  const [basicStats, timeStats, popularCategories] = await Promise.all([
    Game.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$gameType',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgQuestionsPlayed: { $avg: { $size: '$questionsPlayed' } }
        }
      }
    ]),
    Game.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]),
    Game.aggregate([
      { $match: matchStage },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          timesPlayed: { $sum: 1 }
        }
      },
      { $sort: { timesPlayed: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' }
    ])
  ]);

  return {
    byGameType: basicStats,
    timeline: timeStats,
    popularCategories: popularCategories.map(item => ({
      _id: item._id,
      name: item.category.name,
      nameEn: item.category.nameEn,
      timesPlayed: item.timesPlayed
    }))
  };
};

const getActivityStats = async (days = 7) => {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const [activityByDay, activityByAction, recentActivity] = await Promise.all([
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: dateFrom } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: dateFrom } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('admin', 'username displayName')
  ]);

  return {
    byDay: activityByDay,
    byAction: activityByAction,
    recent: recentActivity
  };
};

const getSystemHealth = async () => {
  const [
    totalAdmins,
    activeAdmins,
    totalTags,
    totalPacks,
    activePacks,
    pendingQuestions
  ] = await Promise.all([
    Admin.countDocuments(),
    Admin.countDocuments({ isActive: true }),
    Tag.countDocuments(),
    QuestionPack.countDocuments(),
    QuestionPack.countDocuments({ isActive: true }),
    Question.countDocuments({ status: 'needs_review' })
  ]);

  return {
    admins: { total: totalAdmins, active: activeAdmins },
    tags: totalTags,
    questionPacks: { total: totalPacks, active: activePacks },
    pendingQuestions
  };
};

module.exports = {
  getDashboardStats,
  getQuestionStats,
  getCategoryStats,
  getGameStats,
  getActivityStats,
  getSystemHealth
};
