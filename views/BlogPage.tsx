"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Search, Newspaper, User } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Skeleton } from "@/components/ui/skeleton";

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

type BlogCategory = { id: string; name: string; slug: string };

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function BlogPage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const [postsRes, categoriesRes] = await Promise.all([fetch("/api/blog"), fetch("/api/blog/categories")]);
        const postsData = await postsRes.json();
        const categoriesData = await categoriesRes.json();
        if (postsData.success) setPosts(postsData.data.posts);
        if (categoriesData.success) setCategories(categoriesData.data.categories);
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "all" || p.category?.id === activeCategory;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || p.title.toLowerCase().includes(q) || (p.excerpt && p.excerpt.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const featured = posts.find((p) => p.isFeatured) ?? posts[0];
  const rest = filtered.filter((p) => p.slug !== featured?.slug);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-16 text-center">
          <span className="eyebrow text-primary">Journal</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light">Le Blog</h1>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16">
        {/* Search & filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-16 border-b border-border pb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-7 py-2 bg-transparent border-b border-border focus:outline-none focus:border-foreground transition-colors text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <button
              onClick={() => setActiveCategory("all")}
              className={`eyebrow transition-colors ${activeCategory === "all" ? "text-foreground border-b border-foreground pb-1" : "text-muted-foreground hover:text-foreground"}`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`eyebrow transition-colors ${activeCategory === cat.id ? "text-foreground border-b border-foreground pb-1" : "text-muted-foreground hover:text-foreground"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-16">
            <Skeleton className="aspect-[16/8] w-full" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5] w-full" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && activeCategory === "all" && !query && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-20">
                <Link href={`/blog/${featured.slug}`} className="group grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={featured.coverImage || "https://hotelnahoui.net/wp-content/uploads/2024/06/piscine-1.jpg"}
                      alt={featured.title}
                      className="absolute inset-0 h-full w-full object-cover img-zoom"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="eyebrow text-primary">{featured.category?.name || "Non classé"}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {formatDate(featured.publishedAt)}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl lg:text-4xl font-light leading-tight">{featured.title}</h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                    <div className="mt-6">
                      <span className="link-underline text-foreground">Lire l&apos;article</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Grid */}
            {rest.length === 0 ? (
              <div className="text-center py-20">
                <Newspaper className="h-6 w-6 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun article ne correspond à votre recherche.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {rest.map((post, i) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
                  >
                    <Link href={`/blog/${post.slug}`} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={post.coverImage || "https://hotelnahoui.net/wp-content/uploads/2024/06/piscine-1.jpg"}
                          alt={post.title}
                          className="absolute inset-0 h-full w-full object-cover img-zoom"
                        />
                      </div>
                      <div className="pt-5">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="eyebrow text-primary">{post.category?.name || "Non classé"}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-light leading-snug line-clamp-2">{post.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        <span className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" /> {post.author.name}
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </>
        )}

        {/* Newsletter CTA */}
        <div className="mt-24 border-t border-border pt-16 text-center">
          <span className="eyebrow text-primary">Restons en contact</span>
          <h3 className="font-display mt-5 text-3xl sm:text-4xl font-light">Recevez nos actualités.</h3>
          <form onSubmit={(e) => e.preventDefault()} className="mt-8 flex flex-col sm:flex-row items-stretch gap-4 sm:gap-0 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 bg-transparent border-b border-border py-3 px-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
            <button type="submit" className="btn-fill-editorial sm:ml-6">S&apos;inscrire</button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
