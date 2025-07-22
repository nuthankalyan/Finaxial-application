const express = require('express');
const { 
  addKnowledgeItem,
  addKnowledgeItems,
  getKnowledgeItems,
  deleteKnowledgeItem,
  searchKnowledge,
  analyzeWithRAG,
  checkComplianceWithRAG
} = require('../controllers/ragController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Knowledge base management routes
router.route('/knowledge')
  .get(getKnowledgeItems)
  .post(addKnowledgeItem);

router.route('/knowledge/batch')
  .post(addKnowledgeItems);

router.route('/knowledge/:id')
  .delete(deleteKnowledgeItem);

router.route('/knowledge/search')
  .get(searchKnowledge);

// RAG analysis routes
router.route('/analyze')
  .post(analyzeWithRAG);

router.route('/compliance')
  .post(checkComplianceWithRAG);

module.exports = router;
