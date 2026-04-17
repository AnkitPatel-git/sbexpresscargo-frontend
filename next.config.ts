import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.localhost", "*.ngrok-free.app"],
  async rewrites() {
    const backendUrl = process.env.API_BACKEND_URL ?? "http://localhost:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
