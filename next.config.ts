import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['exceljs'],
  // Core modules (verification, money, export) use ESM `.js` specifiers so
  // they run under node/tsx; teach webpack to resolve them to .ts sources.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
