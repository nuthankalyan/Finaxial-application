// Custom server for Render deployment
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Get port from environment variable for Render compatibility
const port = process.env.PORT || 3000;

// Log environment information for debugging
console.log('Current directory:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Checking for .next directory...');

// Check if .next directory exists
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  console.warn('Warning: .next directory does not exist. Running build first...');
  try {
    // Try to run build if it's missing
    require('child_process').execSync('npm run build', {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Error during build process:', error.message);
    // Continue anyway - we'll exit with an error if the app can't prepare
  }
}

// Initialize the app
console.log('Preparing Next.js application...');
app.prepare()
  .then(() => {
    console.log('Next.js app prepared successfully.');
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error occurred starting server:');
    console.error(err);
    process.exit(1);
  }); 