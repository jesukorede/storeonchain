/****/ /** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: { domains: [] },
  transpilePackages: ['@hashgraph/hedera-wallet-connect', '@reown/appkit', '@reown/walletkit'],
  webpack(config) {
    // Provide an alias for the non-exported adapters path used by some downstream packages
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@reown/appkit/adapters'] = path.resolve(__dirname, 'src/shims/reown-adapters.js');
    return config;
  },
};
module.exports = nextConfig;
