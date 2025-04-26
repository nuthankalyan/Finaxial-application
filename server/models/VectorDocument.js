const mongoose = require('mongoose');

const VectorDocumentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    text: true // Enable text indexing for keyword search
  },
  embedding: {
    type: [Number], // Vector embedding array
    required: true,
    index: true, // Helps with query performance
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Flexible metadata field
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  documentType: {
    type: String,
    enum: ['insight', 'recommendation', 'summary', 'chat', 'other'],
    default: 'other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VectorDocument', VectorDocumentSchema); 