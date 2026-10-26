import type { Metadata } from "next";
import { BlogPostPage } from '@/views/BlogPostPage';
import { prisma } from "@/lib/prisma";

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, isPublished: true },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: "Article introuvable", robots: { index: false, follow: false } };
  }
  const description = post.excerpt ?? post.content.replace(/<[^>]+>/g, "").slice(0, 160);

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    openGraph: {
      url: `/blog/${post.slug}`,
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostPage slug={slug} />;
}
