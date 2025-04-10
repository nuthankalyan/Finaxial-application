/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['example.com'], // Update with your actual image domains if needed
  },
  swcMinify: true,
};

module.exports = nextConfig; 