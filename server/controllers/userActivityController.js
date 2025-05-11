const UserActivity = require('../models/UserActivity');

// @desc    Log user activity
// @route   POST /api/activity
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const { workspaceId, activityType, metadata } = req.body;

    const activity = await UserActivity.create({
      user: req.user.id,
      workspace: workspaceId,
      activityType,
      metadata
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get activity stats for a user
// @route   GET /api/activity/stats
// @access  Private
exports.getActivityStats = async (req, res) => {
  try {
    // Count reports generated
    const reportsGenerated = await UserActivity.countDocuments({
      user: req.user.id,
      activityType: 'report_generated'
    });

    // Count insights generated
    const insightsGenerated = await UserActivity.countDocuments({
      user: req.user.id,
      activityType: 'insight_generated'
    });

    // Get monthly change percentages
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Current month reports
    const currentMonthReports = await UserActivity.countDocuments({
      user: req.user.id,
      activityType: 'report_generated',
      createdAt: { $gte: firstDayOfMonth }
    });

    // Last month reports
    const lastMonthReports = await UserActivity.countDocuments({
      user: req.user.id,
      activityType: 'report_generated',
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Current month insights
    const currentMonthInsights = await UserActivity.countDocuments({
      user: req.user.id,
      activityType: 'insight_generated',
      createdAt: { $gte: firstDayOfMonth }
    });

    // Last month insights
    const lastMonthInsights = await UserActivity.countDocuments({
      user: req.user.id,
      activityType: 'insight_generated',
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Calculate percentage changes
    const reportsChange = lastMonthReports > 0 
      ? ((currentMonthReports - lastMonthReports) / lastMonthReports) * 100
      : (currentMonthReports > 0 ? 100 : 0);
    
    const insightsChange = lastMonthInsights > 0
      ? ((currentMonthInsights - lastMonthInsights) / lastMonthInsights) * 100
      : (currentMonthInsights > 0 ? 100 : 0);

    res.status(200).json({
      success: true,
      data: {
        reportsGenerated,
        insightsGenerated,
        reportsChange: parseFloat(reportsChange.toFixed(1)),
        insightsChange: parseFloat(insightsChange.toFixed(1))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recent user activities
// @route   GET /api/activity/recent
// @access  Private
exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await UserActivity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: 'workspace',
        select: 'name'
      });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 