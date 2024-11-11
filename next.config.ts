import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/jenkins/:path*",
        destination: "https://jenkins.singlewindow.info:30143/:path*",
      },
    ];
  },
};

export default nextConfig;
