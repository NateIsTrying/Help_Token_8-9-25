/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  });
  
  const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
      appDir: false
    },
    images: {
      domains: ['ipfs.io', 'gateway.pinata.cloud'],
      formats: ['image/webp', 'image/avif']
    },
    env: {
      NEXT_PUBLIC_APP_NAME: 'HelpToken',
      NEXT_PUBLIC_APP_DESCRIPTION: 'Municipal Volunteer Cryptocurrency'
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false
        };
      }
      return config;
    }
  };
  
  module.exports = withPWA(nextConfig);
  