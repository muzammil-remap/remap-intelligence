import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the parent dir otherwise
  // confuses Turbopack's root inference.
  turbopack: {
    root: __dirname,
  },

  // Heavy native/binary deps must not be bundled by the server compiler.
  // @react-pdf/renderer pulls in fontkit/yoga which break when bundled.
  serverExternalPackages: ["@react-pdf/renderer"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://remap.ai" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://remap.ai",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
