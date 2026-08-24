"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  order: number;
};

export default function EditBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    isPublished: false,
    isFeatured: false,
    categoryId: "",
    order: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      fetchPost(id);
      fetchCategories();
    }
  }, []);

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/blog-posts/${id}`);
      const data = await response.json();
      if (data.success) {
        const postData = data.data.post;
        setPost(postData);
        setFormData({
          slug: postData.slug,
          title: postData.title,
          excerpt: postData.excerpt || "",
          content: postData.content,
          coverImage: postData.coverImage || "",
          isPublished: postData.isPublished,
          isFeatured: postData.isFeatured,
          categoryId: postData.categoryId || "",
          order: postData.order,
        });
      }
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/blog-categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          wasPublished: post?.isPublished,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/blog-posts");
      } else {
        alert("Erreur lors de la mise à jour: " + (data.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Error updating blog post:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    setDeleting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        router.push("/admin/blog-posts");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <PageHeader title="Modifier l'article de blog" />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre de l'article"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="url-de-l-article"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="excerpt">Extrait</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Courte description de l'article..."
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="content">Contenu *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Contenu complet de l'article..."
            rows={15}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Image de couverture</Label>
          <ImageUpload
            value={formData.coverImage}
            onChange={(value) => setFormData({ ...formData, coverImage: value })}
            folder="blog"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="order">Ordre</Label>
          <Input
            id="order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label htmlFor="published">Publier</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
            />
            <Label htmlFor="featured">À la une</Label>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Sauvegarde..." : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Suppression..." : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
