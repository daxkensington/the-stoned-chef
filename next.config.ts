import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
