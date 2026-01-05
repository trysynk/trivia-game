const { ActivityLog } = require('../models');

const logActivity = async (options) => {
  const {
    admin,
    adminUsername,
    action,
    targetType,
    targetId,
    targetName,
    details,
    changes,
    ipAddress,
    userAgent
  } = options;

  try {
    const log = await ActivityLog.create({
      admin,
      adminUsername,
      action,
      targetType,
      targetId,
      targetName,
      details,
      changes,
      ipAddress,
      userAgent
    });

    return log;
  } catch (error) {
    // Don't throw - activity logging should not break main operations
    console.error('Failed to log activity:', error.message);
    return null;
  }
};

const logQuestionCreate = async (admin, question, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'question_create',
    targetType: 'question',
    targetId: question._id,
    targetName: question.shortId,
    details: {
      questionType: question.questionType,
      difficulty: question.difficulty,
      category: question.category
    },
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logQuestionUpdate = async (admin, question, changes, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'question_update',
    targetType: 'question',
    targetId: question._id,
    targetName: question.shortId,
    changes,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logQuestionDelete = async (admin, question, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'question_delete',
    targetType: 'question',
    targetId: question._id,
    targetName: question.shortId,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logCategoryCreate = async (admin, category, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'category_create',
    targetType: 'category',
    targetId: category._id,
    targetName: category.name,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logCategoryUpdate = async (admin, category, changes, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'category_update',
    targetType: 'category',
    targetId: category._id,
    targetName: category.name,
    changes,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logCategoryDelete = async (admin, category, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'category_delete',
    targetType: 'category',
    targetId: category._id,
    targetName: category.name,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logLogin = async (admin, req, success = true) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: success ? 'login' : 'login_failed',
    targetType: 'admin',
    targetId: admin._id,
    targetName: admin.username,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logLogout = async (admin, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'logout',
    targetType: 'admin',
    targetId: admin._id,
    targetName: admin.username,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logSettingsUpdate = async (admin, changes, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'settings_update',
    targetType: 'settings',
    targetId: null,
    targetName: 'System Settings',
    changes,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logMediaUpload = async (admin, media, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'media_upload',
    targetType: 'media',
    targetId: media._id,
    targetName: media.originalName,
    details: {
      type: media.type,
      size: media.size,
      mimeType: media.mimeType
    },
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logMediaDelete = async (admin, media, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'media_delete',
    targetType: 'media',
    targetId: media._id,
    targetName: media.originalName,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logImport = async (admin, type, details, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'import',
    targetType: type,
    targetName: `${type} import`,
    details,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logExport = async (admin, type, details, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'export',
    targetType: type,
    targetName: `${type} export`,
    details,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const logBulkAction = async (admin, action, targetType, count, req) => {
  return logActivity({
    admin: admin._id,
    adminUsername: admin.username,
    action: 'bulk_action',
    targetType,
    targetName: `Bulk ${action}`,
    details: {
      action,
      count
    },
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent')
  });
};

const getActivityLogs = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    admin,
    action,
    targetType,
    dateFrom,
    dateTo
  } = options;

  const query = {};

  if (admin) query.admin = admin;
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('admin', 'username displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(query)
  ]);

  return {
    logs,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

module.exports = {
  logActivity,
  logQuestionCreate,
  logQuestionUpdate,
  logQuestionDelete,
  logCategoryCreate,
  logCategoryUpdate,
  logCategoryDelete,
  logLogin,
  logLogout,
  logSettingsUpdate,
  logMediaUpload,
  logMediaDelete,
  logImport,
  logExport,
  logBulkAction,
  getActivityLogs
};
