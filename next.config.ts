import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: '/explore', destination: '/search', permanent: true },
      { source: '/explore/:path*', destination: '/search/:path*', permanent: true },
      { source: '/ai-travel-agent', destination: '/plan-trip', permanent: true },
      { source: '/ai-travel-agent/:path*', destination: '/plan-trip', permanent: true },
    ];
  },
};

export default nextConfig;
