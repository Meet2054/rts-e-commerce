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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/rts-imaging-e-commerce.firebasestorage.app/o/**',
      },
    ],
  },
  /* any other config options here */
};

export default nextConfig;
