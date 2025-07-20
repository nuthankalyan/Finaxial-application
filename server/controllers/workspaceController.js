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
    const { fileName, summary, insights, recommendations, charts, assistantChat, insightCards, notes, rawResponse } = req.body;
    
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
      notes: notes || '', // Include notes field
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
    console.log('[Server] Fetching report:', {
      workspaceId: req.params.id,
      reportId: req.params.reportId
    });

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

    // Handle migration from array to Map structure
    if (Array.isArray(workspace.reports)) {
      console.log('[Server] Found array structure for reports, migrating to Map');
      workspace.reports = new Map();
    }

    // Get the report data (workspace.reports is a Map)
    const report = workspace.reports?.get(req.params.reportId);

    if (!report) {
      console.log('[Server] Report not found');
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('[Server] Report found:', {
      hasReportData: !!report.reportData,
      hasUploadedFiles: !!report.uploadedFiles,
      uploadedFilesCount: report.uploadedFiles ? report.uploadedFiles.length : 0,
      reportKeys: Object.keys(report)
    });

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
    console.log('[Server] Saving report data:', {
      workspaceId: req.params.id,
      reportId: req.params.reportId,
      hasData: !!req.body.data,
      dataKeys: req.body.data ? Object.keys(req.body.data) : [],
      uploadedFilesCount: req.body.data?.uploadedFiles ? req.body.data.uploadedFiles.length : 0
    });

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

    // Handle migration from array to Map structure
    if (Array.isArray(workspace.reports)) {
      console.log('[Server] Migrating reports from array to Map structure');
      workspace.reports = new Map();
    } else if (!workspace.reports) {
      workspace.reports = new Map();
    }

    // Ensure workspace.reports is a Map
    if (!(workspace.reports instanceof Map)) {
      workspace.reports = new Map();
    }

    // Save report data
    workspace.reports.set(req.params.reportId, {
      ...req.body.data,
      updatedAt: new Date(),
      updatedBy: req.user.id
    });

    await workspace.save();

    console.log('[Server] Report saved successfully');

    res.status(200).json({
      success: true,
      data: workspace.reports.get(req.params.reportId)
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload dataset to workspace
// @route   POST /api/workspaces/:id/datasets
// @access  Private
// @desc    Upload dataset to workspace
// @route   POST /api/workspaces/:id/datasets
// @access  Private
exports.uploadDataset = async (req, res) => {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 100; // Base delay in milliseconds

  const uploadWithRetry = async (retryCount = 0) => {
    try {
      const { content, fileName, type } = req.body;
      
      // Fetch fresh workspace document on each retry
      const workspace = await Workspace.findById(req.params.id);

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check if user has access to workspace
      if (!workspace.members.includes(req.user.id) && workspace.owner.toString() !== req.user.id) {
        throw new Error('Not authorized to access this workspace');
      }

      // Helper function to get content metadata
      const getContentMetadata = (content, type) => {
        if (type === 'csv') {
          const lines = content.trim().split('\n');
          const headers = lines[0].split(',');
          const dataTypes = {};
          
          if (lines.length > 1) {
            const firstDataRow = lines[1].split(',');
            headers.forEach((header, index) => {
              const value = firstDataRow[index];
              if (!isNaN(Number(value))) {
                dataTypes[header] = 'number';
              } else if (Date.parse(value)) {
                dataTypes[header] = 'date';
              } else {
                dataTypes[header] = 'string';
              }
            });
          }

          return {
            columnCount: headers.length,
            rowCount: lines.length - 1,
            headers,
            dataTypes
          };
        } else {
          try {
            const data = JSON.parse(content);
            const sheets = Object.keys(data.sheets);
            const primarySheet = data.sheets[data.primarySheet];
            const dataTypes = {};

            if (primarySheet.rows.length > 0) {
              primarySheet.headers.forEach((header, index) => {
                const value = primarySheet.rows[0][index];
                if (!isNaN(Number(value))) {
                  dataTypes[header] = 'number';
                } else if (Date.parse(value)) {
                  dataTypes[header] = 'date';
                } else {
                  dataTypes[header] = 'string';
                }
              });
            }

            return {
              columnCount: primarySheet.headers.length,
              rowCount: primarySheet.rows.length,
              sheets,
              headers: primarySheet.headers,
              dataTypes
            };
          } catch (e) {
            return {
              columnCount: 0,
              rowCount: 0,
              headers: []
            };
          }
        }
      };

      // Helper function to detect changes
      const detectChanges = (previousVersion, newContent, type) => {
        const changes = {
          addedRows: 0,
          removedRows: 0,
          modifiedRows: 0,
          addedColumns: [],
          removedColumns: [],
          modifiedColumns: []
        };

        const oldContent = previousVersion.content;
        const newMetadata = getContentMetadata(newContent, type);
        
        changes.addedRows = Math.max(0, newMetadata.rowCount - previousVersion.metadata.rowCount);
        changes.removedRows = Math.max(0, previousVersion.metadata.rowCount - newMetadata.rowCount);

        const oldHeaders = previousVersion.metadata.headers;
        const newHeaders = newMetadata.headers;

        changes.addedColumns = newHeaders.filter(h => !oldHeaders.includes(h));
        changes.removedColumns = oldHeaders.filter(h => !newHeaders.includes(h));

        // Generate change description
        const descriptions = [];
        if (changes.addedRows > 0) descriptions.push(`Added ${changes.addedRows} rows`);
        if (changes.removedRows > 0) descriptions.push(`Removed ${changes.removedRows} rows`);
        if (changes.addedColumns.length > 0) descriptions.push(`Added columns: ${changes.addedColumns.join(', ')}`);
        if (changes.removedColumns.length > 0) descriptions.push(`Removed columns: ${changes.removedColumns.join(', ')}`);

        changes.changeDescription = descriptions.join('. ');
        return changes;
      };

      // Helper function to check similar structure
      const isSimilarStructure = (existingDataset, newContent, type) => {
        const latestVersion = existingDataset.versions[existingDataset.versions.length - 1];
        const existingMetadata = latestVersion.metadata;
        const newMetadata = getContentMetadata(newContent, type);

        if (!existingMetadata?.headers || !newMetadata?.headers) return false;

        const headerSimilarity = existingMetadata.headers.filter(h => 
          newMetadata.headers?.includes(h)
        ).length / Math.min(existingMetadata.headers.length, newMetadata.headers.length);

        return headerSimilarity >= 0.7;
      };

      const baseName = fileName.replace(/\.[^/.]+$/, "");
      const existingDataset = workspace.datasets.find(dataset => 
        dataset.name === baseName || isSimilarStructure(dataset, content, type)
      );

      let response;

      if (existingDataset) {
        // Add new version to existing dataset
        const previousVersion = existingDataset.versions[existingDataset.versions.length - 1];
        const metadata = getContentMetadata(content, type);
        const changeMetadata = detectChanges(previousVersion, content, type);

        const newVersion = {
          id: new Date().getTime().toString(),
          version: existingDataset.currentVersion + 1,
          fileName,
          createdAt: new Date(),
          userId: req.user.id,
          content,
          type,
          metadata,
          changeMetadata,
          parentVersionId: previousVersion.id
        };

        existingDataset.versions.push(newVersion);
        existingDataset.currentVersion++;
        existingDataset.updatedAt = new Date();

        response = {
          dataset: existingDataset,
          isNewDataset: false,
          version: newVersion.version
        };
      } else {
        // Create new dataset
        const newDataset = {
          id: new Date().getTime().toString(),
          name: baseName,
          currentVersion: 1,
          versions: [{
            id: new Date().getTime().toString() + '_v1',
            version: 1,
            fileName,
            createdAt: new Date(),
            userId: req.user.id,
            content,
            type,
            metadata: getContentMetadata(content, type)
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: req.user.id
        };

        workspace.datasets.push(newDataset);

        response = {
          dataset: newDataset,
          isNewDataset: true,
          version: 1
        };
      }

      await workspace.save();
      return response;

    } catch (error) {
      // Check if it's a version error and we can retry
      if ((error.name === 'VersionError' || error.message.includes('version')) && retryCount < MAX_RETRIES) {
        console.log(`Version conflict detected, retrying (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        
        // Exponential backoff with jitter
        const delay = BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return uploadWithRetry(retryCount + 1);
      }
      throw error;
    }
  };

  try {
    const response = await uploadWithRetry();
    
    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error uploading dataset:', error);
    
    if (error.message === 'Workspace not found') {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    if (error.message === 'Not authorized to access this workspace') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all datasets for a workspace
// @route   GET /api/workspaces/:id/datasets
// @access  Private
exports.getDatasets = async (req, res) => {
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

    res.status(200).json({
      success: true,
      data: workspace.datasets || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a specific dataset
// @route   GET /api/workspaces/:id/datasets/:datasetId
// @access  Private
exports.getDataset = async (req, res) => {
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

    const dataset = workspace.datasets.find(d => d.id === req.params.datasetId);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a dataset version
// @route   DELETE /api/workspaces/:id/datasets/:datasetId/versions/:versionId
// @access  Private
exports.deleteDatasetVersion = async (req, res) => {
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

    const dataset = workspace.datasets.find(d => d.id === req.params.datasetId);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    // Don't allow deleting if only one version remains
    if (dataset.versions.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last version'
      });
    }

    const versionIndex = dataset.versions.findIndex(v => v.id === req.params.versionId);
    if (versionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Remove the version
    dataset.versions.splice(versionIndex, 1);

    // Reorder version numbers
    dataset.versions.forEach((version, index) => {
      version.version = index + 1;
    });

    // Update currentVersion
    dataset.currentVersion = dataset.versions.length;
    dataset.updatedAt = new Date();

    await workspace.save();

    res.status(200).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all dataset versions for a workspace
// @route   GET /api/workspaces/:id/dataset-versions
// @access  Private
exports.getDatasetVersions = async (req, res) => {
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

    // Collect all versions from all datasets with dataset information
    const allVersions = [];
    
    if (workspace.datasets && workspace.datasets.length > 0) {
      workspace.datasets.forEach(dataset => {
        if (dataset.versions && dataset.versions.length > 0) {
          dataset.versions.forEach(version => {
            allVersions.push({
              id: version.id,
              version: version.version,
              fileName: version.fileName,
              datasetName: dataset.name,
              datasetId: dataset.id,
              createdAt: version.createdAt,
              userId: version.userId,
              type: version.type,
              metadata: version.metadata,
              changeMetadata: version.changeMetadata,
              parentVersionId: version.parentVersionId
            });
          });
        }
      });
    }

    // Sort by creation date (newest first)
    allVersions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: allVersions
    });
  } catch (error) {
    console.error('Error getting dataset versions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};