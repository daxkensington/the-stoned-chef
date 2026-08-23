import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.thestonedchef.ca" }],
        destination: "https://thestonedchef.ca/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon-192.png" }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2xsxph8kpxj0f.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "files.manuscdn.com",
      },
    ],
  },
  serverExternalPackages: ["@neondatabase/serverless", "twilio"],
};

export default withSentryConfig(nextConfig, {
  org: "vakaygo",
  project: "stoned-chef",
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
});
