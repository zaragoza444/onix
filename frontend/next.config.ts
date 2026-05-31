import path from "path";
import type { NextConfig } from "next";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(dir, ".."),
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
