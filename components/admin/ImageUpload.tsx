"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compress";
import { registerPendingUpload } from "@/lib/pending-uploads";

interface ImageUploadProps {
  /** URL actuellement enregistrée. */
  value?: string | null;
  /** Appelé avec l'URL (blob local en attente, URL réelle après upload, "" si retrait). */
  onChange: (url: string) => void;
  /** Sous-dossier de destination (ex: "locations", "rooms"). */
  folder?: string;
  /** Clé du champ : nom du champ caché + clé dans le résultat de flushPendingUploads(). */
  name?: string;
  /** Endpoint d'upload (défaut : /api/admin/upload, réservé aux admins). */
  uploadUrl?: string;
  /** Largeur d'aperçu. */
  className?: string;
}

/**
 * Sélection d'image différée : le fichier choisi reste en mémoire (aperçu via
 * blob URL) et n'est envoyé au serveur qu'à la soumission du formulaire parent,
 * via flushPendingUploads() (lib/pending-uploads). Le `name` sert de clé pour
 * récupérer l'URL finale dans le handler submit.
 */
export function ImageUpload({
  value,
  onChange,
  folder = "general",
  name,
  uploadUrl = "/api/admin/upload",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Valeur enregistrée avant la sélection d'un fichier — permet d'annuler la sélection.
  const savedValueRef = useRef<string>("");
  // Refs lus par le flush enregistré (toujours à jour, sans réenregistrement).
  const pendingRef = useRef<File | null>(null);
  const blobRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  pendingRef.current = pendingFile;
  onChangeRef.current = onChange;

  const releaseBlob = () => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  };

  useEffect(() => {
    return registerPendingUpload({
      name,
      flush: async () => {
        const file = pendingRef.current;
        if (!file) return null;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message ?? "Erreur d'upload");
        }
        const url = json.data.url as string;
        setPendingFile(null);
        releaseBlob();
        savedValueRef.current = url;
        onChangeRef.current(url);
        return url;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, folder, uploadUrl]);

  useEffect(() => releaseBlob, []);

  const handleFile = async (file: File) => {
    setPreparing(true);
    try {
      const compressed = await compressImage(file);
      if (!pendingFile) savedValueRef.current = value ?? "";
      releaseBlob();
      const blobUrl = URL.createObjectURL(compressed);
      blobRef.current = blobUrl;
      setPendingFile(compressed);
      onChange(blobUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de lecture du fichier");
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = () => {
    if (pendingFile) {
      // Annule la sélection : on restaure l'image précédemment enregistrée.
      setPendingFile(null);
      releaseBlob();
      onChange(savedValueRef.current);
    } else {
      savedValueRef.current = "";
      onChange("");
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
            {pendingFile && (
              <span className="absolute bottom-1 left-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Non enregistrée
              </span>
            )}
            <button
              type="button"
              onClick={clear}
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
            disabled={preparing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={preparing}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {preparing ? "Préparation..." : value ? "Remplacer l'image" : "Téléverser une image"}
          </Button>
          {pendingFile && (
            <p className="text-xs text-amber-600">
              « {pendingFile.name} » sera envoyée à l'enregistrement.
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            JPG, PNG, WebP, GIF, AVIF · max 8 Mo
          </div>
          <Input
            type="text"
            placeholder="ou collez une URL externe"
            value={pendingFile ? "" : (value ?? "")}
            onChange={(e) => {
              if (pendingFile) {
                setPendingFile(null);
                releaseBlob();
              }
              onChange(e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}
