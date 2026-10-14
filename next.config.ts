
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "automatic-winner-q74w9jg6xqj4h6x95-3000.app.github.dev",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
