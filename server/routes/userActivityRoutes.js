const express = require('express');
const { protect } = require('../middleware/auth');
const {
  logActivity,
  getActivityStats,
  getRecentActivities
} = require('../controllers/userActivityController');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.post('/', logActivity);
router.get('/stats', getActivityStats);
router.get('/recent', getRecentActivities);

module.exports = router; 