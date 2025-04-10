// Custom server for Render deployment
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');

// Check if we're in production mode
const dev = process.env.NODE_ENV !== 'production';

// Log environment for debugging
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Current directory: ${process.cwd()}`);

// Ensure .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!existsSync(nextDir)) {
  console.log(`.next directory not found, creating it at ${nextDir}`);
  try {
    mkdirSync(nextDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create .next directory: ${error.message}`);
  }
}

// Ensure BUILD_ID exists
const buildIdPath = path.join(nextDir, 'BUILD_ID');
if (!existsSync(buildIdPath)) {
  console.log(`BUILD_ID not found, creating placeholder at ${buildIdPath}`);
  try {
    // Create a placeholder BUILD_ID
    writeFileSync(buildIdPath, 'development', 'utf8');
    console.log('Created placeholder BUILD_ID');
    
    // Try to create other required files
    const requiredFiles = {
      'build-manifest.json': '{"polyfillFiles":[],"lowPriorityFiles":[],"rootMainFiles":[],"pages":{"/_app":[],"/_error":[]}}',
      'prerender-manifest.json': '{"version":4,"routes":{},"dynamicRoutes":{},"preview":{"previewModeId":"development","previewModeSigningKey":"development","previewModeEncryptionKey":"development"}}',
      'routes-manifest.json': '{"version":4,"basePath":"","redirects":[],"rewrites":[],"headers":[],"staticRoutes":[],"dynamicRoutes":[],"dataRoutes":[],"notFoundRoutes":[]}'
    };
    
    for (const [file, content] of Object.entries(requiredFiles)) {
      const filePath = path.join(nextDir, file);
      if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf8');
        console.log(`Created ${file}`);
      }
    }
  } catch (error) {
    console.error(`Failed to create required files: ${error.message}`);
  }
}

// Create server configuration
const serverConfig = { 
  dev,
  dir: process.cwd(),
  // Explicitly tell Next.js where to find the build files
  conf: { 
    distDir: '.next',
    // Allow server to start even if build is incomplete
    experimental: {
      disableOptimizedLoading: true
    }
  }
};

const app = next(serverConfig);
const handle = app.getRequestHandler();

// Get port from environment variable for Render compatibility
const port = process.env.PORT || 3000;

console.log(`Starting server on port ${port}`);

// Try to run the Next.js app
app.prepare()
  .then(() => {
    console.log('Next.js app prepared successfully');
    createServer((req, res) => {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      // Let Next.js handle the request
      handle(req, res, parsedUrl);
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error preparing Next.js app:', err);
    console.log('Trying to recover by running build...');
    
    try {
      // Try running the build as a last resort
      console.log('Running next build...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build completed, trying to start again...');
      
      // Try starting the server again
      const app2 = next(serverConfig);
      const handle2 = app2.getRequestHandler();
      
      app2.prepare()
        .then(() => {
          createServer((req, res) => {
            handle2(req, res, parse(req.url, true));
          }).listen(port, () => {
            console.log(`> Recovery successful! Server ready on http://localhost:${port}`);
          });
        })
        .catch(finalErr => {
          console.error('Final error, unable to start server:', finalErr);
          process.exit(1);
        });
    } catch (buildErr) {
      console.error('Failed to run build:', buildErr);
      process.exit(1);
    }
  }); 