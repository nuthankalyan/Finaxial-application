/** @type {import('next').NextConfig} */
const nextConfig = {
  // Directories
  distDir: '.next',
  
  // Server options
  reactStrictMode: true,
  
  // Image optimization disabled for compatibility
  images: {
    unoptimized: true,
  },
  
  // Production optimizations
  optimizeFonts: true,
  
  // Server-side configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname,
  },
  
  // Both client and server
  publicRuntimeConfig: {
    // Will be available on both server and client
    NODE_ENV: process.env.NODE_ENV,
  },
};

module.exports = nextConfig; 