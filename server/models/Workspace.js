const mongoose = require('mongoose');

// Change metadata schema for dataset versions
const ChangeMetadataSchema = new mongoose.Schema({
  addedRows: { type: Number, default: 0 },
  removedRows: { type: Number, default: 0 },
  modifiedRows: { type: Number, default: 0 },
  addedColumns: [String],
  removedColumns: [String],
  modifiedColumns: [String],
  changeDescription: String
});

// Dataset metadata schema
const DatasetMetadataSchema = new mongoose.Schema({
  columnCount: { type: Number, required: true },
  rowCount: { type: Number, required: true },
  headers: [String],
  sheets: [String],
  dataTypes: mongoose.Schema.Types.Mixed
});

// Dataset version schema
const DatasetVersionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  version: { type: Number, required: true },
  fileName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['csv', 'excel'], required: true },
  metadata: { type: DatasetMetadataSchema, required: true },
  changeMetadata: ChangeMetadataSchema,
  parentVersionId: String
});

// Dataset schema
const DatasetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  currentVersion: { type: Number, default: 1 },
  versions: [DatasetVersionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String
});

// Report schema to store report data
const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileContents: mongoose.Schema.Types.Mixed,
  insights: mongoose.Schema.Types.Mixed,
  financialMetrics: mongoose.Schema.Types.Mixed,
  cashFlow: mongoose.Schema.Types.Mixed,
  profitLoss: mongoose.Schema.Types.Mixed,
  balanceSheet: mongoose.Schema.Types.Mixed,
  trends: mongoose.Schema.Types.Mixed
});

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
  insightCards: {
    type: mongoose.Schema.Types.Mixed  // Store the numerical insight cards as Mixed type
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
  reports: [ReportSchema],  // Add reports field to store report data
  datasets: [DatasetSchema], // Add datasets field to store dataset versions
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