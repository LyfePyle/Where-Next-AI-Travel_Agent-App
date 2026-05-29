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
    ];
  },
};

export default nextConfig;
