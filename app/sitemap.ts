import type { MetadataRoute } from "next";
import { ONLINE_ORDERING_ENABLED } from "@shared/const";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://thestonedchef.ca";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Only while the till is open: /order is noindex when ordering is closed,
    // and submitting a noindex URL in the sitemap contradicts itself (Search
    // Console reports it as an error rather than ignoring it).
    ...(ONLINE_ORDERING_ENABLED
      ? [
          {
            url: `${baseUrl}/order`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
        ]
      : []),
  ];
}
