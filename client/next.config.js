/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set output directory to 'build' for Render compatibility
  distDir: process.env.NODE_ENV === 'production' ? 'build' : '.next',
  
  // Enable static exports if needed
  // output: 'export',
  
  // Other Next.js configurations
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure basePath if needed for subdirectory deployment
  // basePath: '',
};

module.exports = nextConfig; 