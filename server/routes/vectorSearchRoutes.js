const express = require('express');
const router = express.Router();
const { 
  storeVectorDocument, 
  searchVectorDocuments, 
  storeBatchVectorDocuments 
} = require('../controllers/vectorSearchController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Store a document with vector embedding
router.post('/store', storeVectorDocument);

// Search for similar documents
router.get('/search', searchVectorDocuments);

// Batch store multiple documents
router.post('/store-batch', storeBatchVectorDocuments);

module.exports = router; 