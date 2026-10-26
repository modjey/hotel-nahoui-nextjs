import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/stays", changeFrequency: "weekly", priority: 0.9 },
  { path: "/restaurant", changeFrequency: "monthly", priority: 0.8 },
  { path: "/bien-etre", changeFrequency: "monthly", priority: 0.7 },
  { path: "/services", changeFrequency: "monthly", priority: 0.7 },
  { path: "/evenements", changeFrequency: "monthly", priority: 0.6 },
  { path: "/photobook", changeFrequency: "weekly", priority: 0.6 },
  { path: "/avis", changeFrequency: "weekly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rooms, locations, posts] = await Promise.all([
    prisma.room.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.location.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const roomEntries: MetadataRoute.Sitemap = rooms.map((room) => ({
    url: `${SITE_URL}/rooms/${room.slug}`,
    lastModified: room.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const locationEntries: MetadataRoute.Sitemap = locations.map((location) => ({
    url: `${SITE_URL}/stays/${location.slug}`,
    lastModified: location.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...roomEntries, ...locationEntries, ...blogEntries];
}
