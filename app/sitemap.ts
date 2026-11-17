import type { MetadataRoute } from "next";
import { ONLINE_ORDERING_ENABLED } from "@shared/const";

export const SITE_BASE_URL = "https://thestonedchef.ca";

export function buildSitemap(
  onlineOrderingEnabled: boolean = ONLINE_ORDERING_ENABLED,
  now: Date = new Date(),
): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_BASE_URL}/menu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Only while the till is open: /order is noindex when ordering is closed,
    // and submitting a noindex URL in the sitemap contradicts itself (Search
    // Console reports it as an error rather than ignoring it).
    ...(onlineOrderingEnabled
      ? [
          {
            url: `${SITE_BASE_URL}/order`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
        ]
      : []),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(ONLINE_ORDERING_ENABLED);
}
