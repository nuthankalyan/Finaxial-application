const ragService = require('../services/ragService');
const KnowledgeItem = require('../models/KnowledgeItem');

/**
 * Add a new knowledge item to the knowledge base
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addKnowledgeItem = async (req, res) => {
  try {
    const { id, content, metadata } = req.body;
    
    if (!id || !content || !metadata) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, content, and metadata are required' 
      });
    }
    
    // Check if knowledge item with same ID already exists
    const existingItem = await KnowledgeItem.findOne({ id });
    if (existingItem) {
      return res.status(400).json({ 
        success: false, 
        error: `Knowledge item with id "${id}" already exists` 
      });
    }
    
    const knowledgeItem = await ragService.addKnowledgeItem({ id, content, metadata });
    
    res.status(201).json({
      success: true,
      data: knowledgeItem
    });
  } catch (error) {
    console.error('Error adding knowledge item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add multiple knowledge items in batch
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addKnowledgeItems = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Items must be a non-empty array' 
      });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.id || !item.content || !item.metadata) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have id, content, and metadata'
        });
      }
    }
    
    // Check for duplicate IDs
    const ids = items.map(item => item.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate IDs found in the items array'
      });
    }
    
    // Check for existing IDs in the database
    const existingItems = await KnowledgeItem.find({ id: { $in: ids } });
    if (existingItems.length > 0) {
      const existingIds = existingItems.map(item => item.id);
      return res.status(400).json({
        success: false,
        error: `The following IDs already exist: ${existingIds.join(', ')}`
      });
    }
    
    const savedItems = await ragService.addKnowledgeItems(items);
    
    res.status(201).json({
      success: true,
      count: savedItems.length,
      data: savedItems
    });
  } catch (error) {
    console.error('Error adding knowledge items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all knowledge items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getKnowledgeItems = async (req, res) => {
  try {
    const { category, source, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (category) query['metadata.category'] = category;
    if (source) query['metadata.source'] = source;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await KnowledgeItem.find(query)
      .select('-embedding') // Exclude embedding vector to reduce response size
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });
    
    const total = await KnowledgeItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: items.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: items
    });
  } catch (error) {
    console.error('Error getting knowledge items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a knowledge item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteKnowledgeItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await KnowledgeItem.findOneAndDelete({ id });
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        error: `Knowledge item with id "${id}" not found`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Knowledge item "${id}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search for knowledge items by query
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchKnowledge = async (req, res) => {
  try {
    const { query, limit = 3 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    const results = await ragService.findSimilarKnowledgeItems(query, parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Analyze CSV data with RAG
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.analyzeWithRAG = async (req, res) => {
  try {
    console.log('Received RAG analysis request');
    
    // Log the body keys to help debug
    console.log('Request body keys:', Object.keys(req.body));
    
    const { csvContent, query } = req.body;
    
    if (!csvContent) {
      console.error('Missing csvContent in request body');
      return res.status(400).json({
        success: false,
        error: 'CSV content is required'
      });
    }
    
    console.log('CSV content length:', typeof csvContent === 'string' ? csvContent.length : 'not a string');
    console.log('Query provided:', query ? 'yes' : 'no');
    
    // Make sure csvContent is a string
    const contentToProcess = typeof csvContent === 'string' 
      ? csvContent 
      : JSON.stringify(csvContent);
    
    console.log('Calling ragService.analyzeWithRAG...');
    const analysis = await ragService.analyzeWithRAG(contentToProcess, query);
    console.log('RAG analysis complete');
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing with RAG:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Check compliance with RAG
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkComplianceWithRAG = async (req, res) => {
  try {
    const { csvContent, standards = ['GAAP', 'IFRS', 'SOX'] } = req.body;
    
    if (!csvContent) {
      return res.status(400).json({
        success: false,
        error: 'CSV content is required'
      });
    }
    
    // Validate standards
    const validStandards = ['GAAP', 'IFRS', 'SOX'];
    for (const standard of standards) {
      if (!validStandards.includes(standard)) {
        return res.status(400).json({
          success: false,
          error: `Invalid standard: ${standard}. Valid standards are: ${validStandards.join(', ')}`
        });
      }
    }
    
    const complianceReport = await ragService.checkComplianceWithRAG(csvContent, standards);
    
    res.status(200).json({
      success: true,
      data: complianceReport
    });
  } catch (error) {
    console.error('Error checking compliance with RAG:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
