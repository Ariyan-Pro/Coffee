import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const staticPages = ["", "/coffee", "/subscribe", "/about", "/faq", "/contact", "/legal/terms", "/legal/privacy"];
  const now = new Date();

  return [
    ...staticPages.map((p) => ({
      url: `${base}${p}`,
      lastModified: now,
      changeFrequency: p === "" ? ("daily" as const) : ("weekly" as const),
      priority: p === "" ? 1 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/coffee/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
