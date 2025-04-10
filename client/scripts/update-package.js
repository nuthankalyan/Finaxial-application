// Script to update package.json with font download scripts
const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '../package.json');

// Read the current package.json
const packageJson = require(packageJsonPath);

// Add new scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'download-fonts': 'node scripts/download-fonts.js',
  'postinstall': 'npm run download-fonts || echo "Font download failed, using fallbacks"'
};

// Write the updated package.json
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2),
  'utf8'
);

console.log('Updated package.json with font download scripts'); 