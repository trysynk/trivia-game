const { activityService } = require('../services');
const { asyncHandler } = require('../utils/helpers');

const getActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    admin,
    action,
    targetType,
    dateFrom,
    dateTo
  } = req.query;

  const result = await activityService.getActivityLogs({
    page: parseInt(page),
    limit: parseInt(limit),
    admin,
    action,
    targetType,
    dateFrom,
    dateTo
  });

  res.json(result);
});

const getMyActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const result = await activityService.getActivityLogs({
    page: parseInt(page),
    limit: parseInt(limit),
    admin: req.admin._id
  });

  res.json(result);
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const result = await activityService.getActivityLogs({
    page: 1,
    limit: parseInt(limit)
  });

  res.json({ activities: result.logs });
});

module.exports = {
  getActivityLogs,
  getMyActivity,
  getRecentActivity
};
