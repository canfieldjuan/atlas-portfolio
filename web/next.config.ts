import type { NextConfig } from "next";

const appRoot = __dirname;

const nextConfig: NextConfig = {
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
  /* config options here */
};

export default nextConfig;
