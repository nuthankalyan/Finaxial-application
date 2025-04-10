/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to support dynamic routes
  // output: 'export',
  
  // Still keep unoptimized images for Render compatibility
  images: {
    unoptimized: true,
  },
  
  // Other Next.js configurations
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 