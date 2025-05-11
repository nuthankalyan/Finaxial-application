const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  activityType: {
    type: String,
    enum: ['workspace_created', 'report_generated', 'insight_generated', 'csv_uploaded'],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // For storing activity-specific data
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
UserActivitySchema.index({ user: 1, activityType: 1 });
UserActivitySchema.index({ workspace: 1 });
UserActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema); 