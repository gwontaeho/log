import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/jenkins/:path*",
        destination: "http://jenkins.singlewindow.info:30143/:path*",
      },
    ];
  },
};

export default nextConfig;
