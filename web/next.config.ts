import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rewrites for Lyra World Engine internal read bridge
  async rewrites() {
    return [
      {
        source: '/lyra-read/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
