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
  saveReport,
  uploadDataset,
  getDatasets,
  getDataset,
  deleteDatasetVersion,
  getDatasetVersions
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

// Dataset routes
router.route('/:id/datasets')
  .post(uploadDataset)
  .get(getDatasets);

router.route('/:id/dataset-versions')
  .get(getDatasetVersions);

router.route('/:id/datasets/:datasetId')
  .get(getDataset);

router.route('/:id/datasets/:datasetId/versions/:versionId')
  .delete(deleteDatasetVersion);

module.exports = router;