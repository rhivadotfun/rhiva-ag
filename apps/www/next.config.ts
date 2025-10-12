import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { createCivicAuthPlugin } from "@civic/auth/nextjs";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.NEXT_CIVIC_CLIENT_ID!,
});

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(withCivicAuth(nextConfig));

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
