const mongoose = require('mongoose');

const KnowledgeItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    text: true // Enable text indexing for keyword search
  },
  embedding: {
    type: [Number], // Vector embedding array
    index: true,    // Helps with query performance
  },
  metadata: {
    source: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: [
        'accounting-standards', 
        'regulatory-compliance',
        'data-transformation',
        'anomaly-detection',
        'tax-optimization',
        'financial-reporting',
        'email-reports',
        'ai-analysis',
        'other'
      ],
      default: 'other'
    },
    relevance: {
      type: [String],
      default: []
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for content field to enable text search
KnowledgeItemSchema.index({ content: 'text' });

// Add a pre-save hook to update the updatedAt field
KnowledgeItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('KnowledgeItem', KnowledgeItemSchema);
