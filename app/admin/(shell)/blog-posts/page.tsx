"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: {
    name: string;
  };
  category: {
    name: string | null;
  } | null;
};

export default function BlogPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [filter, page]);

  const fetchPosts = async () => {
    try {
      const isPublished = filter === "all" ? undefined : filter === "published" ? "true" : "false";
      const response = await fetch(`/api/admin/blog-posts?isPublished=${isPublished ?? ""}&page=${page}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.data.posts);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleFilterChange = (newFilter: "all" | "published" | "draft") => {
    setFilter(newFilter);
    setPage(1);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Articles de blog"
        description="Gérez les articles de blog du site"
        actions={
          <Button onClick={() => router.push("/admin/blog-posts/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        }
      />

      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => handleFilterChange("all")}
        >
          Tous
        </Button>
        <Button
          variant={filter === "published" ? "default" : "outline"}
          onClick={() => handleFilterChange("published")}
        >
          Publiés
        </Button>
        <Button
          variant={filter === "draft" ? "default" : "outline"}
          onClick={() => handleFilterChange("draft")}
        >
          Brouillons
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4">Titre</th>
              <th className="text-left p-4">Auteur</th>
              <th className="text-left p-4">Catégorie</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-left p-4">Publié le</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-border">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{post.title}</div>
                    <div className="text-sm text-muted-foreground">{post.slug}</div>
                  </div>
                </td>
                <td className="p-4">{post.author.name}</td>
                <td className="p-4">{post.category?.name || "-"}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {post.isPublished ? (
                      <span className="text-green-600">Publié</span>
                    ) : (
                      <span className="text-yellow-600">Brouillon</span>
                    )}
                    {post.isFeatured && <span className="text-blue-600">À la une</span>}
                  </div>
                </td>
                <td className="p-4">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("fr-FR")
                    : "-"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/blog-posts/${post.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Aucun article trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
