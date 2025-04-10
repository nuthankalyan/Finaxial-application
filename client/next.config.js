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
  
  // Enable font optimization
  optimizeFonts: true,
  
  // Add security headers and font preconnect
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            // Preconnect to Google Fonts to improve loading performance
            value: 'https://fonts.googleapis.com; rel=preconnect, https://fonts.gstatic.com; rel=preconnect',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  
  // Configure external domains for resources
  experimental: {
    optimizePackageImports: ['framer-motion', 'chart.js'],
  },
  
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