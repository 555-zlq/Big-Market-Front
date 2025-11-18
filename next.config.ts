import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    target: 'server',
    output: "standalone",
    env: {
        API_HOST_URL: process.env.API_HOST_URL,
    }
};

module.exports = nextConfig;
export default nextConfig;
