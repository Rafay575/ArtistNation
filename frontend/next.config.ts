import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Production Domain (Nginx / Express static uploads)
      {
        protocol: 'http',
        hostname: 'test.artistnation.studio',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'test.artistnation.studio',
        pathname: '/uploads/**',
      },
      // Local Development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;