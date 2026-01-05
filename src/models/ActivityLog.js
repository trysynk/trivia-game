const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminUsername: String,
  action: {
    type: String,
    enum: [
      'login', 'logout', 'password_change',
      'category_create', 'category_update', 'category_delete',
      'question_create', 'question_update', 'question_delete', 'question_bulk_update',
      'pack_create', 'pack_update', 'pack_delete',
      'game_start', 'game_complete',
      'media_upload', 'media_delete',
      'data_import', 'data_export',
      'settings_update',
      'admin_create', 'admin_update', 'admin_delete'
    ],
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['category', 'question', 'pack', 'game', 'media', 'admin', 'settings', 'system']
  },
  targetId: mongoose.Schema.Types.ObjectId,
  targetName: String,
  details: mongoose.Schema.Types.Mixed,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
