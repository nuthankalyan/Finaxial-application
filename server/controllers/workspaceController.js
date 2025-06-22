const Workspace = require('../models/Workspace');
const UserActivity = require('../models/UserActivity');

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
exports.createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Create the workspace with the current user as owner
    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id]
    });

    res.status(201).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all workspaces for current user
// @route   GET /api/workspaces
// @access  Private
exports.getWorkspaces = async (req, res) => {
  try {
    // Find workspaces where user is owner or member
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: workspaces.length,
      data: workspaces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single workspace
// @route   GET /api/workspaces/:id
// @access  Private
exports.getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is owner or member
    if (workspace.owner.toString() !== req.user.id && 
        !workspace.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace'
      });
    }

    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update workspace by ID
// @route   PUT /api/workspaces/:id
// @access  Private
exports.updateWorkspace = async (req, res) => {
  try {
    let workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is the owner of the workspace
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this workspace'
      });
    }

    workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete workspace by ID
// @route   DELETE /api/workspaces/:id
// @access  Private
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is the owner of the workspace
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this workspace'
      });
    }

    await workspace.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save financial insights to a workspace
// @route   POST /api/workspaces/:id/insights
// @access  Private
exports.saveInsights = async (req, res) => {
  try {
    const { fileName, summary, insights, recommendations, charts, assistantChat, insightCards, rawResponse } = req.body;
    
    if (!fileName || !summary || !insights || !recommendations) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if user is owner or member
    if (workspace.owner.toString() !== req.user.id && 
        !workspace.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this workspace'
      });
    }
    
    // Add new insights to the workspace
    workspace.financialInsights.push({
      fileName,
      summary,
      insights,
      recommendations,
      charts,
      assistantChat,
      insightCards,
      rawResponse,
      createdAt: Date.now()
    });
    
    // Update workspace modified time
    workspace.updatedAt = Date.now();
    await workspace.save();
    
    // Log insight generation activity
    await UserActivity.create({
      user: req.user.id,
      workspace: workspace._id,
      activityType: 'insight_generated',
      metadata: {
        fileName,
        insightId: workspace.financialInsights[workspace.financialInsights.length - 1]._id
      }
    });
    
    res.status(201).json({
      success: true,
      data: workspace.financialInsights[workspace.financialInsights.length - 1]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all financial insights for a workspace
// @route   GET /api/workspaces/:id/insights
// @access  Private
exports.getInsights = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if user is owner or member
    if (workspace.owner.toString() !== req.user.id && 
        !workspace.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace'
      });
    }
    
    res.status(200).json({
      success: true,
      count: workspace.financialInsights.length,
      data: workspace.financialInsights
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Log report generation
// @route   POST /api/workspaces/:id/report
// @access  Private
exports.logReportGeneration = async (req, res) => {
  try {
    const { insightId, reportType } = req.body;
    
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if user is owner or member
    if (workspace.owner.toString() !== req.user.id && 
        !workspace.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace'
      });
    }
    
    // Find the insight
    const insight = workspace.financialInsights.id(insightId);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    // Log report generation activity
    const activity = await UserActivity.create({
      user: req.user.id,
      workspace: workspace._id,
      activityType: 'report_generated',
      metadata: {
        fileName: insight.fileName,
        insightId,
        reportType
      }
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

// @desc    Get a specific report from a workspace
// @route   GET /api/workspaces/:id/report/:reportId
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access to workspace
    if (!workspace.members.includes(req.user.id) && workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace'
      });
    }

    // Get the report data
    const report = workspace.reports?.get(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save a report for a workspace
// @route   POST /api/workspaces/:id/report/:reportId
// @access  Private
exports.saveReport = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access to workspace
    if (!workspace.members.includes(req.user.id) && workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace'
      });
    }

    // Save report data
    workspace.reports = workspace.reports || {};
    workspace.reports[req.params.reportId] = {
      ...req.body.data,
      updatedAt: new Date(),
      updatedBy: req.user.id
    };

    await workspace.save();

    res.status(200).json({
      success: true,
      data: workspace.reports[req.params.reportId]
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};