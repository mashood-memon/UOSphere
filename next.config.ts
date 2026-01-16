// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for Tesseract.js worker issues in Next.js
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "tesseract.js": "commonjs tesseract.js",
      });
    }
    return config;
  },
};

export default nextConfig;
