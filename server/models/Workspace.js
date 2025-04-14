const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  insights: {
    type: String,
    required: true
  },
  recommendations: {
    type: String,
    required: true
  },
  charts: {
    type: mongoose.Schema.Types.Mixed  // This allows any JSON structure
  },
  assistantChat: {
    type: mongoose.Schema.Types.Mixed  // Store the chat history as Mixed type
  },
  rawResponse: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WorkspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Workspace name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  financialInsights: [InsightSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
WorkspaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Workspace', WorkspaceSchema); 