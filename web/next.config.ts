import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress served responses (gzip/brotli) to reduce payload and speed up network transfer
  compress: true,

  // Remove X-Powered-By header for security and reduced header overhead
  poweredByHeader: false,

  // React Strict Mode for detecting runtime side effects and issues early
  reactStrictMode: true,

  // External server packages that should not be bundled by Turbopack/Webpack
  serverExternalPackages: [],

  // Compiler optimizations
  compiler: {
    // Strip debug logs in production bundles while retaining errors and warnings
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Package import optimization: tree-shake modular imports for heavy libraries
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@xterm/xterm",
      "prismjs",
      "clsx",
      "tailwind-merge",
      "zustand",
    ],
  },

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
