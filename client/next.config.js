/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Render static site
  output: 'export',
  
  // Required for static export with images
  images: {
    unoptimized: true,
  },
  
  // Other Next.js configurations
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 