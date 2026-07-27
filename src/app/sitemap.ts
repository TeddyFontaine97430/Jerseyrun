import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jerseyrun.re";

  const clubs = await prisma.club.findMany({
    where: { status: "APPROVED", active: true },
    select: { slug: true, createdAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/concept`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const clubRoutes: MetadataRoute.Sitemap = clubs.map((club) => ({
    url: `${baseUrl}/clubs/${club.slug}`,
    lastModified: club.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...clubRoutes];
}
