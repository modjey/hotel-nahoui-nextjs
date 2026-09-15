"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, Share2, Download, ZoomIn, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type Photo = {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  album: { id: string; name: string; slug: string; type: string };
};

type Album = {
  id: string;
  name: string;
  slug: string;
  type: string;
  coverImage: string | null;
  isFeatured: boolean;
  _count: { photos: number };
  location: { id: string; name: string; city: string | null } | null;
};

export function PhotobookPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredPhoto, setFeaturedPhoto] = useState<Photo | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [photoLikeCounts, setPhotoLikeCounts] = useState<Record<string, number>>({});

  const albumTypeLabels: Record<string, string> = {
    GALLERY: "Galerie",
    GUEST: "Album clients",
    EVENT: "Événement",
    ROOM: "Chambres",
    AMENITY: "Équipements",
  };

  const fetchAlbums = useCallback(async () => {
    try {
      const response = await fetch("/api/photobook/albums?isPublished=true");
      const data = await response.json();
      if (data.success) setAlbums(data.data.albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      let url = "/api/photobook/photos?isApproved=true";
      if (selectedAlbum !== "all") url += `&albumId=${selectedAlbum}`;
      if (selectedLocation !== "all") url += `&locationId=${selectedLocation}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPhotos(data.data.photos);
        if (selectedAlbum === "all" && !selectedLocation && !fromDate && !toDate) {
          setFeaturedPhoto(data.data.photos[0] || null);
        }
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  }, [selectedAlbum, selectedLocation, fromDate, toDate]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setZoom(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
    setSlideshowActive(false);
  };

  const resetFilters = () => {
    setSelectedAlbum("all");
    setSelectedLocation("all");
    setFromDate("");
    setToDate("");
  };

  const toggleLike = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photobook/likes/${photoId}`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setLikedPhotos((prev) => {
          const newSet = new Set(prev);
          if (data.liked) newSet.add(photoId); else newSet.delete(photoId);
          return newSet;
        });
        setPhotoLikeCounts((prev) => ({ ...prev, [photoId]: data.likeCount }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const fetchLikeStatus = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photobook/likes/${photoId}`);
      const data = await response.json();
      if (data.success) {
        setPhotoLikeCounts((prev) => ({ ...prev, [photoId]: data.likeCount }));
        if (data.liked) setLikedPhotos((prev) => new Set([...prev, photoId]));
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  const handleDownload = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photobook/download/${photoId}`);
      const data = await response.json();
      if (data.success) {
        const link = document.createElement("a");
        link.href = data.imageUrl;
        link.download = data.filename || "photo.jpg";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || "Erreur lors du téléchargement");
      }
    } catch (error) {
      console.error("Error downloading photo:", error);
      alert("Erreur lors du téléchargement");
    }
  };

  const handleShare = async (photoId: string, imageUrl: string) => {
    try {
      const response = await fetch(`/api/photobook/share/${photoId}?imageUrl=${encodeURIComponent(imageUrl)}`);
      const data = await response.json();
      if (data.success && navigator.share) {
        await navigator.share({ title: "Hôtel Nahoui Balmer", text: "Découvrez cette photo de l'Hôtel Nahoui Balmer", url: data.shareUrl });
      } else if (data.success) {
        navigator.clipboard.writeText(data.shareUrl);
        alert("Lien copié dans le presse-papier !");
      }
    } catch (error) {
      console.error("Error sharing photo:", error);
    }
  };

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  useEffect(() => {
    photos.forEach((photo) => { fetchLikeStatus(photo.id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const goToNext = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 3));
      else if (e.key === "-" || e.key === "_") setZoom((z) => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goToNext, goToPrevious]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (slideshowActive && lightboxOpen) {
      interval = setInterval(() => { goToNext(); }, 3000);
    }
    return () => clearInterval(interval);
  }, [slideshowActive, lightboxOpen, goToNext]);

  const uniqueLocations = Array.from(
    new Map(albums.filter((a) => a.location).map((a) => [a.location!.id, a.location!])).values()
  );

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-16 text-center">
          <span className="eyebrow text-primary">Galerie</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light">Photobook</h1>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16">
        {loading ? (
          <div>
            <div className="flex flex-wrap justify-center gap-6 mb-16">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-6 w-20" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-10">
              <button onClick={() => setShowFilters(!showFilters)} className="link-underline text-foreground">
                <Filter className="h-3.5 w-3.5" /> Filtres
              </button>

              {showFilters && (
                <div className="mt-6 border border-border p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="grid gap-2">
                      <Label className="eyebrow text-muted-foreground">Localisation</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les localisations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {uniqueLocations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name} {loc.city && `(${loc.city})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="eyebrow text-muted-foreground">Date de début</Label>
                      <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="eyebrow text-muted-foreground">Date de fin</Label>
                      <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                  </div>
                  <button onClick={resetFilters} className="link-underline text-foreground">
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap justify-center gap-8 mb-16 border-b border-border pb-8">
              <button
                onClick={() => setSelectedAlbum("all")}
                className={`eyebrow transition-colors ${selectedAlbum === "all" ? "text-foreground border-b border-foreground pb-1" : "text-muted-foreground hover:text-foreground"}`}
              >
                Tous
              </button>
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album.id)}
                  className={`eyebrow transition-colors ${selectedAlbum === album.id ? "text-foreground border-b border-foreground pb-1" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {album.name}
                </button>
              ))}
            </div>

            {/* Gallery grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: (index % 8) * 0.05 }}
                  className="group relative overflow-hidden aspect-[4/3] cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title || "Photo"}
                    className="h-full w-full object-cover img-zoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="eyebrow text-white/80 mb-1">{albumTypeLabels[photo.album.type] || photo.album.name}</p>
                    <h3 className="font-display text-lg text-white font-light mb-3">{photo.title || "Sans titre"}</h3>
                    <div className="flex gap-3 text-white">
                      <ZoomIn className="h-4 w-4" />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }}
                        className="flex items-center gap-1"
                      >
                        <Heart className={`h-4 w-4 ${likedPhotos.has(photo.id) ? "fill-white" : ""}`} />
                        {photoLikeCounts[photo.id] > 0 && <span className="text-xs">{photoLikeCounts[photo.id]}</span>}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleShare(photo.id, photo.imageUrl); }}>
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(photo.id); }}>
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Featured photo */}
            {featuredPhoto && (
              <div className="mt-24">
                <div className="text-center mb-14">
                  <span className="eyebrow text-primary">À la une</span>
                  <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Photo du mois</h2>
                </div>
                <div className="relative overflow-hidden aspect-[21/9]">
                  <img src={featuredPhoto.imageUrl} alt={featuredPhoto.title || "Photo du mois"} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                    <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-3">{featuredPhoto.title || "Photo du mois"}</h3>
                    {featuredPhoto.description && (
                      <p className="text-white/85 max-w-2xl text-sm sm:text-base">{featuredPhoto.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xl flex items-center justify-center">
          <button onClick={closeLightbox} className="absolute top-6 right-6 text-white/80 hover:text-white z-10">
            <X className="h-6 w-6" />
          </button>

          <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10">
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10">
            <ChevronRight className="h-8 w-8" />
          </button>

          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <img
              src={photos[currentPhotoIndex].imageUrl}
              alt={photos[currentPhotoIndex].title || "Photo"}
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-black/60 px-6 py-3 text-white text-sm">
            <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="eyebrow">Zoom −</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="eyebrow">Zoom +</button>
            <div className="w-px h-4 bg-white/30" />
            <button onClick={() => setSlideshowActive(!slideshowActive)} className="eyebrow">
              {slideshowActive ? "Pause" : "Diaporama"}
            </button>
            <span>{currentPhotoIndex + 1} / {photos.length}</span>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
