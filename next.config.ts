import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prisma's @prisma/client + engine ships native binaries that the bundler
  // shouldn't try to inline. Listing them here keeps them as real modules
  // resolved from node_modules at runtime — required for Vercel to find
  // the query-engine binary inside the deployed function.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
