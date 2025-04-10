// Custom server for Render deployment
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Check if we're in production mode
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Get port from environment variable for Render compatibility
const port = process.env.PORT || 3000;

console.log(`Starting server on port ${port} (NODE_ENV: ${process.env.NODE_ENV})`);

// Initialize the app
app.prepare()
  .then(() => {
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
    console.error('Error starting server:', err);
    process.exit(1);
  }); 