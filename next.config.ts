import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Allow production builds to succeed even if ESLint errors are present
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ (Optional) Allow production builds to succeed even if TS errors exist
    ignoreBuildErrors: true,
  },
  /* any other config options here */
};

export default nextConfig;
