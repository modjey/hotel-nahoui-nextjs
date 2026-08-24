"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  /** URL actuellement enregistrée. */
  value?: string | null;
  /** Appelé avec la nouvelle URL après upload (ou "" si on retire l'image). */
  onChange: (url: string) => void;
  /** Sous-dossier dans public/uploads (ex: "locations", "rooms"). */
  folder?: string;
  /** Nom du champ caché (utile pour FormData natif). */
  name?: string;
  /** Largeur d'aperçu. */
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  name,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
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
      onChange(json.data.url as string);
      toast.success("Image téléversée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      {/* Hidden input forwarding the URL to native form submission */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}

      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative h-32 w-48 rounded-lg overflow-hidden border bg-muted shrink-0">
            <img src={value} alt="Aperçu" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              aria-label="Retirer l'image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-32 w-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs shrink-0">
            Aucune image
          </div>
        )}

        <div className="flex-1 space-y-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Téléversement..." : value ? "Remplacer l'image" : "Téléverser une image"}
          </Button>
          <div className="text-xs text-muted-foreground">
            JPG, PNG, WebP, GIF, AVIF · max 8 Mo
          </div>
          <Input
            type="text"
            placeholder="ou collez une URL externe"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}
