import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-assets.clashroyale.com',
      },
    ],
  },
};

export default nextConfig;
