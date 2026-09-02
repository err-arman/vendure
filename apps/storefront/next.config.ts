import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  images: {
    // This is necessary to display images from your local Vendure instance
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        hostname: "readonlydemo.vendure.io",
      },
      {
        hostname: "demo.vendure.io",
      },
      {
        hostname: "localhost",
      },
      { hostname: "103.191.179.241", port: "3000" },
      { hostname: "admin.eastbengal.coffee" },
    ],
  },
  experimental: {
    rootParams: true,
  },
};

export default withNextIntl(nextConfig);
