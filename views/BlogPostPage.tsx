"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string };
  category: { id: string; name: string | null; slug: string } | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function BlogPostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`);
        const data = await response.json();
        if (data.success) setPost(data.data.post);
        else notFound();
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const response = await fetch("/api/blog");
        const data = await response.json();
        if (data.success) {
          setRelated(data.data.posts.filter((p: BlogPost) => p.slug !== slug).slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching related posts:", error);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Chargement...</div>
        <Footer />
      </div>
    );
  }

  if (!post) return notFound();

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <div className="relative h-[65vh] min-h-[440px] flex items-end text-white overflow-hidden">
        <img src={post.coverImage || "https://hotelnahoui.net/wp-content/uploads/2024/06/piscine-1.jpg"} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 mx-auto max-w-[900px] w-full px-6 lg:px-10 pb-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4" /> Retour au blog
            </Link>
            <span className="eyebrow">{post.category?.name || "Non classé"}</span>
            <h1 className="font-display mt-4 text-3xl sm:text-5xl font-light leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-white/85">
              <span className="flex items-center gap-2"><User className="h-4 w-4" /> {post.author.name}</span>
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(post.publishedAt)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Article body */}
      <article className="mx-auto max-w-[760px] px-6 lg:px-10 py-20">
        {post.excerpt && (
          <p className="font-display text-xl sm:text-2xl font-light italic text-muted-foreground leading-relaxed mb-12 border-l border-primary pl-6">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-light prose-a:text-primary">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Share */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="eyebrow text-muted-foreground flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Partager cet article
          </span>
          <div className="flex gap-3">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="h-9 w-9 grid place-items-center border border-border hover:border-foreground transition-colors" aria-label="Partager sur Facebook">
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="h-9 w-9 grid place-items-center border border-border hover:border-foreground transition-colors" aria-label="Partager sur Twitter">
              <Twitter className="h-3.5 w-3.5" />
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="h-9 w-9 grid place-items-center border border-border hover:border-foreground transition-colors" aria-label="Partager sur LinkedIn">
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-warm py-24">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="flex items-end justify-between mb-14">
              <h2 className="font-display text-3xl sm:text-4xl font-light">Articles similaires</h2>
              <Link href="/blog" className="hidden sm:inline-block link-underline text-foreground">
                Voir tous les articles
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={p.coverImage || "https://hotelnahoui.net/wp-content/uploads/2024/06/piscine-1.jpg"}
                      alt={p.title}
                      className="absolute inset-0 h-full w-full object-cover img-zoom"
                    />
                  </div>
                  <div className="pt-5">
                    <span className="eyebrow text-primary">{p.category?.name || "Non classé"}</span>
                    <h3 className="font-display mt-2 text-lg font-light leading-snug line-clamp-2">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-ink text-white text-center py-20 lg:py-28">
        <span className="eyebrow text-white/70">Réservation</span>
        <h3 className="font-display mt-5 text-3xl sm:text-4xl font-light">Envie de vivre l&apos;expérience ?</h3>
        <div className="mt-9">
          <Link href="/stays" className="link-underline text-white">
            Réserver maintenant
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
