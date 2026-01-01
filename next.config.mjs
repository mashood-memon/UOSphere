/** @type {import('next').NextConfig} */
const nextConfig = {
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
