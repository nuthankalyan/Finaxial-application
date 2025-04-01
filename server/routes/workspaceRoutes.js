const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  saveInsights,
  getInsights
} = require('../controllers/workspaceController');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .post(createWorkspace)
  .get(getWorkspaces);

router.route('/:id')
  .get(getWorkspace)
  .put(updateWorkspace)
  .patch(updateWorkspace)
  .delete(deleteWorkspace);

router.route('/:id/insights')
  .post(saveInsights)
  .get(getInsights);

module.exports = router; 