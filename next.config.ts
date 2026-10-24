import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The TypeScript CLI configuration output is not parsed correctly in this setup.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
