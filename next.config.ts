import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['exceljs'],
  // Baseline hardening headers (HSTS is Vercel-managed). frame-ancestors 'none'
  // stops the workspace being framed for clickjacking; nosniff kills MIME
  // sniffing; referrer policy trims leakage on outbound links.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
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
