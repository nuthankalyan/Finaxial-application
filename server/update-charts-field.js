const mongoose = require('mongoose');
const Workspace = require('./models/Workspace');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/finaxial', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected...');
  
  // Find all workspaces
  const workspaces = await Workspace.find({});
  console.log(`Found ${workspaces.length} workspaces`);
  
  // Update each workspace's financial insights to add empty charts field
  for (const workspace of workspaces) {
    if (workspace.financialInsights && workspace.financialInsights.length > 0) {
      workspace.financialInsights.forEach(insight => {
        if (!insight.charts) {
          insight.charts = null;
        }
      });
      await workspace.save();
      console.log(`Updated workspace: ${workspace._id} with ${workspace.financialInsights.length} insights`);
    }
  }
  
  console.log('All workspaces updated successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
}); 