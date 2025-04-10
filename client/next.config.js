/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: true,
  
  // Required for images
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig; 