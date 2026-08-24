"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api-client";
import { Loader2, Plus, Trash2, Link as LinkIcon, Youtube, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export type MediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO";
  provider: "LOCAL" | "YOUTUBE" | "EXTERNAL";
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  alt: string | null;
  order: number;
};

interface MediaGalleryProps {
  /** ID de la chambre (mutuellement exclusif avec locationId) */
  roomId?: string;
  /** ID de la localisation (mutuellement exclusif avec roomId) */
  locationId?: string;
  /** Médias actuels triés par ordre. */
  media: MediaItem[];
  /** Appelé après chaque mutation. */
  onChange: () => void;
  /** Sous-dossier pour stocker les uploads locaux. */
  folder?: string;
}

export function MediaGallery({
  roomId,
  locationId,
  media,
  onChange,
  folder = "general",
}: MediaGalleryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addingYt, setAddingYt] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");

  const parentPayload = roomId ? { roomId } : { locationId };

  // Extract YouTube video ID from URL
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        // Étape 1 : upload binaire
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message ?? "Erreur d'upload");
        }
        const url = json.data.url as string;

        // Étape 2 : création du Media en base
        await api.post("/api/admin/admin-media", {
          type: "IMAGE",
          provider: "LOCAL",
          url,
          title: file.name,
          order: media.length + count,
          ...parentPayload,
        });
        count++;
      }
      toast.success(`${count} image${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""}`);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setAddingYt(true);
    try {
      await api.post("/api/admin/admin-media", {
        type: "VIDEO",
        provider: "YOUTUBE",
        url: youtubeUrl.trim(),
        order: media.length,
        ...parentPayload,
      });
      toast.success("Vidéo ajoutée");
      setYoutubeUrl("");
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setAddingYt(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce média ?")) return;
    try {
      await api.del(`/api/admin/admin-media/${id}`);
      toast.success("Supprimé");
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const startEdit = (m: MediaItem) => {
    setEditingId(m.id);
    setEditTitle(m.title ?? "");
    setEditAlt(m.alt ?? "");
  };

  const saveEdit = async (id: string) => {
    try {
      await api.patch(`/api/admin/admin-media/${id}`, {
        title: editTitle || null,
        alt: editAlt || null,
      });
      toast.success("Mis à jour");
      setEditingId(null);
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {uploading ? "Téléversement..." : "Ajouter des images"}
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <Youtube className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="URL YouTube (https://youtube.com/...)"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={addingYt}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={addingYt || !youtubeUrl.trim()}
            onClick={addYoutube}
          >
            {addingYt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
          </Button>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
          Aucun média. Téléversez des images ou ajoutez des vidéos YouTube ci-dessus.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((m) => (
            <div
              key={m.id}
              className="group relative rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="aspect-video bg-muted relative">
                {m.type === "IMAGE" ? (
                  <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />
                ) : m.provider === "YOUTUBE" || (m.type === "VIDEO" && (m.url.includes('youtube.com') || m.url.includes('youtu.be'))) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeId(m.url)}`}
                    title={m.title ?? "YouTube video"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <LinkIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-black/60 text-white text-[10px] uppercase px-2 py-0.5 rounded">
                    {m.type === "VIDEO" ? "Vidéo" : "Image"}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/80"
                    aria-label="Modifier"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="h-7 w-7 rounded-full bg-destructive/90 text-white grid place-items-center hover:bg-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {editingId === m.id ? (
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Titre"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Texte alternatif"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 flex-1"
                      onClick={() => saveEdit(m.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-2 text-xs truncate">
                  <div className="font-medium truncate">{m.title || "Sans titre"}</div>
                  {m.alt && <div className="text-muted-foreground truncate">{m.alt}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
