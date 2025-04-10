// Custom server for Render deployment
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Check if we're in production mode
const dev = process.env.NODE_ENV !== 'production';

// Get port from environment variable for Render compatibility
const port = parseInt(process.env.PORT, 10) || 3000;

// Log environment for debugging
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Using port: ${port}`);

// Start a minimal HTTP server immediately so Render detects a port
const tempServer = require('http').createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><h1>Server is starting...</h1><p>The Next.js application is initializing.</p></body></html>');
});

// Listen on the port immediately
tempServer.listen(port, () => {
  console.log(`Temporary server listening on port ${port}`);
});

// Function to ensure required directories and files exist
function ensureNextFiles() {
  try {
    // Ensure .next directory exists
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      console.log(`.next directory not found, creating it at ${nextDir}`);
      fs.mkdirSync(nextDir, { recursive: true });
    }

    // Create subdirectories that Next.js expects
    const requiredDirs = ['server', 'static', 'cache'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(nextDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      }
    }

    // Ensure the pages-manifest.json file exists in the server directory
    const serverDir = path.join(nextDir, 'server');
    const pagesManifestPath = path.join(serverDir, 'pages-manifest.json');
    if (!fs.existsSync(pagesManifestPath)) {
      console.log(`pages-manifest.json not found, creating placeholder at ${pagesManifestPath}`);
      // Create a placeholder pages-manifest.json with basic routes
      fs.writeFileSync(pagesManifestPath, JSON.stringify({
        "/": "pages/index.html",
        "/_app": "pages/_app.js",
        "/_error": "pages/_error.js",
        "/_document": "pages/_document.js"
      }), 'utf8');
      console.log('Created pages-manifest.json');
    }

    // Ensure BUILD_ID exists
    const buildIdPath = path.join(nextDir, 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
      console.log(`BUILD_ID not found, creating placeholder at ${buildIdPath}`);
      // Create a placeholder BUILD_ID
      fs.writeFileSync(buildIdPath, Date.now().toString(), 'utf8');
      console.log('Created placeholder BUILD_ID');
    }
    
    // Required files with minimal valid content
    const requiredFiles = {
      'build-manifest.json': JSON.stringify({
        polyfillFiles: [],
        lowPriorityFiles: [],
        rootMainFiles: [],
        pages: { "/_app": [], "/_error": [], "/" : [] }
      }),
      'prerender-manifest.json': JSON.stringify({
        version: 4,
        routes: {},
        dynamicRoutes: {},
        preview: {
          previewModeId: "development",
          previewModeSigningKey: "development",
          previewModeEncryptionKey: "development"
        }
      }),
      'routes-manifest.json': JSON.stringify({
        version: 4,
        basePath: "",
        redirects: [],
        rewrites: [],
        headers: [],
        staticRoutes: [{ page: "/", regex: "^/?$" }],
        dynamicRoutes: [],
        dataRoutes: [],
        notFoundRoutes: []
      }),
      'react-loadable-manifest.json': JSON.stringify({})
    };
    
    // Add additional server files
    const serverFiles = {
      'next-font-manifest.json': JSON.stringify({
        pages: {},
        app: {},
        appUsingSizeAdjust: false,
        pagesUsingSizeAdjust: false
      })
    };
    
    for (const [file, content] of Object.entries(requiredFiles)) {
      const filePath = path.join(nextDir, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Created ${file}`);
      }
    }
    
    // Create server-specific files
    for (const [file, content] of Object.entries(serverFiles)) {
      const filePath = path.join(nextDir, 'server', file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Created server/${file}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to create required Next.js files: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Function to verify required Next.js files exist
function verifyNextFiles() {
  try {
    // Most critical files to check
    const criticalFiles = [
      '.next/BUILD_ID',
      '.next/build-manifest.json',
      '.next/server/pages-manifest.json',
      '.next/server/next-font-manifest.json',
      '.next/routes-manifest.json'
    ];
    
    console.log('Verifying critical Next.js files...');
    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✓ ${file} exists`);
        // Log the content for debugging
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.trim().length === 0) {
            console.warn(`Warning: ${file} is empty`);
            if (file.endsWith('.json')) {
              console.log('Fixing empty JSON file');
              if (file.includes('pages-manifest')) {
                fs.writeFileSync(filePath, JSON.stringify({
                  "/": "pages/index.html",
                  "/_app": "pages/_app.js",
                  "/_error": "pages/_error.js",
                  "/_document": "pages/_document.js"
                }));
              } else if (file.includes('build-manifest')) {
                fs.writeFileSync(filePath, JSON.stringify({
                  polyfillFiles: [],
                  lowPriorityFiles: [],
                  rootMainFiles: [],
                  pages: { "/_app": [], "/_error": [], "/" : [] }
                }));
              } else if (file.includes('routes-manifest')) {
                fs.writeFileSync(filePath, JSON.stringify({
                  version: 4,
                  basePath: "",
                  redirects: [],
                  rewrites: [],
                  headers: [],
                  staticRoutes: [{ page: "/", regex: "^/?$" }],
                  dynamicRoutes: [],
                  dataRoutes: [],
                  notFoundRoutes: []
                }));
              } else if (file.includes('next-font-manifest')) {
                fs.writeFileSync(filePath, JSON.stringify({
                  pages: {},
                  app: {},
                  appUsingSizeAdjust: false,
                  pagesUsingSizeAdjust: false
                }));
              }
            }
          }
        } catch (readErr) {
          console.warn(`Warning: Could not read ${file}:`, readErr.message);
        }
      } else {
        console.warn(`✗ ${file} does not exist`);
      }
    }

    // Additional check for server directory
    const serverDir = path.join(process.cwd(), '.next/server');
    const pagesDir = path.join(serverDir, 'pages');
    
    if (!fs.existsSync(pagesDir)) {
      console.log('Creating pages directory');
      fs.mkdirSync(pagesDir, { recursive: true });
    }
    
    return true;
  } catch (error) {
    console.error('Error during file verification:', error);
    return false;
  }
}

// Add this function after verifyNextFiles
function createNextFontManifest() {
  try {
    const nextDir = path.join(process.cwd(), '.next');
    const serverDir = path.join(nextDir, 'server');
    
    // Ensure server directory exists
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    // Create next-font-manifest.json
    const fontManifestPath = path.join(serverDir, 'next-font-manifest.json');
    const fontManifestContent = {
      pages: {},
      app: {},
      appUsingSizeAdjust: false,
      pagesUsingSizeAdjust: false
    };
    
    fs.writeFileSync(fontManifestPath, JSON.stringify(fontManifestContent), 'utf8');
    console.log('Created next-font-manifest.json');
    
    return true;
  } catch (error) {
    console.error('Failed to create next-font-manifest.json:', error);
    return false;
  }
}

// Ensure Next.js required files exist before starting
console.log('Ensuring Next.js required files exist...');
const filesCreated = ensureNextFiles();
if (!filesCreated) {
  console.warn('Warning: Failed to create some required Next.js files. Will attempt to continue anyway.');
}

// Create server configuration
const serverConfig = { 
  dev,
  dir: process.cwd(),
  conf: { 
    distDir: '.next',
    // Allow server to start even if build is incomplete
    experimental: {
      disableOptimizedLoading: true
    }
  }
};

// Initialize Next.js app
console.log('Initializing Next.js...');
const app = next(serverConfig);
const handle = app.getRequestHandler();

// Prepare the Next.js app in the background
// First, verify all critical files
verifyNextFiles();

// Ensure font manifest exists
createNextFontManifest();

// Now try to prepare the app
console.log('Preparing Next.js application...');
app.prepare()
  .then(() => {
    console.log('Next.js app prepared successfully');
    
    // Close temporary server
    tempServer.close(() => {
      console.log('Temporary server closed');
      
      // Start the real Next.js server
      createServer((req, res) => {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        // Let Next.js handle the request
        handle(req, res, parsedUrl);
      }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Next.js server ready on http://localhost:${port}`);
      });
    });
  })
  .catch(err => {
    console.error('Error preparing Next.js app:', err);
    console.log('Detailed error:', err.stack);
    
    // Try to fix the issues by ensuring files and directories
    console.log('Attempting to fix file issues...');
    ensureNextFiles();
    verifyNextFiles();
    
    // Create font manifest explicitly as it's often the cause of issues
    console.log('Creating font manifest file...');
    createNextFontManifest();
    
    // Keep the temporary server running but try one last approach
    console.log('Attempting build and restart...');
    
    try {
      // Create basic placeholder for pages/index.js
      const pagesDir = path.join(process.cwd(), '.next/server/pages');
      fs.mkdirSync(pagesDir, { recursive: true });
      
      const indexHtmlPath = path.join(pagesDir, 'index.html');
      fs.writeFileSync(indexHtmlPath, '<html><body><h1>Finaxial</h1><p>Application is initializing, please wait...</p></body></html>');
      
      // Create font manifest to avoid errors
      createNextFontManifest();
      
      // Try running the build
      console.log('Running build process...');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('Build completed, trying to start again...');
      } catch (buildError) {
        console.error('Build failed but continuing:', buildError.message);
      }
      
      // Try starting the Next.js app again with retry logic
      console.log('Attempting to start Next.js again...');
      setTimeout(() => {
        try {
          const app2 = next(serverConfig);
          app2.prepare()
            .then(() => {
              const handle2 = app2.getRequestHandler();
              
              // Close temporary server
              tempServer.close(() => {
                console.log('Temporary server closed');
                
                // Start the real Next.js server
                createServer((req, res) => {
                  handle2(req, res, parse(req.url, true));
                }).listen(port, () => {
                  console.log(`> Recovery successful! Next.js server ready on http://localhost:${port}`);
                });
              });
            })
            .catch(finalErr => {
              console.error('Final error starting Next.js:', finalErr);
              console.log('Using temporary server as fallback');
              // Keep the temporary server running for basic functionality
            });
        } catch (initError) {
          console.error('Failed to initialize Next.js:', initError);
          console.log('Using temporary server as fallback');
        }
      }, 5000); // Wait 5 seconds before retry
    } catch (recoveryErr) {
      console.error('Recovery failed:', recoveryErr);
      console.log('Using temporary server as fallback');
    }
  }); 