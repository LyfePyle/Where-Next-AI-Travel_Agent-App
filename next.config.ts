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
      { source: '/explore', destination: '/plan-trip', permanent: true },
      { source: '/explore/:path*', destination: '/plan-trip', permanent: true },
      { source: '/search', destination: '/plan-trip', permanent: true },
      { source: '/search/:path*', destination: '/plan-trip', permanent: true },
      { source: '/ai-travel-agent', destination: '/plan-trip', permanent: true },
      { source: '/ai-travel-agent/:path*', destination: '/plan-trip', permanent: true },
      { source: '/pricing', destination: '/plan-trip', permanent: true },
      { source: '/pricing/:path*', destination: '/plan-trip', permanent: true },
      { source: '/tours', destination: '/walking-tour', permanent: true },
      { source: '/tours/:path*', destination: '/walking-tour', permanent: true },
    ];
  },
};

export default nextConfig;
