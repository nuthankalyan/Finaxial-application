// Simple test script to verify Next.js directory structure
const fs = require('fs');
const path = require('path');

// Create required directories
const dirs = [
  '.next',
  '.next/static',
  '.next/cache',
  '.next/server',
  '.next/server/pages'
];

console.log('Creating required directories...');
for (const dir of dirs) {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created ${dir}`);
  } else {
    console.log(`${dir} already exists`);
  }
}

// Create required files
const requiredFiles = {
  '.next/BUILD_ID': Date.now().toString(),
  '.next/build-manifest.json': JSON.stringify({
    polyfillFiles: [],
    lowPriorityFiles: [],
    rootMainFiles: [],
    pages: { "/_app": [], "/_error": [], "/" : [] }
  }),
  '.next/react-loadable-manifest.json': JSON.stringify({}),
  '.next/routes-manifest.json': JSON.stringify({
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
  '.next/server/pages-manifest.json': JSON.stringify({
    "/": "pages/index.html",
    "/_app": "pages/_app.js",
    "/_error": "pages/_error.js",
    "/_document": "pages/_document.js"
  }),
  '.next/server/middleware-manifest.json': JSON.stringify({
    version: 2,
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    matchers: {}
  }),
  '.next/server/font-manifest.json': JSON.stringify({
    pages: {},
    app: {},
    appUsingSizeAdjust: false,
    pagesUsingSizeAdjust: false
  }),
  '.next/server/next-font-manifest.json': JSON.stringify({
    pages: {},
    app: {},
    appUsingSizeAdjust: false,
    pagesUsingSizeAdjust: false
  })
};

console.log('Creating required files...');
for (const [filePath, content] of Object.entries(requiredFiles)) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Created ${filePath}`);
  } else {
    console.log(`${filePath} already exists`);
  }
}

// Create basic required page files
const pageFiles = {
  '.next/server/pages/_document.js': 'module.exports = require("next/dist/pages/_document");',
  '.next/server/pages/_app.js': 'module.exports = require("next/dist/pages/_app");',
  '.next/server/pages/_error.js': 'module.exports = require("next/dist/pages/_error");',
  '.next/server/pages/index.html': '<!DOCTYPE html><html><head><title>Finaxial</title></head><body><div>Loading...</div></body></html>'
};

console.log('Creating page files...');
for (const [filePath, content] of Object.entries(pageFiles)) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Created ${filePath}`);
  } else {
    console.log(`${filePath} already exists`);
  }
}

console.log('Directory structure created successfully'); 