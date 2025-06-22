const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  saveInsights,
  getInsights,
  logReportGeneration,
  getReport,
  saveReport
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

router.route('/:id/report/:reportId')
  .get(getReport)
  .post(saveReport);

router.route('/:id/report')
  .post(logReportGeneration);

module.exports = router;