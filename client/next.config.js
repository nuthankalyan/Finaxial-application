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
  
  // Memory optimization to prevent SIGKILL
  onDemandEntries: {
    // Server will not keep pages in memory for more than 5 seconds
    maxInactiveAge: 5 * 1000,
    // Only keep 2 pages in memory at a time
    pagesBufferLength: 2,
  },
  
  // Add security headers and font preconnect
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  
  // Add rewrites to handle client-side routing for SPA
  async rewrites() {
    return [
      // Rewrite everything to `pages/index` to handle client-side routing
      {
        source: '/:path*',
        destination: '/',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*text/html.*)',
          }
        ],
      },
    ];
  },
  
  // Memory-optimized experimental settings
  experimental: {
    // Optimize memory usage
    optimizeCss: true,
    // Optimize JS bundle
    optimizeServerReact: true,
    // Disable font optimization for better stability
    adjustFontFallbacks: false,
    adjustFontFallbacksWithSizeAdjust: false,
  },
  
  // Compiler optimizations
  compiler: {
    // Reduce bundle size
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
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
  
  // General build settings to reduce memory usage
  swcMinify: true,
  poweredByHeader: false,
};

module.exports = nextConfig; 