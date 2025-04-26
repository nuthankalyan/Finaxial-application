const { storeDocument, searchSimilarDocuments } = require('../services/vectorSearchService');

/**
 * @desc    Store content with vector embedding
 * @route   POST /api/vector/store
 * @access  Private
 */
exports.storeVectorDocument = async (req, res) => {
  try {
    const { content, metadata, workspaceId, documentType } = req.body;
    
    if (!content || !workspaceId) {
      return res.status(400).json({ success: false, error: 'Content and workspaceId are required' });
    }
    
    const document = await storeDocument(content, metadata || {}, workspaceId, documentType || 'other');
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error in storeVectorDocument controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Search for similar documents using vector similarity
 * @route   GET /api/vector/search
 * @access  Private
 */
exports.searchVectorDocuments = async (req, res) => {
  try {
    const { query, workspaceId, limit = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const results = await searchSimilarDocuments(
      query,
      workspaceId || null,
      parseInt(limit, 10)
    );
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in searchVectorDocuments controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Batch store multiple documents with vector embeddings
 * @route   POST /api/vector/store-batch
 * @access  Private
 */
exports.storeBatchVectorDocuments = async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Documents array is required and must not be empty' 
      });
    }
    
    const results = [];
    
    for (const doc of documents) {
      const { content, metadata, workspaceId, documentType } = doc;
      
      if (!content || !workspaceId) {
        continue; // Skip invalid documents
      }
      
      const storedDoc = await storeDocument(
        content,
        metadata || {},
        workspaceId,
        documentType || 'other'
      );
      
      results.push(storedDoc);
    }
    
    res.status(201).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in storeBatchVectorDocuments controller:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 